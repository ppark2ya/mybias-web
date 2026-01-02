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
  const fileName = `${predictionId}.${ext}`;
  const date = new Date();
  const datePrefix = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
  const key = `generations/${datePrefix}/${fileName}`;

  // Upload to R2
  await bucket.put(key, imageBuffer, {
    httpMetadata: {
      contentType,
      contentDisposition: `attachment; filename="${fileName}"`,
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
