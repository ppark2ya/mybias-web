/**
 * Database utility for Cloudflare Pages Functions
 * Singleton pattern for connection reuse across requests in the same isolate
 */
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";

export type DbClient = PostgresJsDatabase;

// Cache for database connections (singleton per DATABASE_URL)
const dbCache = new Map<string, { client: Sql; db: DbClient }>();

/**
 * Get a singleton database instance for the given connection URL
 * Reuses existing connections within the same Cloudflare Workers isolate
 *
 * @param databaseUrl - PostgreSQL connection string
 * @returns Drizzle database client
 *
 * @example
 * ```ts
 * const db = getDb(env.DATABASE_URL);
 * const users = await db.select().from(usersTable);
 * ```
 */
export function getDb(databaseUrl: string): DbClient {
  const cached = dbCache.get(databaseUrl);
  if (cached) {
    return cached.db;
  }

  const client = postgres(databaseUrl, { prepare: false });
  const db = drizzle(client);

  dbCache.set(databaseUrl, { client, db });

  return db;
}
