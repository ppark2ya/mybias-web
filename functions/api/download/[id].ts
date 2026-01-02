import { eq } from "drizzle-orm";
import { imageGenerations } from "../../../src/db/schema";
import type { ContextData } from "../../types";

interface Env {
  R2_BUCKET: R2Bucket;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const onRequestGet: PagesFunction<Env, string, ContextData> = async (
  context
) => {
  try {
    const { env, data, params } = context;
    const db = data.db;
    const predictionId = params.id as string;

    if (!predictionId) {
      return new Response(
        JSON.stringify({ error: "Prediction ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

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

    // Query image generation record
    const result = await db
      .select({
        userId: imageGenerations.userId,
        outputImageUrl: imageGenerations.outputImageUrl,
      })
      .from(imageGenerations)
      .where(eq(imageGenerations.predictionId, predictionId))
      .limit(1);

    if (result.length === 0) {
      return new Response(JSON.stringify({ error: "Image not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const generation = result[0];

    // Verify ownership
    if (generation.userId !== user.id) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!generation.outputImageUrl) {
      return new Response(JSON.stringify({ error: "Image not available" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Extract R2 key from URL (format: https://domain/generations/YYYY/MM/DD/predictionId.ext)
    const urlPath = new URL(generation.outputImageUrl).pathname;
    const r2Key = urlPath.startsWith("/") ? urlPath.slice(1) : urlPath;
    console.log("r2Key: ", r2Key);
    console.log("generation.outputImageUrl: ", generation.outputImageUrl);

    // Get object from R2
    const object = await env.R2_BUCKET.get(r2Key);

    if (!object) {
      return new Response(JSON.stringify({ error: "Image file not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Determine filename and content type
    const ext = r2Key.split(".").pop() || "png";
    const filename = `mybias-${predictionId}.${ext}`;
    const contentType = object.httpMetadata?.contentType || "image/png";

    // Return image with download headers
    return new Response(object.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("Download error:", error);
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
