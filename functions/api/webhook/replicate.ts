interface Env {
  REPLICATE_WEBHOOK_SECRET?: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  R2_BUCKET: R2Bucket;
  R2_PUBLIC_URL: string;
}

interface ReplicateWebhookPayload {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[];
  error?: string;
  created_at: string;
  completed_at?: string;
}

/**
 * Validate webhook request from Replicate
 * Replicate signs webhooks with HMAC-SHA256
 */
async function validateWebhook(
  request: Request,
  secret?: string
): Promise<boolean> {
  // If no secret configured, skip validation (not recommended for production)
  if (!secret) {
    console.warn("REPLICATE_WEBHOOK_SECRET not configured - skipping validation");
    return true;
  }

  const signature = request.headers.get("webhook-signature");
  if (!signature) {
    console.error("Missing webhook-signature header");
    return false;
  }

  // Parse the signature header (format: t=timestamp,v1=signature)
  const parts = signature.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const sig = parts.find((p) => p.startsWith("v1="))?.slice(3);

  if (!timestamp || !sig) {
    console.error("Invalid webhook-signature format");
    return false;
  }

  // Get request body
  const body = await request.clone().text();

  // Create signed payload
  const signedPayload = `${timestamp}.${body}`;

  // Calculate expected signature
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signedPayload)
  );
  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return sig === expectedSignature;
}

/**
 * Download image from URL and upload to R2
 */
async function uploadToR2(
  bucket: R2Bucket,
  imageUrl: string,
  predictionId: string
): Promise<string> {
  // Download image from Replicate
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  const imageBuffer = await response.arrayBuffer();
  const contentType = response.headers.get("content-type") || "image/png";

  // Determine file extension from content type
  const extMap: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
  };
  const ext = extMap[contentType] || "png";

  // Generate R2 key with date-based path for organization
  const date = new Date();
  const datePrefix = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
  const key = `generations/${datePrefix}/${predictionId}.${ext}`;

  // Upload to R2
  await bucket.put(key, imageBuffer, {
    httpMetadata: {
      contentType,
    },
  });

  return key;
}

/**
 * Update generation record in Supabase
 */
async function updateGenerationRecord(
  env: Env,
  predictionId: string,
  updates: {
    status: string;
    output_image_url?: string;
    replicate_output_url?: string;
    error_message?: string;
    completed_at?: string;
  }
): Promise<void> {
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/image_generations?prediction_id=eq.${predictionId}`,
    {
      method: "PATCH",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        ...updates,
        updated_at: new Date().toISOString(),
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update generation record: ${errorText}`);
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;

    // Validate webhook signature
    const isValid = await validateWebhook(request, env.REPLICATE_WEBHOOK_SECRET);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse webhook payload
    const payload: ReplicateWebhookPayload = await request.json();
    console.log("Received Replicate webhook:", payload.id, payload.status);

    const { id: predictionId, status, output, error, completed_at } = payload;

    // Handle different statuses
    if (status === "succeeded" && output) {
      // Get the output URL (can be string or array)
      const outputUrl = Array.isArray(output) ? output[0] : output;

      if (!outputUrl) {
        console.error("No output URL in succeeded prediction:", predictionId);
        await updateGenerationRecord(env, predictionId, {
          status: "failed",
          error_message: "No output URL received",
          completed_at: completed_at || new Date().toISOString(),
        });
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Upload to R2
      let r2Key: string;
      try {
        r2Key = await uploadToR2(env.R2_BUCKET, outputUrl, predictionId);
      } catch (uploadError) {
        console.error("Failed to upload to R2:", uploadError);
        // Still update record with Replicate URL as fallback
        await updateGenerationRecord(env, predictionId, {
          status: "succeeded",
          replicate_output_url: outputUrl,
          error_message: `R2 upload failed: ${uploadError instanceof Error ? uploadError.message : "Unknown error"}`,
          completed_at: completed_at || new Date().toISOString(),
        });
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Build public URL for R2 object
      const publicUrl = `${env.R2_PUBLIC_URL}/${r2Key}`;

      // Update database record
      await updateGenerationRecord(env, predictionId, {
        status: "succeeded",
        output_image_url: publicUrl,
        replicate_output_url: outputUrl,
        completed_at: completed_at || new Date().toISOString(),
      });

      console.log("Successfully processed prediction:", predictionId, "->", publicUrl);
    } else if (status === "failed" || status === "canceled") {
      // Update record with error status
      await updateGenerationRecord(env, predictionId, {
        status,
        error_message: error || `Prediction ${status}`,
        completed_at: completed_at || new Date().toISOString(),
      });

      console.log("Prediction failed/canceled:", predictionId, error);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
