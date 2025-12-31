/**
 * Middleware for API routes
 * Extracts user information from Authorization header and adds to context
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export interface User {
  id: string;
  email?: string;
  [key: string]: unknown;
}

export interface ContextData {
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

    const user = (await response.json()) as User;
    return user;
  } catch (error) {
    console.warn("Error verifying user token:", error);
    return null;
  }
}

export const onRequest: PagesFunction<Env, string, ContextData> = async (
  context
) => {
  const { request, env, data } = context;

  // Extract user from Authorization header
  const user = await getUserFromAuth(request, env);
  data.user = user;

  // Continue to the next handler
  return context.next();
};
