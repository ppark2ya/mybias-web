/**
 * Middleware for API routes
 * - Creates database client and stores in context.data
 * - Extracts user information from Authorization header
 */
import { createClient, type User } from "@supabase/supabase-js";
import { createDbClient } from "../lib/db";
import type { ContextData, BaseEnv } from "../types";

export type { User, ContextData };

/**
 * Extract user from Supabase JWT token in Authorization header
 */
async function getUserFromAuth(
  request: Request,
  env: BaseEnv
): Promise<User | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);

  try {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      console.warn("Failed to verify user token:", error.message);
      return null;
    }

    return data.user;
  } catch (error) {
    console.warn("Error verifying user token:", error);
    return null;
  }
}

export const onRequest: PagesFunction<BaseEnv, string, ContextData> = async (
  context
) => {
  const { request, env, data } = context;
  const url = new URL(request.url);

  // 접속한 주소가 'pages.dev'를 포함하고 있다면
  if (url.hostname === "mybias-web.pages.dev") {
    const newUrl = "https://savemybias.com" + url.pathname + url.search;
    return Response.redirect(newUrl, 301);
  }

  // 2. [개발 환경] 검색 엔진 수집 차단 (SEO 보호)
  // dev 도메인이거나, 브랜치별 프리뷰 주소(*.pages.dev)인 경우
  if (
    url.hostname === "dev.savemybias.com" ||
    url.hostname.endsWith(".pages.dev")
  ) {
    // 일단 페이지를 보여줍니다.
    const response = await context.next();

    // 하지만 응답 헤더에 'noindex' 딱지를 붙여서 내보냅니다.
    // 구글 봇: "아, 이 페이지는 검색 결과에 올리면 안 되는구나" 하고 감.
    response.headers.set("X-Robots-Tag", "noindex");
    return response;
  }

  // Create database client and store in context
  const db = createDbClient(env.DATABASE_URL);
  data.db = db;

  // Extract user from Authorization header
  const user = await getUserFromAuth(request, env);
  data.user = user;

  // Continue to the next handler
  return context.next();
};
