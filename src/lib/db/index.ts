// Load .env.local for pipeline scripts (no-op in Next.js which handles its own env)
import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Database client singleton.
 *
 * Uses postgres.js driver with Drizzle ORM.
 * Connection string comes from DATABASE_URL env var.
 *
 * For Supabase: use the "Transaction" connection pooler string
 * (port 6543) for serverless environments like Vercel.
 */

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

function createDb(): DrizzleDb {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Set it in .env.local or your deployment environment."
    );
  }

  const client = postgres(connectionString, {
    // Supabase connection pooler settings for serverless
    prepare: false,
    // Limit connections for serverless (each function instance gets its own pool)
    max: 1,
  });

  return drizzle(client, { schema });
}

// Reuse the DB instance across hot reloads in development
const globalForDb = globalThis as unknown as {
  db: DrizzleDb | undefined;
};

/**
 * Lazy DB accessor — only creates the connection on first use.
 * This allows builds with USE_MOCK_DATA=true to succeed without DATABASE_URL.
 */
export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get(_target, prop, receiver) {
    if (!globalForDb.db) {
      globalForDb.db = createDb();
    }
    return Reflect.get(globalForDb.db, prop, receiver);
  },
});

export type Database = DrizzleDb;
