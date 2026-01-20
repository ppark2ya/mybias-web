import { eq, sql } from "drizzle-orm";
import {
  imageGenerations,
  ImageGenerationStatus,
  profiles,
  CreditTransactionType,
} from "../../src/db/schema";
import { ReplicateModels } from "../../src/constants/replicate";
import type { ReplicatePredictionStatusType } from "../../src/constants/replicate";
import type { ContextData, DbClient } from "../types.d.ts";
import { recordCreditTransaction } from "../lib/credit";

interface Env {
  REPLICATE_API_TOKEN: string;
  BASE_URL: string;
}

interface ProRestoreRequest {
  image: string; // Base64 encoded image
  upscale?: number; // Default: 2
  fidelity?: number; // CodeFormer fidelity (0.5-0.6 recommended)
  blendRatio?: number; // Blend ratio for CodeFormer (0.7 = 70% CodeFormer, 30% Real-ESRGAN)
}

interface ReplicatePredictionResponse {
  id: string;
  model: string;
  version: string;
  status: ReplicatePredictionStatusType;
  input: Record<string, unknown>;
  output?: string | string[] | null;
  error?: string | null;
  logs?: string;
  metrics?: {
    predict_time?: number;
  };
  created_at: string;
  started_at?: string;
  completed_at?: string;
  urls: {
    get: string;
    cancel: string;
  };
}

/** Pro Restore costs 3 credits (runs 2 models but user pays for 1.5 each) */
const PRO_RESTORE_CREDIT_COST = 3;

/**
 * Check user credits and deduct specified amount if available
 * Returns remaining credits after deduction, or null if insufficient
 */
async function checkAndDeductCredits(
  db: DbClient,
  userId: string,
  amount: number
): Promise<number | null> {
  // Atomically check and deduct credits
  const result = await db
    .update(profiles)
    .set({
      credits: sql`${profiles.credits} - ${amount}`,
      updatedAt: new Date(),
    })
    .where(sql`${eq(profiles.id, userId)} AND ${profiles.credits} >= ${amount}`)
    .returning({ credits: profiles.credits });

  if (result.length === 0) {
    return null; // Insufficient credits or user not found
  }

  return result[0].credits;
}

/**
 * Save image generation record to database using drizzle-orm
 */
async function saveGenerationRecord(
  db: DbClient,
  predictionId: string,
  userId: string
): Promise<void> {
  await db.insert(imageGenerations).values({
    predictionId,
    userId,
    status: ImageGenerationStatus.PENDING,
  });
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a Replicate prediction with retry logic for rate limiting
 */
async function createPrediction(
  apiToken: string,
  version: string,
  input: Record<string, unknown>,
  webhookUrl: string | null,
  maxRetries: number = 3
): Promise<ReplicatePredictionResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version,
        input,
        ...(webhookUrl && {
          webhook: webhookUrl,
          webhook_events_filter: ["completed"],
        }),
      }),
    });

    if (response.ok) {
      return response.json();
    }

    // Handle rate limiting (429)
    if (response.status === 429) {
      const retryAfter = response.headers.get("retry-after");
      const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : (attempt + 1) * 5000;
      console.log(`Rate limited, waiting ${waitTime}ms before retry (attempt ${attempt + 1}/${maxRetries})`);
      await sleep(waitTime);
      lastError = new Error(`Rate limited after ${maxRetries} retries`);
      continue;
    }

    const errorText = await response.text();
    throw new Error(`Replicate API error: ${errorText}`);
  }

  throw lastError || new Error("Failed to create prediction");
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

    // 1. Check if user is authenticated (required)
    const user = data.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "로그인이 필요합니다.",
          code: "UNAUTHORIZED",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // 2. Check and deduct credits
    const remainingCredits = await checkAndDeductCredits(
      db,
      user.id,
      PRO_RESTORE_CREDIT_COST
    );
    if (remainingCredits === null) {
      return new Response(
        JSON.stringify({
          error: `크레딧이 부족합니다. Pro 복원은 ${PRO_RESTORE_CREDIT_COST} 크레딧이 필요합니다.`,
          code: "INSUFFICIENT_CREDITS",
        }),
        {
          status: 402, // Payment Required
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const {
      image,
      upscale = 2,
      fidelity = 0.5, // CodeFormer fidelity (0.5 recommended for face restoration)
      blendRatio = 0.7, // 70% CodeFormer, 30% Real-ESRGAN
    }: ProRestoreRequest = await request.json();

    if (!image) {
      return new Response(JSON.stringify({ error: "Image is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const apiToken = env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      return new Response(
        JSON.stringify({ error: "API token not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Build webhook URL for completed predictions
    const webhookUrl = env.BASE_URL
      ? `${env.BASE_URL}/api/webhook/replicate`
      : null;

    // Create predictions sequentially to avoid rate limiting
    // (Replicate has burst limit of 1 when account credit < $5)
    // 1. Real-ESRGAN: Good for skin texture, pores (but blurry faces)
    // 2. CodeFormer: Good for facial features (but waxy skin)

    // First: Real-ESRGAN prediction
    const realEsrganResult = await createPrediction(
      apiToken,
      ReplicateModels.REAL_ESRGAN,
      {
        image,
        scale: upscale,
        face_enhance: false, // Don't use built-in face enhance, we'll blend with CodeFormer
      },
      webhookUrl
    );

    // Wait before second request to avoid rate limiting
    await sleep(2000);

    // Second: CodeFormer prediction
    const codeformerResult = await createPrediction(
      apiToken,
      ReplicateModels.CODEFORMER,
      {
        image,
        upscale,
        codeformer_fidelity: fidelity,
        background_enhance: true,
        face_upsample: true,
      },
      webhookUrl
    );

    // Save generation records to database
    try {
      // Save both prediction records
      await Promise.all([
        saveGenerationRecord(db, realEsrganResult.id, user.id),
        saveGenerationRecord(db, codeformerResult.id, user.id),
      ]);

      // Record credit transaction for history (using CodeFormer ID as reference)
      await recordCreditTransaction(
        db,
        user.id,
        -PRO_RESTORE_CREDIT_COST,
        CreditTransactionType.USAGE,
        codeformerResult.id,
        "Pro restoration (blending)"
      );
    } catch (err) {
      console.error("Failed to save generation records:", err);
      return new Response(
        JSON.stringify({ error: "Failed to save generation records" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Return both prediction IDs for client-side polling and blending
    return new Response(
      JSON.stringify({
        // Primary ID for compatibility (use CodeFormer as primary)
        id: codeformerResult.id,
        status: "pending",
        // Dual prediction IDs for blending
        predictions: {
          realEsrgan: {
            id: realEsrganResult.id,
            status: realEsrganResult.status,
          },
          codeformer: {
            id: codeformerResult.id,
            status: codeformerResult.status,
          },
        },
        // Blend ratio for client-side blending
        blendRatio,
        remainingCredits,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Pro restore error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        code: "INTERNAL_ERROR",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};
