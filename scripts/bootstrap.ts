/**
 * Production-safe, idempotent: creates roles, permissions and default grants.
 * Existing grants are left alone (an admin may have changed them) unless
 * --reset-grants is passed.
 *
 *   npm run db:bootstrap
 *   npm run db:bootstrap -- --reset-grants
 */
import { bootstrapAccess } from "./_bootstrap";
import { connect } from "./_db";

async function main() {
  const { db, close } = connect();
  const r = await bootstrapAccess(db, { resetGrants: process.argv.includes("--reset-grants") });
  console.log(`Bootstrap complete: ${r.roles} roles, ${r.permissions} permissions, ${r.granted} grants added.`);
  await close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
