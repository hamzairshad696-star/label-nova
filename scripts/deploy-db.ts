/**
 * Runs automatically on every Vercel build (see "vercel-build" in package.json), so the
 * database is prepared without running anything on your own computer:
 *
 *   1. applies SQL migrations from ./drizzle           (safe to repeat)
 *   2. creates roles, permissions and default grants    (safe to repeat)
 *   3. creates the first admin, only if ADMIN_EMAIL and ADMIN_PASSWORD are set
 *      and that email doesn't exist yet                 (never changes an existing user)
 *
 * Without DATABASE_URL it skips with a warning, so the site itself still builds.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as schema from "../src/server/db/schema";
import { bootstrapAccess } from "./_bootstrap";
import { createUserWithRole } from "./_users";

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

    const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password, ADMIN_NAME: name = "Administrator" } = process.env;
    if (email && password) {
      if (password.length < 12) {
        console.warn("[deploy-db] ADMIN_PASSWORD must be at least 12 characters — admin not created.");
      } else {
        const { created } = await createUserWithRole(db, { name, email, password, role: "ADMIN" });
        console.log(created ? `[deploy-db] Admin ${email} created.` : `[deploy-db] Admin ${email} already exists — unchanged.`);
      }
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[deploy-db] Database setup failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
