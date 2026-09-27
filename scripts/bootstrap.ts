/**
 * Production-safe, idempotent: creates roles, permissions and default grants.
 * Existing grants are left alone (an admin may have changed them) unless
 * --reset-grants is passed.
 *
 *   npm run db:bootstrap
 *   npm run db:bootstrap -- --reset-grants
 */
import { and, eq, inArray } from "drizzle-orm";
import { DEFAULT_GRANTS, PERMISSIONS, ROLES, ROLE_KEYS, type PermissionKey } from "../src/server/auth/catalog";
import { permissions, rolePermissions, roles } from "../src/server/db/schema";
import { connect } from "./_db";

async function main() {
  const reset = process.argv.includes("--reset-grants");
  const { db, close } = connect();

  await db
    .insert(roles)
    .values(ROLE_KEYS.map((key) => ({ key, ...ROLES[key] })))
    .onConflictDoNothing({ target: roles.key });

  await db
    .insert(permissions)
    .values(Object.entries(PERMISSIONS).map(([key, description]) => ({ key, description })))
    .onConflictDoNothing({ target: permissions.key });

  const roleRows = await db.select().from(roles).where(inArray(roles.key, [...ROLE_KEYS]));
  const permRows = await db.select().from(permissions);
  const permId = new Map(permRows.map((p) => [p.key, p.id]));

  let granted = 0;
  for (const role of roleRows) {
    const grants = DEFAULT_GRANTS[role.key as keyof typeof DEFAULT_GRANTS];
    if (reset) await db.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
    for (const [key, scope] of Object.entries(grants) as [PermissionKey, NonNullable<(typeof grants)[PermissionKey]>][]) {
      const permissionId = permId.get(key)!;
      const existing = await db
        .select()
        .from(rolePermissions)
        .where(and(eq(rolePermissions.roleId, role.id), eq(rolePermissions.permissionId, permissionId)));
      if (existing.length === 0) {
        await db.insert(rolePermissions).values({ roleId: role.id, permissionId, scope });
        granted++;
      }
    }
  }

  console.log(`Bootstrap complete: ${roleRows.length} roles, ${permRows.length} permissions, ${granted} grants added.`);
  await close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
