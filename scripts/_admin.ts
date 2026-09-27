/**
 * Makes sure the account named by ADMIN_EMAIL is an active ADMIN. Idempotent; never duplicates users.
 *
 *  - No account yet + password given  → create it as ADMIN.
 *  - No account yet + no password      → do nothing (register at /register first, then redeploy).
 *  - Account exists                    → set role to ADMIN and status to active.
 *  - Account exists + password given   → if the stored password differs, replace it and sign out
 *                                         all existing sessions. Remove ADMIN_PASSWORD afterwards.
 */
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { auditLogs, authAccounts, roles, sessions, userRoles, users } from "../src/server/db/schema";
import type { ScriptDb } from "./_db";
import { createUserWithRole } from "./_users";

interface Options {
  email?: string;
  password?: string;
  name?: string;
  log: (message: string) => void;
}

export async function ensureAdmin(db: ScriptDb, { email: rawEmail, password, name, log }: Options) {
  const email = rawEmail?.trim().toLowerCase();
  if (!email) return;
  if (password !== undefined && password.length < 12) {
    log("ADMIN_PASSWORD must be at least 12 characters — admin not changed.");
    return;
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!existing) {
    if (!password) {
      log(`No account for ${email} yet. Register it at /register, then redeploy to make it the admin.`);
      return;
    }
    await createUserWithRole(db, { name: name || "Administrator", email, password, role: "ADMIN" });
    log(`Admin ${email} created.`);
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
      log(`Admin ${email} already exists.`);
    }
    if (existing.status !== "active") {
      await tx.update(users).set({ status: "active" }).where(eq(users.id, existing.id));
      log(`${email} re-activated.`);
    }

    if (!password) return;
    const [credential] = await tx
      .select()
      .from(authAccounts)
      .where(and(eq(authAccounts.userId, existing.id), eq(authAccounts.providerId, "credential")));
    if (credential?.password && (await verifyPassword({ hash: credential.password, password }))) {
      log("Admin password unchanged.");
      return;
    }
    const hash = await hashPassword(password);
    if (credential) {
      await tx.update(authAccounts).set({ password: hash }).where(eq(authAccounts.id, credential.id));
    } else {
      await tx.insert(authAccounts).values({ userId: existing.id, accountId: existing.id, providerId: "credential", password: hash });
    }
    await tx.delete(sessions).where(eq(sessions.userId, existing.id));
    await tx.insert(auditLogs).values({
      actorUserId: null, action: "user.password_reset", targetType: "user", targetId: existing.id, metadata: { via: "deploy" },
    });
    log("Admin password updated from ADMIN_PASSWORD; existing sessions signed out. Remove ADMIN_PASSWORD from Vercel now.");
  });
}
