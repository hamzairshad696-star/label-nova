import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * One pool per server instance. On Vercel, use Neon's *pooled* connection string for DATABASE_URL.
 * Creating a Pool does not open a connection, so `next build` never needs database access.
 */
const globalForDb = globalThis as unknown as { labelNovaPool?: Pool };

if (!process.env.DATABASE_URL && process.env.NEXT_PHASE !== "phase-production-build") {
  console.error("[label-nova] DATABASE_URL is not set. Sign-in and all signed-in pages will fail until it is added.");
}

const pool =
  globalForDb.labelNovaPool ??
  new Pool({ connectionString: process.env.DATABASE_URL, max: 5, idleTimeoutMillis: 10_000 });
if (process.env.NODE_ENV !== "production") globalForDb.labelNovaPool = pool;

export const db = drizzle(pool, { schema, casing: "snake_case" });
export type Db = typeof db;
