/* Shared connection for CLI scripts. Not imported by the app (the app uses src/server/db/client.ts). */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/server/db/schema";
import { resolveDatabaseUrl } from "../src/server/db/database-url";

export function connect() {
  const target = resolveDatabaseUrl("direct");
  if (!target.url) {
    console.error(`Database: ${target.label}.`);
    process.exit(1);
  }
  const pool = new Pool({ connectionString: target.url, max: 2 });
  return { db: drizzle(pool, { schema, casing: "snake_case" }), close: () => pool.end() };
}

export type ScriptDb = ReturnType<typeof connect>["db"];
