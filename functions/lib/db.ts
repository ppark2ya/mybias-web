/**
 * Database utility for Cloudflare Pages Functions
 * Provides a wrapper for drizzle-orm with automatic connection management
 */
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export type DbClient = PostgresJsDatabase;

/**
 * Execute a database operation with automatic connection management
 *
 * @param databaseUrl - PostgreSQL connection string
 * @param callback - Function to execute with the database client
 * @returns The result of the callback function
 *
 * @example
 * ```ts
 * const users = await withDb(env.DATABASE_URL, async (db) => {
 *   return db.select().from(usersTable);
 * });
 * ```
 */
export async function withDb<T>(
  databaseUrl: string,
  callback: (db: DbClient) => Promise<T>
): Promise<T> {
  const client = postgres(databaseUrl, { prepare: false });
  const db = drizzle(client);

  try {
    return await callback(db);
  } finally {
    await client.end();
  }
}
