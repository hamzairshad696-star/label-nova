/**
 * Runs automatically on every Vercel build (see "vercel-build" in package.json), so the
 * database is prepared without running anything on your own computer:
 *
 *   1. applies SQL migrations from ./drizzle           (safe to repeat)
 *   2. creates roles, permissions and default grants    (safe to repeat)
 *   3. admin account, driven by ADMIN_EMAIL (see scripts/_admin.ts):
 *      - ADMIN_EMAIL only: an account that already registered with that email becomes ADMIN
 *      - ADMIN_EMAIL + ADMIN_PASSWORD: creates the admin, or resets its password if it differs
 *
 * Without DATABASE_URL it skips with a warning, so the site itself still builds.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as schema from "../src/server/db/schema";
import { bootstrapAccess } from "./_bootstrap";
import { ensureAdmin } from "./_admin";

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) {
    console.warn("[deploy-db] DATABASE_URL is not set — skipping database setup. Sign-in will not work until it is added.");
    return;
  }
  if (process.env.SKIP_DB_SETUP === "true") {
    console.log("[deploy-db] SKIP_DB_SETUP=true — skipping.");
    return;
  }

  const pool = new Pool({ connectionString: url, max: 1 });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  try {
    console.log("[deploy-db] Applying migrations…");
    await migrate(db, { migrationsFolder: "drizzle" });

    const r = await bootstrapAccess(db);
    console.log(`[deploy-db] Access ready: ${r.roles} roles, ${r.permissions} permissions, ${r.granted} new grants.`);

    await ensureAdmin(db, {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      name: process.env.ADMIN_NAME,
      log: (m) => console.log(`[deploy-db] ${m}`),
    });
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[deploy-db] Database setup failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
