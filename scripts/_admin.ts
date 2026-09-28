/**
 * Makes sure the account named by ADMIN_EMAIL is an active ADMIN. Idempotent; never creates users,
 * never deletes users, never touches passwords or sessions.
 *
 *  - No account with that email → log and do nothing.
 *  - Account exists             → ensure its role is ADMIN and its status is active.
 */
import { eq } from "drizzle-orm";
import { auditLogs, roles, userRoles, users } from "../src/server/db/schema";
import type { ScriptDb } from "./_db";

interface Options {
  email?: string;
  log: (message: string) => void;
}

export async function ensureAdmin(db: ScriptDb, { email: rawEmail, log }: Options) {
  const email = rawEmail?.trim().toLowerCase();
  if (!email) return;

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!existing) {
    log(`No account for ${email}; nothing changed.`);
    return;
  }

  const admin = await db.query.roles.findFirst({ where: eq(roles.key, "ADMIN") });
  if (!admin) throw new Error("ADMIN role missing — bootstrap did not run.");

  await db.transaction(async (tx) => {
    const current = await tx.select().from(userRoles).where(eq(userRoles.userId, existing.id));
    const alreadyAdmin = current.length === 1 && current[0]!.roleId === admin.id;
    if (!alreadyAdmin) {
      await tx.delete(userRoles).where(eq(userRoles.userId, existing.id));
      await tx.insert(userRoles).values({ userId: existing.id, roleId: admin.id });
      await tx.update(users).set({ parentUserId: null }).where(eq(users.id, existing.id));
      await tx.insert(auditLogs).values({
        actorUserId: null, action: "user.role_changed", targetType: "user", targetId: existing.id,
        metadata: { role: "ADMIN", via: "deploy" },
      });
      log(`${email} is now an ADMIN.`);
    } else {
      log(`Admin ${email} is in place.`);
    }
    if (existing.status !== "active") {
      await tx.update(users).set({ status: "active" }).where(eq(users.id, existing.id));
      log(`${email} re-activated.`);
    }
  });
}
