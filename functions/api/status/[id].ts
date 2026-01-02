import { eq } from "drizzle-orm";
import { imageGenerations } from "../../../src/db/schema";
import { getDb } from "../../lib/db";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const id = context.params.id as string;

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Prediction ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Query image_generations table by prediction ID
    const db = getDb();
    const result = await db
      .select()
      .from(imageGenerations)
      .where(eq(imageGenerations.predictionId, id))
      .limit(1);

    if (result.length === 0) {
      return new Response(
        JSON.stringify({ error: "Generation not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const generation = result[0];

    // Fallback to Replicate URL if R2 upload failed
    const outputUrl = generation.outputImageUrl || generation.replicateOutputUrl || null;

    // Return simplified response based on DB record
    const response = {
      id: generation.predictionId,
      status: generation.status,
      output: outputUrl,
      error: generation.errorMessage || null,
      created_at: generation.createdAt.toISOString(),
      completed_at: generation.completedAt?.toISOString() || null,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    // Log technical error for debugging, return generic message to client
    console.error("Status check error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to check generation status",
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
