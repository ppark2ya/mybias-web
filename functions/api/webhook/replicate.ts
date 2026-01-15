import { eq } from "drizzle-orm";
import {
  imageGenerations,
  ImageGenerationStatus,
  type ImageGenerationStatusType,
} from "../../../src/db/schema";
import {
  ReplicatePredictionStatus,
  type ReplicatePredictionStatusType,
} from "../../../src/constants/replicate";
import { createDbClient } from "../../lib/db";
import type { DbClient } from "../../types";

interface Env {
  DATABASE_URL: string;
  REPLICATE_WEBHOOK_SECRET?: string;
  REPLICATE_API_TOKEN: string;
  BASE_URL: string;
  R2_BUCKET: R2Bucket;
  R2_PUBLIC_URL: string;
}

interface ReplicateWebhookPayload {
  id: string;
  status: ReplicatePredictionStatusType;
  output?: string | string[];
  error?: string;
  created_at: string;
  completed_at?: string;
}

/**
 * Validate webhook request from Replicate
 * Replicate signs webhooks with HMAC-SHA256
 *
 * Headers:
 * - webhook-id: unique message identifier
 * - webhook-timestamp: timestamp in seconds since epoch
 * - webhook-signature: Base64 encoded signatures (space delimited, format: "v1,signature")
 *
 * Signed content: `${webhook_id}.${webhook_timestamp}.${body}`
 * Secret format: "whsec_<base64_key>" - need to extract and decode the base64 part
 *
 * @see https://replicate.com/docs/topics/webhooks/verify-webhook
 */
async function validateWebhook(
  request: Request,
  secret?: string
): Promise<boolean> {
  // If no secret configured, skip validation (not recommended for production)
  if (!secret) {
    console.warn(
      "REPLICATE_WEBHOOK_SECRET not configured - skipping validation"
    );
    return true;
  }

  // Get required headers
  const webhookId = request.headers.get("webhook-id");
  const webhookTimestamp = request.headers.get("webhook-timestamp");
  const webhookSignature = request.headers.get("webhook-signature");

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    console.error("Missing required webhook headers:", {
      hasId: !!webhookId,
      hasTimestamp: !!webhookTimestamp,
      hasSignature: !!webhookSignature,
    });
    return false;
  }

  // Verify timestamp is within tolerance (5 minutes)
  const timestampSeconds = parseInt(webhookTimestamp, 10);
  const currentSeconds = Math.floor(Date.now() / 1000);
  const tolerance = 5 * 60; // 5 minutes

  if (Math.abs(currentSeconds - timestampSeconds) > tolerance) {
    console.error("Webhook timestamp outside tolerance window");
    return false;
  }

  // Parse signatures (space-delimited, format: "v1,base64signature")
  const signatures = webhookSignature.split(" ");
  const v1Signatures: string[] = [];

  for (const sig of signatures) {
    const [version, signature] = sig.split(",");
    if (version === "v1" && signature) {
      v1Signatures.push(signature);
    }
  }

  if (v1Signatures.length === 0) {
    console.error("No v1 signatures found in webhook-signature header");
    return false;
  }

  // Get request body (must be raw, unmodified)
  const body = await request.clone().text();

  // Create signed payload: webhook_id.webhook_timestamp.body
  const signedPayload = `${webhookId}.${webhookTimestamp}.${body}`;

  // Extract base64 key from secret (remove "whsec_" prefix)
  const secretKey = secret.startsWith("whsec_") ? secret.slice(6) : secret;

  // Decode base64 secret key
  const keyBytes = Uint8Array.from(atob(secretKey), (c) => c.charCodeAt(0));

  // Calculate expected signature using HMAC-SHA256
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(signedPayload)
  );

  // Convert to base64 for comparison
  const expectedSignature = btoa(
    String.fromCharCode(...new Uint8Array(signatureBytes))
  );

  // Compare with provided signatures (constant-time comparison)
  for (const providedSig of v1Signatures) {
    if (timingSafeEqual(expectedSignature, providedSig)) {
      return true;
    }
  }

  console.error("Webhook signature verification failed");
  return false;
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
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
  const fileName = `${predictionId}.${ext}`;
  const date = new Date();
  const datePrefix = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
  const key = `generations/${datePrefix}/${fileName}`;

  // Upload to R2
  await bucket.put(key, imageBuffer, {
    httpMetadata: {
      contentType,
    },
    customMetadata: {
      predictionId,
    },
  });

  return key;
}

/**
 * Update generation record in database using drizzle-orm
 */
async function updateGenerationRecord(
  db: DbClient,
  predictionId: string,
  updates: {
    status: ImageGenerationStatusType;
    outputImageUrl?: string;
    replicateOutputUrl?: string;
    errorMessage?: string;
    completedAt?: Date;
  }
): Promise<void> {
  await db
    .update(imageGenerations)
    .set({
      status: updates.status,
      outputImageUrl: updates.outputImageUrl,
      replicateOutputUrl: updates.replicateOutputUrl,
      errorMessage: updates.errorMessage,
      completedAt: updates.completedAt,
      updatedAt: new Date(),
    })
    .where(eq(imageGenerations.predictionId, predictionId));
}

// Face swap model
const FACE_SWAP_MODEL = "codeplugtech/face-swap";
const FACE_SWAP_VERSION = "278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34";

/**
 * Trigger Stage 2: Face Swap
 */
async function triggerFaceSwap(
  env: Env,
  db: DbClient,
  parentPredictionId: string,
  originalImageUrl: string,
  stage1ResultUrl: string,
  userId: string
): Promise<void> {
  const webhookUrl = env.BASE_URL
    ? `${env.BASE_URL}/api/webhook/replicate`
    : null;

  // Call face swap API
  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${env.REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: FACE_SWAP_VERSION,
      input: {
        swap_image: originalImageUrl,  // Source face (original user photo)
        target_image: stage1ResultUrl,  // Target image (IDM-VTON result)
      },
      ...(webhookUrl && {
        webhook: webhookUrl,
        webhook_events_filter: ["completed"],
      }),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Face swap API error:", errorText);
    throw new Error(`Failed to start face swap: ${response.status}`);
  }

  const result = await response.json();

  // Save Stage 2 record
  if (result.id) {
    await db.insert(imageGenerations).values({
      predictionId: result.id,
      userId,
      status: ImageGenerationStatus.PENDING,
      stage: 2,
      parentId: parentPredictionId,
    });
    console.log(`Stage 2 face swap started: ${result.id} (parent: ${parentPredictionId})`);
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;

    // Validate webhook signature
    const isValid = await validateWebhook(
      request,
      env.REPLICATE_WEBHOOK_SECRET
    );
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create database client (webhook doesn't go through middleware)
    const db = createDbClient(env.DATABASE_URL);

    // Parse webhook payload
    const payload: ReplicateWebhookPayload = await request.json();
    console.log("Received Replicate webhook:", payload.id, payload.status);

    const { id: predictionId, status, output, error, completed_at } = payload;

    // Handle different statuses
    if (status === ReplicatePredictionStatus.SUCCEEDED && output) {
      // Get the output URL (can be string or array)
      const outputUrl = Array.isArray(output) ? output[0] : output;

      if (!outputUrl) {
        console.error("No output URL in succeeded prediction:", predictionId);
        await updateGenerationRecord(db, predictionId, {
          status: ImageGenerationStatus.FAILED,
          errorMessage: "No output URL received",
          completedAt: completed_at ? new Date(completed_at) : new Date(),
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
        await updateGenerationRecord(db, predictionId, {
          status: ImageGenerationStatus.SUCCEEDED,
          replicateOutputUrl: outputUrl,
          errorMessage: `R2 upload failed: ${uploadError instanceof Error ? uploadError.message : "Unknown error"}`,
          completedAt: completed_at ? new Date(completed_at) : new Date(),
        });
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Build public URL for R2 object
      const publicUrl = `${env.R2_PUBLIC_URL}/${r2Key}`;

      // Update database record
      await updateGenerationRecord(db, predictionId, {
        status: ImageGenerationStatus.SUCCEEDED,
        outputImageUrl: publicUrl,
        replicateOutputUrl: outputUrl,
        completedAt: completed_at ? new Date(completed_at) : new Date(),
      });

      console.log(
        "Successfully processed prediction:",
        predictionId,
        "->",
        publicUrl
      );

      // Check if this is Stage 1 of a multi-stage lookbook generation
      const [generationRecord] = await db
        .select()
        .from(imageGenerations)
        .where(eq(imageGenerations.predictionId, predictionId))
        .limit(1);

      if (generationRecord?.stage === 1 && generationRecord.originalImageUrl) {
        console.log("Stage 1 complete, triggering Stage 2 face swap...");
        
        // Trigger Stage 2: Face Swap
        try {
          await triggerFaceSwap(
            env,
            db,
            predictionId,
            generationRecord.originalImageUrl,
            publicUrl,
            generationRecord.userId || ""
          );
        } catch (faceSwapError) {
          console.error("Failed to trigger face swap:", faceSwapError);
          // Don't fail the webhook - Stage 1 result is still valid
        }
      }
    } else if (status === ReplicatePredictionStatus.FAILED) {
      await updateGenerationRecord(db, predictionId, {
        status: ImageGenerationStatus.FAILED,
        errorMessage: error || "Prediction failed",
        completedAt: completed_at ? new Date(completed_at) : new Date(),
      });
      console.log("Prediction failed:", predictionId, error);
    } else if (status === ReplicatePredictionStatus.CANCELED) {
      await updateGenerationRecord(db, predictionId, {
        status: ImageGenerationStatus.CANCELED,
        errorMessage: error || "Prediction canceled",
        completedAt: completed_at ? new Date(completed_at) : new Date(),
      });
      console.log("Prediction canceled:", predictionId, error);
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
