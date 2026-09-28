/**
 * Runs automatically on every Vercel build (see "vercel-build" in package.json):
 *
 *   1. applies SQL migrations from ./drizzle           (forward-only, safe to repeat)
 *   2. creates roles, permissions and default grants    (insert-if-missing, safe to repeat)
 *   3. if ADMIN_EMAIL names an existing account, makes sure it is an active ADMIN.
 *      Passwords are never set or changed here. ADMIN_PASSWORD is ignored.
 *
 * Preview builds never touch DATABASE_URL (see src/server/db/database-url.ts). They migrate
 * PREVIEW_DATABASE_URL if it is set, and otherwise skip database setup entirely.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as schema from "../src/server/db/schema";
import { resolveDatabaseUrl } from "../src/server/db/database-url";
import { bootstrapAccess } from "./_bootstrap";
import { ensureAdmin } from "./_admin";

async function main() {
  if (process.env.SKIP_DB_SETUP === "true") {
    console.log("[deploy-db] SKIP_DB_SETUP=true — skipping.");
    return;
  }
  const target = resolveDatabaseUrl("direct");
  console.log(`[deploy-db] Environment: ${process.env.VERCEL_ENV ?? "local"}. Database: ${target.label}.`);
  if (!target.url) {
    console.log("[deploy-db] No permitted database — skipping setup. The site still builds.");
    return;
  }
  if (process.env.ADMIN_PASSWORD) {
    console.warn("[deploy-db] ADMIN_PASSWORD is set but is ignored: deploys never change passwords. You can delete it.");
  }

  const pool = new Pool({ connectionString: target.url, max: 1 });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  try {
    console.log("[deploy-db] Applying migrations…");
    await migrate(db, { migrationsFolder: "drizzle" });

    const r = await bootstrapAccess(db);
    console.log(`[deploy-db] Access ready: ${r.roles} roles, ${r.permissions} permissions, ${r.granted} new grants.`);

    await ensureAdmin(db, { email: process.env.ADMIN_EMAIL, log: (m) => console.log(`[deploy-db] ${m}`) });
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[deploy-db] Database setup failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
