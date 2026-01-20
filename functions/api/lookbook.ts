import { eq, sql } from "drizzle-orm";
import {
  CreditTransactionType,
  imageGenerations,
  ImageGenerationStatus,
  profiles,
} from "../../src/db/schema";
import { recordCreditTransaction } from "../lib/credit";
import type { ContextData, DbClient } from "../types.d.ts";

interface Env {
  REPLICATE_API_TOKEN: string;
  BASE_URL: string;
  R2_BUCKET: R2Bucket;
  R2_PUBLIC_URL: string;
}

interface LookbookRequest {
  human_image: string; // URL or Base64 (handled as URL from frontend upload ideally, creates temp URL)
  garm_image: string; // URL or Base64
  garment_des?: string;
}

// IDM-VTON Model
const REPLICATE_MODEL_VERSION = "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985";

const COST_PER_GENERATION = 7; // Increased to cover IDM-VTON + Face Swap

/**
 * Check user credits and deduct credits if available
 */
async function checkAndDeductCredit(
  db: DbClient,
  userId: string,
  cost: number
): Promise<number | null> {
  const result = await db
    .update(profiles)
    .set({
      credits: sql`${profiles.credits} - ${cost}`,
      updatedAt: new Date(),
    })
    .where(sql`${eq(profiles.id, userId)} AND ${profiles.credits} >= ${cost}`)
    .returning({ credits: profiles.credits });

  if (result.length === 0) {
    return null;
  }

  return result[0].credits;
}

async function saveGenerationRecord(
  db: DbClient,
  predictionId: string,
  userId: string,
  stage: number,
  originalImageUrl?: string
): Promise<void> {
  await db.insert(imageGenerations).values({
    predictionId,
    userId,
    status: ImageGenerationStatus.PENDING,
    stage,
    originalImageUrl,
  });
}

/**
 * Upload base64 original image to R2 for face swap
 */
async function uploadOriginalImageToR2(
  bucket: R2Bucket,
  base64Image: string,
  userId: string
): Promise<string> {
  // Remove data URL prefix if present
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
  
  // Convert base64 to ArrayBuffer
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Generate R2 key with date-based path
  const timestamp = Date.now();
  const fileName = `${userId}_${timestamp}.jpg`;
  const date = new Date();
  const datePrefix = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
  const key = `original-images/${datePrefix}/${fileName}`;
  
  // Upload to R2
  await bucket.put(key, bytes.buffer, {
    httpMetadata: {
      contentType: "image/jpeg",
    },
    customMetadata: {
      userId,
      purpose: "face-swap-source",
    },
  });
  
  return key;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const onRequestPost: PagesFunction<Env, string, ContextData> = async (
  context
) => {
  try {
    const { request, env, data } = context;
    const db = data.db;

    // 1. Auth Check
    const user = data.user;
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Login required", code: "UNAUTHORIZED" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 2. Credit Check
    const remainingCredits = await checkAndDeductCredit(db, user.id, COST_PER_GENERATION);
    if (remainingCredits === null) {
      return new Response(
        JSON.stringify({ error: "Insufficient credits", code: "INSUFFICIENT_CREDITS" }),
        { status: 402, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { human_image, garm_image, garment_des = "A cool outfit" }: LookbookRequest = await request.json();

    if (!human_image || !garm_image) {
      return new Response(JSON.stringify({ error: "Both images are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // 3. Upload original user image to R2 for later face swap
    const originalImageKey = await uploadOriginalImageToR2(
      env.R2_BUCKET,
      human_image,
      user.id
    );
    const originalImageUrl = `${env.R2_PUBLIC_URL}/${originalImageKey}`;

    // 4. Call Replicate IDM-VTON (Stage 1)
    const webhookUrl = env.BASE_URL
      ? `${env.BASE_URL}/api/webhook/replicate`
      : null;

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: REPLICATE_MODEL_VERSION,
        input: {
          human_img: human_image,
          garm_img: garm_image,
          garment_des: garment_des,
          // crop: false, // Optional params
          steps: 40,
          crop: false,
        },
        ...(webhookUrl && {
          webhook: webhookUrl,
          webhook_events_filter: ["completed"],
        }),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Replicate API error:", errorText);
      // Refund credits? ideally yes, but for now simple logging
      return new Response(
        JSON.stringify({ error: "Failed to start generation" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const result = await response.json();

    // 5. Save Stage 1 Record with metadata
    if (result.id) {
      await saveGenerationRecord(
        db,
        result.id,
        user.id,
        1, // Stage 1: IDM-VTON
        originalImageUrl // Store R2 URL for Stage 2
      );
      await recordCreditTransaction(
        db,
        user.id,
        -COST_PER_GENERATION,
        CreditTransactionType.USAGE,
        result.id,
        "AI Lookbook Try-On (Stage 1 + 2)"
      );
    }

    return new Response(
      JSON.stringify({ ...result, remainingCredits }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("Lookbook API error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};
