import { eq, sql } from "drizzle-orm";
import {
  imageGenerations,
  ImageGenerationStatus,
  profiles,
} from "../../src/db/schema";
import { ReplicateModels } from "../../src/constants/replicate";
import type { ReplicatePredictionStatusType } from "../../src/constants/replicate";
import type { ContextData, DbClient } from "../types";

interface Env {
  REPLICATE_API_TOKEN: string;
  BASE_URL: string;
}

interface EraserRequest {
  image: string; // Base64 encoded original image
  mask: string; // Base64 encoded mask image (white = erase, black = keep)
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

/**
 * Check user credits and deduct 1 credit if available
 * Returns remaining credits after deduction, or null if insufficient
 */
async function checkAndDeductCredit(
  db: DbClient,
  userId: string
): Promise<number | null> {
  // Atomically check and deduct credit
  const result = await db
    .update(profiles)
    .set({
      credits: sql`${profiles.credits} - 1`,
      updatedAt: new Date(),
    })
    .where(sql`${eq(profiles.id, userId)} AND ${profiles.credits} > 0`)
    .returning({ credits: profiles.credits });

  if (result.length === 0) {
    return null; // No credits or user not found
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

    // 2. Check and deduct credit
    const remainingCredits = await checkAndDeductCredit(db, user.id);
    if (remainingCredits === null) {
      return new Response(
        JSON.stringify({
          error: "크레딧이 부족합니다.",
          code: "INSUFFICIENT_CREDITS",
        }),
        {
          status: 402, // Payment Required
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { image, mask }: EraserRequest = await request.json();

    if (!image || !mask) {
      return new Response(
        JSON.stringify({ error: "Image and mask are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
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

    // Create prediction with dpakkk/image-object-removal model (LaMa + FFT)
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: ReplicateModels.STABLE_DIFFUSION_INPAINTING,
        input: {
          image,
          mask,
          prompt: "", // Empty prompt for context-aware filling
          negative_prompt:
            "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, mosaic, pixelated",
          num_inference_steps: 30,
          scheduler: "DPMSolverMultistep",
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
    console.error("Eraser error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
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
