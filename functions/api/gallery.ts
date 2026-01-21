import { eq, desc, lt, and } from "drizzle-orm";
import { imageGenerations } from "../../src/db/schema";
import type { ContextData } from "../types";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const DEFAULT_LIMIT = 12;

export const onRequestGet: PagesFunction<unknown, string, ContextData> = async (
  context
) => {
  try {
    const { data, request } = context;
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

    // Parse query parameters
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor");
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : DEFAULT_LIMIT;

    // Build query conditions
    const conditions = [eq(imageGenerations.userId, user.id)];

    // Add cursor condition if provided (cursor is the createdAt timestamp)
    if (cursor) {
      const cursorDate = new Date(cursor);
      conditions.push(lt(imageGenerations.createdAt, cursorDate));
    }

    // Query user's image generations with pagination
    const generations = await db
      .select({
        id: imageGenerations.id,
        predictionId: imageGenerations.predictionId,
        outputImageUrl: imageGenerations.outputImageUrl,
        replicateOutputUrl: imageGenerations.replicateOutputUrl,
        createdAt: imageGenerations.createdAt,
        stage: imageGenerations.stage,
        parentId: imageGenerations.parentId,
      })
      .from(imageGenerations)
      .where(and(...conditions))
      .orderBy(desc(imageGenerations.createdAt))
      .limit(limit + 1); // Fetch one extra to check if there are more

    // Check if there are more results
    const hasMore = generations.length > limit;
    const results = hasMore ? generations.slice(0, limit) : generations;

    // Get all Stage 1 prediction IDs that have a corresponding Stage 2
    const stage1IdsWithStage2 = new Set(
      results
        .filter(g => g.stage === 2 && g.parentId)
        .map(g => g.parentId)
    );

    // Filter only generations with output URL and exclude Stage 1 if Stage 2 exists
    const images = results
      .filter((g) => {
        // Must have output URL
        if (!g.outputImageUrl && !g.replicateOutputUrl) return false;
        
        // If this is Stage 1 and has a Stage 2 child, exclude it
        if (g.stage === 1 && stage1IdsWithStage2.has(g.predictionId)) {
          return false;
        }
        
        return true;
      })
      .map((g) => ({
        id: g.id,
        predictionId: g.predictionId,
        imageUrl: g.outputImageUrl || g.replicateOutputUrl,
        createdAt: g.createdAt.toISOString(),
      }));

    // Get next cursor from the last item
    const nextCursor = hasMore && results.length > 0
      ? results[results.length - 1].createdAt.toISOString()
      : null;

    return new Response(
      JSON.stringify({
        images,
        nextCursor,
        hasMore,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    // Log technical error for debugging
    console.error("Gallery error:", error);

    // Return empty gallery on DB error
    return new Response(
      JSON.stringify({ images: [], nextCursor: null, hasMore: false }),
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
