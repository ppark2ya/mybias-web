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
  prompt?: string; // Positive prompt
  negativePrompt?: string; // Negative prompt
  denoisingStrength?: number; // Default: 0.3
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

/** Pro Restore costs 4 credits */
const PRO_RESTORE_CREDIT_COST = 4;

/** Default prompts optimized for photo restoration (minimal to preserve original) */
const DEFAULT_PROMPTS = {
  positive: "high quality photo, sharp focus, natural",
  negative: "blurry, artifacts, noise, distorted",
};

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

    // 2. Check and deduct credits (Pro Restore costs 3 credits)
    const remainingCredits = await checkAndDeductCredits(
      db,
      user.id,
      PRO_RESTORE_CREDIT_COST
    );
    if (remainingCredits === null) {
      return new Response(
        JSON.stringify({
          error: "크레딧이 부족합니다. Pro 복원은 4 크레딧이 필요합니다.",
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
      prompt = DEFAULT_PROMPTS.positive,
      negativePrompt = DEFAULT_PROMPTS.negative,
      denoisingStrength = 0.3,
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

    // Create prediction with Clarity Upscaler (SDXL-based with prompt support)
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: ReplicateModels.CLARITY_UPSCALER,
        input: {
          image,
          prompt,
          negative_prompt: negativePrompt,
          scale_factor: upscale,
          resemblance: 0.95, // High value to preserve original face
          creativity: 0.05, // Minimal AI creativity to prevent face changes
          dynamic: 3, // Lower value for less aggressive processing
          sd_model: "juggernaut_reborn.safetensors [338b85bc4f]", // Best for realistic photos
          scheduler: "DPM++ 3M SDE Karras",
          num_inference_steps: 18,
          output_format: "png",
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
      return new Response(
        JSON.stringify({ error: "Failed to create prediction" }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const result: ReplicatePredictionResponse = await response.json();

    // Save generation record to database (synchronous - fail fast if DB write fails)
    if (result.id) {
      try {
        await saveGenerationRecord(db, result.id, user.id);
        // Record credit transaction for history
        await recordCreditTransaction(
          db,
          user.id,
          -PRO_RESTORE_CREDIT_COST,
          CreditTransactionType.USAGE,
          result.id,
          "Pro restoration"
        );
      } catch (err) {
        console.error("Failed to save generation record:", err);
        return new Response(
          JSON.stringify({ error: "Failed to save generation record" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    // Return with prediction id and remaining credits
    return new Response(
      JSON.stringify({
        ...result,
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
