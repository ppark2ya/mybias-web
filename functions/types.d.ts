/**
 * Global type definitions for Cloudflare Pages Functions
 */
import type { User } from "@supabase/supabase-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

/**
 * Database client type
 */
export type DbClient = PostgresJsDatabase;

/**
 * Context data passed through middleware to API handlers
 * Available via context.data in all API routes
 */
export interface ContextData extends Record<string, unknown> {
  /**
   * Database client instance (created in middleware)
   */
  db: DbClient;

  /**
   * Authenticated user from Supabase JWT token
   * null if not authenticated
   */
  user: User | null;
}

/**
 * Common environment variables available to all API routes
 */
export interface BaseEnv {
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
  DATABASE_URL: string;
}
