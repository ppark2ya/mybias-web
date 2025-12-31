/**
 * Middleware for API routes
 * - Initializes database connection
 * - Extracts user information from Authorization header
 */
import { createClient, type User } from "@supabase/supabase-js";
import { initDb } from "../lib/db";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
  DATABASE_URL: string;
}

export type { User };

export interface ContextData extends Record<string, unknown> {
  user: User | null;
}

/**
 * Extract user from Supabase JWT token in Authorization header
 */
async function getUserFromAuth(
  request: Request,
  env: Env
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

export const onRequest: PagesFunction<Env, string, ContextData> = async (
  context
) => {
  const { request, env, data } = context;

  // Initialize database connection (singleton)
  initDb(env.DATABASE_URL);

  // Extract user from Authorization header
  const user = await getUserFromAuth(request, env);
  data.user = user;

  // Continue to the next handler
  return context.next();
};
