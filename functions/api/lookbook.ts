import { eq, sql } from "drizzle-orm";
import {
  imageGenerations,
  ImageGenerationStatus,
  profiles,
  CreditTransactionType,
} from "../../src/db/schema";
import type { ReplicatePredictionStatusType } from "../../src/constants/replicate";
import type { ContextData, DbClient } from "../types.d.ts";
import { recordCreditTransaction } from "../lib/credit";

interface Env {
  REPLICATE_API_TOKEN: string;
  BASE_URL: string;
}

interface LookbookRequest {
  human_image: string; // URL or Base64 (handled as URL from frontend upload ideally, creates temp URL)
  garm_image: string; // URL or Base64
  garment_des?: string;
}

// IDM-VTON Model
const REPLICATE_MODEL_VERSION = "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985";

const COST_PER_GENERATION = 5;

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
  userId: string
): Promise<void> {
  await db.insert(imageGenerations).values({
    predictionId,
    userId,
    status: ImageGenerationStatus.PENDING,
    // type: "VIRTUAL_TRY_ON", // If we had a type column, for now just generic
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

    // 3. Call Replicate
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
          // seed: 42,
          // steps: 30,
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

    // 4. Save Record
    if (result.id) {
      await saveGenerationRecord(db, result.id, user.id);
      await recordCreditTransaction(
        db,
        user.id,
        -COST_PER_GENERATION,
        CreditTransactionType.USAGE,
        result.id,
        "AI Lookbook Try-On"
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
