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

  // Create database client and store in context
  const db = createDbClient(env.DATABASE_URL);
  data.db = db;

  // Extract user from Authorization header
  const user = await getUserFromAuth(request, env);
  data.user = user;

  // Continue to the next handler
  return context.next();
};
