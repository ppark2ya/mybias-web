interface Env {
  REPLICATE_API_TOKEN: string;
}

interface GenerateRequest {
  image: string;
  scale?: number;
  faceEnhance?: boolean;
}

const REPLICATE_MODEL_VERSION =
  "42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { image, scale = 2, faceEnhance = true }: GenerateRequest =
      await context.request.json();

    if (!image) {
      return new Response(JSON.stringify({ error: "Image is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const apiToken = context.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      return new Response(
        JSON.stringify({ error: "API token not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create prediction - don't wait, just return the id
    const response = await fetch(
      "https://api.replicate.com/v1/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: REPLICATE_MODEL_VERSION,
          input: {
            image,
            scale,
            face_enhance: faceEnhance,
          },
        }),
      }
    );

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

    const result = await response.json();

    // Return immediately with prediction id
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Generate error:", error);
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
