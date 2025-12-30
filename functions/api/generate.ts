import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { imageGenerations } from "../../src/db/schema";

interface Env {
  REPLICATE_API_TOKEN: string;
  RATE_LIMIT?: KVNamespace;
  MAX_LIMIT?: number;
  BASE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  DATABASE_URL: string;
}

interface GenerateRequest {
  image: string;
  upscale?: number;
  fidelity?: number;
  backgroundEnhance?: boolean;
  faceUpsample?: boolean;
}

interface ReplicatePredictionResponse {
  id: string;
  model: string;
  version: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
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
 * Extract user ID from Supabase JWT token in Authorization header
 */
async function getUserIdFromAuth(
  request: Request,
  env: Env
): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);

  try {
    // Verify token with Supabase
    const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      },
    });

    if (!response.ok) {
      console.warn("Failed to verify user token:", response.status);
      return null;
    }

    const user = (await response.json()) as { id: string };
    return user.id;
  } catch (error) {
    console.warn("Error verifying user token:", error);
    return null;
  }
}

// CodeFormer - Face Restoration model (sczhou/codeformer)
const REPLICATE_MODEL_VERSION =
  "cc4956dd26fa5a7185d5660cc9100fab1b8070a1d1654a8bb5eb6d443b020bb2";

/**
 * Save image generation record to database using drizzle-orm
 */
async function saveGenerationRecord(
  env: Env,
  predictionId: string,
  userId: string | null
): Promise<void> {
  const client = postgres(env.DATABASE_URL, { prepare: false });
  const db = drizzle(client);

  try {
    await db.insert(imageGenerations).values({
      predictionId,
      userId: userId || null,
      status: "pending",
    });
  } finally {
    await client.end();
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;

    // 1. 사용자 IP 가져오기
    const ip = request.headers.get("CF-Connecting-IP");
    const today = new Date().toISOString().slice(0, 10); // e.g.) 2025-12-21
    const key = `limit:${today}:${ip}`; // 오늘 날짜 + IP 로 키 생성

    // 2. Rate limiting (KV namespace가 설정된 경우에만)
    if (env.RATE_LIMIT) {
      try {
        // 2-1. KV에서 현재 사용 횟수 조회
        const countStr = await env.RATE_LIMIT.get(key);
        const count = countStr ? parseInt(countStr, 10) : 0;

        // 2-2. 제한 확인 (기본값: 하루 3회)
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

        // 2-3. 호출 성공 시 카운트 증가 및 저장 (TTL: 24시간 후 자동 삭제)
        context.waitUntil(
          env.RATE_LIMIT.put(key, (count + 1).toString(), {
            expirationTtl: 86400,
          })
        );
      } catch (error) {
        // Rate limiting 실패 시 경고만 로그하고 계속 진행
        console.warn("Rate limiting error (continuing):", error);
      }
    } else {
      console.warn("RATE_LIMIT KV namespace not configured - rate limiting disabled");
    }

    const {
      image,
      upscale = 2,
      fidelity = 0.6,
      backgroundEnhance = true,
      faceUpsample = true,
    }: GenerateRequest = await request.json();

    // Get user ID from Authorization header (optional)
    const userId = await getUserIdFromAuth(request, env);

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

    // Create prediction with webhook
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
    if (env.DATABASE_URL && result.id) {
      try {
        await saveGenerationRecord(env, result.id, userId);
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

    // Return with prediction id
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
