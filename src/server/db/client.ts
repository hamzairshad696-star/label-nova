import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { resolveDatabaseUrl } from "./database-url";
import * as schema from "./schema";

/**
 * One pool per server instance. On Vercel, use Neon's *pooled* connection string for DATABASE_URL.
 * Creating a Pool does not open a connection, so `next build` never needs database access.
 */
const globalForDb = globalThis as unknown as { labelNovaPool?: Pool };

const target = resolveDatabaseUrl("pooled");
if (!target.url && process.env.NEXT_PHASE !== "phase-production-build") {
  console.error(`[label-nova] Database: ${target.label}. Sign-in and signed-in pages are unavailable.`);
}

// With no permitted database, point at an address that can never resolve, so no query can reach any real server.
const DISABLED = "postgresql://database-disabled.invalid:5432/none";

const pool =
  globalForDb.labelNovaPool ??
  new Pool({ connectionString: target.url ?? DISABLED, max: 5, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 5_000 });
if (process.env.NODE_ENV !== "production") globalForDb.labelNovaPool = pool;

export const db = drizzle(pool, { schema, casing: "snake_case" });
export type Db = typeof db;
export const databaseAvailable = target.url !== null;
