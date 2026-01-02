/**
 * Database utility for Cloudflare Pages Functions
 * Creates a new database client for each request context
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { DbClient } from "../types";

export type { DbClient };

/**
 * Create a new database client
 * Call this in middleware and store in context.data.db
 *
 * @param databaseUrl - PostgreSQL connection string
 * @returns Drizzle database client
 *
 * @example
 * ```ts
 * // In middleware
 * const db = createDbClient(env.DATABASE_URL);
 * data.db = db;
 * ```
 */
export function createDbClient(databaseUrl: string): DbClient {
  const client = postgres(databaseUrl, { prepare: false, max: 1 });
  return drizzle(client);
}
