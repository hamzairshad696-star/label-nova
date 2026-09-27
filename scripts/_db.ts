/* Shared connection for CLI scripts. Not imported by the app (the app uses src/server/db/client.ts). */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/server/db/schema";

export function connect() {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: url, max: 2 });
  return { db: drizzle(pool, { schema, casing: "snake_case" }), close: () => pool.end() };
}

export type ScriptDb = ReturnType<typeof connect>["db"];
