import { eq } from "drizzle-orm";
import { imageGenerations } from "../../../src/db/schema";
import type { ContextData } from "../../types";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Get child prediction (Stage 2) for a parent prediction ID
 * Query params: parentId
 */
export const onRequestGet: PagesFunction<unknown, string, ContextData> = async (
  context
) => {
  try {
    const { data, request } = context;
    const db = data.db;
    
    const url = new URL(request.url);
    const parentId = url.searchParams.get("parentId");

    if (!parentId) {
      return new Response(
        JSON.stringify({ error: "parentId query parameter is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Query for child prediction (Stage 2) with matching parent_id
    const result = await db
      .select()
      .from(imageGenerations)
      .where(eq(imageGenerations.parentId, parentId))
      .limit(1);

    // If no child found yet, return null
    if (result.length === 0) {
      return new Response(
        JSON.stringify({ child: null }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const generation = result[0];

    // Fallback to Replicate URL if R2 upload failed
    const outputUrl = generation.outputImageUrl || generation.replicateOutputUrl || null;

    // Return child prediction info
    const response = {
      child: {
        id: generation.predictionId,
        status: generation.status,
        output: outputUrl,
        error: generation.errorMessage || null,
        stage: generation.stage,
        created_at: generation.createdAt.toISOString(),
        completed_at: generation.completedAt?.toISOString() || null,
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Child prediction query error:", error);
    
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
