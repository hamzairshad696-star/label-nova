import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import type { RoleKey } from "../src/server/auth/catalog";
import { auditLogs, authAccounts, roles, userRoles, users } from "../src/server/db/schema";
import type { ScriptDb } from "./_db";

interface NewUser {
  name: string;
  email: string;
  password: string;
  role: RoleKey;
  company?: string;
  parentUserId?: string | null;
}

/** Creates a user with a password credential and role, exactly as Better Auth would store it. */
export async function createUserWithRole(db: ScriptDb, u: NewUser): Promise<{ id: string; created: boolean }> {
  const email = u.email.trim().toLowerCase();
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) return { id: existing.id, created: false };

  const role = await db.query.roles.findFirst({ where: eq(roles.key, u.role) });
  if (!role) throw new Error(`Role ${u.role} not found. Run npm run db:bootstrap first.`);

  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ name: u.name, email, company: u.company ?? null, emailVerified: true, parentUserId: u.parentUserId ?? null })
      .returning({ id: users.id });
    await tx.insert(authAccounts).values({
      userId: user!.id,
      accountId: user!.id,
      providerId: "credential",
      password: await hashPassword(u.password),
    });
    await tx.insert(userRoles).values({ userId: user!.id, roleId: role.id });
    await tx.insert(auditLogs).values({
      actorUserId: null,
      action: "user.created",
      targetType: "user",
      targetId: user!.id,
      metadata: { role: u.role, via: "cli" },
    });
    return { id: user!.id, created: true };
  });
}
