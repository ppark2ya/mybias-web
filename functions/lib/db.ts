/**
 * Database utility for Cloudflare Pages Functions
 * Singleton pattern for connection reuse across requests in the same isolate
 */
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export type DbClient = PostgresJsDatabase;

// Singleton database instance
let dbInstance: DbClient | null = null;

/**
 * Initialize the database connection (call once in middleware)
 *
 * @param databaseUrl - PostgreSQL connection string
 *
 * @example
 * ```ts
 * // In middleware
 * initDb(env.DATABASE_URL);
 * ```
 */
export function initDb(databaseUrl: string): void {
  if (dbInstance) return;

  const client = postgres(databaseUrl, { prepare: false });
  dbInstance = drizzle(client);
}

/**
 * Get the singleton database instance
 * Must call initDb() first (typically in middleware)
 *
 * @returns Drizzle database client
 * @throws Error if database is not initialized
 *
 * @example
 * ```ts
 * const db = getDb();
 * const users = await db.select().from(usersTable);
 * ```
 */
export function getDb(): DbClient {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initDb() first.");
  }

  return dbInstance;
}
