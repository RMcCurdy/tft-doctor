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

function createDb() {
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
  db: ReturnType<typeof createDb> | undefined;
};

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}

export type Database = typeof db;
