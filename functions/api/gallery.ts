import { eq, desc } from "drizzle-orm";
import { imageGenerations } from "../../src/db/schema";
import type { ContextData } from "../types";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const onRequestGet: PagesFunction<unknown, string, ContextData> = async (
  context
) => {
  try {
    const { data } = context;
    const db = data.db;

    // Check if user is authenticated
    const user = data.user;
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Authentication required",
          code: "UNAUTHORIZED",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Query user's successful image generations
    const generations = await db
      .select({
        id: imageGenerations.id,
        predictionId: imageGenerations.predictionId,
        outputImageUrl: imageGenerations.outputImageUrl,
        replicateOutputUrl: imageGenerations.replicateOutputUrl,
        createdAt: imageGenerations.createdAt,
      })
      .from(imageGenerations)
      .where(eq(imageGenerations.userId, user.id))
      .orderBy(desc(imageGenerations.createdAt))
      .limit(50);

    // Filter only succeeded generations with output URL
    const images = generations
      .filter(
        (g) =>
          g.outputImageUrl || g.replicateOutputUrl
      )
      .map((g) => ({
        id: g.id,
        predictionId: g.predictionId,
        imageUrl: g.outputImageUrl || g.replicateOutputUrl,
        createdAt: g.createdAt.toISOString(),
      }));

    return new Response(JSON.stringify({ images }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    // Log technical error for debugging
    console.error("Gallery error:", error);

    // Return empty gallery on DB error (connection may be initializing)
    // Better UX than showing error - user can refresh to retry
    return new Response(
      JSON.stringify({ images: [] }),
      {
        status: 200,
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
