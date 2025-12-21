interface Env {
  REPLICATE_API_TOKEN: string;
  RATE_LIMIT: KVNamespace;
  MAX_LIMIT: number;
}

interface GenerateRequest {
  image: string;
  upscale?: number;
  fidelity?: number;
  backgroundEnhance?: boolean;
  faceUpsample?: boolean;
}

// CodeFormer - Face Restoration model (sczhou/codeformer)
const REPLICATE_MODEL_VERSION =
  "cc4956dd26fa5a7185d5660cc9100fab1b8070a1d1654a8bb5eb6d443b020bb2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;

    // 1. 사용자 IP 가져오기
    const ip = request.headers.get("CF-Connecting-IP");
    const today = new Date().toISOString().slice(0, 10); // e.g.) 2025-12-21
    const key = `limit:${today}:${ip}`; // 오늘 날짜 + IP 로 키 생성

    // 2. KV에서 현재 사용 횟수 조회
    const countStr = await env.RATE_LIMIT.get(key);
    const count = countStr ? parseInt(countStr, 10) : 0;

    // 3. 제한 확인 (기본값: 하루 3회)
    const MAX_LIMIT = env.MAX_LIMIT ?? 3;
    if (count >= MAX_LIMIT) {
      console.error("Rate limit exceeded for IP:", ip, "Count:", count);
      return new Response(
        JSON.stringify({
          error: `하루 ${MAX_LIMIT}번까지만 변환 가능해요! 내일 또 오세요 💖`,
        }),
        {
          status: 429, // Too Many Requests
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // 4. 호출 성공 시 카운트 증가 및 저장 (TTL: 24시간 후 자동 삭제)
    // waitUntil을 쓰면 응답을 먼저 보내고 백그라운드에서 저장해 속도 저하를 막습니다.
    context.waitUntil(
      env.RATE_LIMIT.put(key, (count + 1).toString(), { expirationTtl: 86400 })
    );

    const {
      image,
      upscale = 2,
      fidelity = 0.6,
      backgroundEnhance = true,
      faceUpsample = true,
    }: GenerateRequest = await request.json();

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

    // Create prediction - don't wait, just return the id
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: REPLICATE_MODEL_VERSION,
        input: {
          image,
          upscale,
          codeformer_fidelity: fidelity,
          background_enhance: backgroundEnhance,
          face_upsample: faceUpsample,
        },
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
