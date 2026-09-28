import "server-only";
import { hashPassword } from "better-auth/crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { z } from "zod";
import { changeRoleSchema, createAccountSchema, resetPasswordSchema, setStatusSchema } from "@/lib/validation/accounts";
import { assertPermission, PermissionError, type Actor } from "@/server/auth/permissions";
import { ROLES, type RoleKey } from "@/server/auth/catalog";
import { db } from "@/server/db/client";
import { auditLogs, authAccounts, roles, sessions, userRoles, users } from "@/server/db/schema";

/** A rule was broken in a way the person can fix. `field` points at the form input when there is one. */
export class AccountError extends Error {
  constructor(message: string, readonly field?: string) {
    super(message);
    this.name = "AccountError";
  }
}

interface Meta {
  ip?: string | null;
  userAgent?: string | null;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function roleOf(tx: Tx | typeof db, userId: string): Promise<{ key: RoleKey; rank: number } | null> {
  const [row] = await tx
    .select({ key: roles.key, rank: roles.rank })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(userRoles.userId, userId))
    .orderBy(sql`${roles.rank} desc`)
    .limit(1);
  return row ? { key: row.key as RoleKey, rank: row.rank } : null;
}

async function isInNetwork(tx: Tx | typeof db, ancestorId: string, userId: string): Promise<boolean> {
  const rows = await tx.execute<{ found: boolean }>(sql`
    with recursive tree as (
      select id from users where parent_user_id = ${ancestorId}
      union
      select u.id from users u inner join tree t on u.parent_user_id = t.id
    )
    select exists(select 1 from tree where id = ${userId}) as found`);
  return Boolean(rows.rows[0]?.found);
}

/**
 * Loads a target account and checks the actor may manage it:
 * never yourself, never someone of equal or higher rank, and only inside your network unless your scope is "all".
 */
async function loadManageable(tx: Tx | typeof db, actor: Actor, userId: string, scope: "own" | "network" | "all") {
  if (userId === actor.id) throw new AccountError("You can't change your own account here.");
  const target = await tx.query.users.findFirst({ where: eq(users.id, userId) });
  if (!target) throw new AccountError("That account no longer exists.");
  const role = await roleOf(tx, userId);
  if (!role) throw new AccountError("That account has no role. Contact support.");
  if (role.rank >= actor.role.rank) throw new PermissionError("users.read");
  if (scope !== "all" && !(await isInNetwork(tx, actor.id, userId))) throw new PermissionError("users.read");
  return { target, role };
}

/** Creates an account with a password credential and role. The only way new accounts come into existence. */
export async function createAccount(actor: Actor, raw: z.input<typeof createAccountSchema>, meta: Meta = {}) {
  const scope = assertPermission(actor, "users.create");
  const input = createAccountSchema.parse(raw);

  if (ROLES[input.role].rank >= actor.role.rank) throw new AccountError("You can't create an account at your own level or above.", "role");

  // Dealers and resellers may only add customers, always under themselves.
  let parentUserId = input.parentUserId;
  if (scope !== "all") {
    if (input.role !== "CLIENT") throw new AccountError("You can only create customer accounts.", "role");
    parentUserId = actor.id;
  } else if (input.role !== "CLIENT") {
    parentUserId = null; // Dealers and resellers report directly to the admin.
  }

  return db.transaction(async (tx) => {
    const taken = await tx.query.users.findFirst({ where: eq(users.email, input.email), columns: { id: true } });
    if (taken) throw new AccountError("An account with this email already exists.", "email");

    if (parentUserId && scope === "all") {
      const parentRole = await roleOf(tx, parentUserId);
      if (!parentRole || (parentRole.key !== "DEALER" && parentRole.key !== "RESELLER")) {
        throw new AccountError("Customers can only be placed under a dealer or reseller.", "parentUserId");
      }
    }

    const role = await tx.query.roles.findFirst({ where: eq(roles.key, input.role) });
    if (!role) throw new Error(`Role ${input.role} missing — run the database bootstrap.`);

    const [user] = await tx
      .insert(users)
      .values({ name: input.name, email: input.email, company: input.company, status: input.status, parentUserId, emailVerified: true })
      .returning({ id: users.id });
    await tx.insert(authAccounts).values({
      userId: user!.id,
      accountId: user!.id,
      providerId: "credential",
      password: await hashPassword(input.password),
    });
    await tx.insert(userRoles).values({ userId: user!.id, roleId: role.id });
    await tx.insert(auditLogs).values({
      actorUserId: actor.id,
      action: "user.created",
      targetType: "user",
      targetId: user!.id,
      metadata: { role: input.role, parentUserId, status: input.status, email: input.email },
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    });
    return { id: user!.id };
  });
}

/** Enable or disable an account. Disabling signs the person out everywhere immediately. */
export async function setAccountStatus(actor: Actor, raw: z.input<typeof setStatusSchema>, meta: Meta = {}) {
  const scope = assertPermission(actor, "users.disable");
  const input = setStatusSchema.parse(raw);
  await db.transaction(async (tx) => {
    const { target } = await loadManageable(tx, actor, input.userId, scope);
    if (target.status === input.status) return;
    await tx.update(users).set({ status: input.status }).where(eq(users.id, target.id));
    if (input.status === "disabled") await tx.delete(sessions).where(eq(sessions.userId, target.id));
    await tx.insert(auditLogs).values({
      actorUserId: actor.id,
      action: input.status === "disabled" ? "user.disabled" : "user.enabled",
      targetType: "user",
      targetId: target.id,
      metadata: { from: target.status, to: input.status },
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    });
  });
}

/** Change a role. Admin only by default grants. Promoting to dealer/reseller moves the account directly under the admin. */
export async function changeAccountRole(actor: Actor, raw: z.input<typeof changeRoleSchema>, meta: Meta = {}) {
  const scope = assertPermission(actor, "users.assign_role");
  const input = changeRoleSchema.parse(raw);
  if (ROLES[input.role].rank >= actor.role.rank) throw new AccountError("You can't assign a role at your own level or above.", "role");
  await db.transaction(async (tx) => {
    const { target, role: current } = await loadManageable(tx, actor, input.userId, scope);
    if (current.key === input.role) return;
    const next = await tx.query.roles.findFirst({ where: eq(roles.key, input.role) });
    if (!next) throw new Error(`Role ${input.role} missing.`);
    await tx.delete(userRoles).where(eq(userRoles.userId, target.id));
    await tx.insert(userRoles).values({ userId: target.id, roleId: next.id });
    if (input.role !== "CLIENT") await tx.update(users).set({ parentUserId: null }).where(eq(users.id, target.id));
    await tx.insert(auditLogs).values({
      actorUserId: actor.id,
      action: "user.role_changed",
      targetType: "user",
      targetId: target.id,
      metadata: { from: current.key, to: input.role },
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    });
  });
}

/** Set a new password for someone else (for when email reset isn't an option). Signs them out everywhere. */
export async function resetAccountPassword(actor: Actor, raw: z.input<typeof resetPasswordSchema>, meta: Meta = {}) {
  const scope = assertPermission(actor, "users.reset_password");
  const input = resetPasswordSchema.parse(raw);
  await db.transaction(async (tx) => {
    const { target } = await loadManageable(tx, actor, input.userId, scope);
    const hash = await hashPassword(input.password);
    const updated = await tx
      .update(authAccounts)
      .set({ password: hash })
      .where(and(eq(authAccounts.userId, target.id), eq(authAccounts.providerId, "credential")))
      .returning({ id: authAccounts.id });
    if (updated.length === 0) {
      await tx.insert(authAccounts).values({ userId: target.id, accountId: target.id, providerId: "credential", password: hash });
    }
    await tx.delete(sessions).where(eq(sessions.userId, target.id));
    await tx.insert(auditLogs).values({
      actorUserId: actor.id,
      action: "user.password_set_by_admin",
      targetType: "user",
      targetId: target.id,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    });
  });
}

/** Dealers and resellers, for choosing a customer's parent. */
export async function listPartners(actor: Actor) {
  assertPermission(actor, "users.read", "all");
  return db
    .select({ id: users.id, name: users.name, company: users.company, role: roles.key })
    .from(users)
    .innerJoin(userRoles, eq(userRoles.userId, users.id))
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(and(inArray(roles.key, ["DEALER", "RESELLER"]), eq(users.status, "active")))
    .orderBy(users.name);
}

export interface AccountDetail {
  id: string;
  name: string;
  email: string;
  company: string | null;
  status: "active" | "disabled" | "pending";
  role: RoleKey;
  parent: { id: string; name: string } | null;
  children: number;
  createdAt: Date;
  lastLoginAt: Date | null;
  activity: { id: string; action: string; actorName: string | null; createdAt: Date }[];
}

/** One account, if the actor may see it. */
export async function getAccount(actor: Actor, userId: string): Promise<AccountDetail | null> {
  const scope = assertPermission(actor, "users.read");
  if (scope !== "all" && userId !== actor.id && !(await isInNetwork(db, actor.id, userId))) return null;
  const u = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!u) return null;
  const role = await roleOf(db, u.id);
  const parent = u.parentUserId
    ? ((await db.query.users.findFirst({ where: eq(users.id, u.parentUserId), columns: { id: true, name: true } })) ?? null)
    : null;
  const [{ n }] = (await db.select({ n: sql<number>`count(*)::int` }).from(users).where(eq(users.parentUserId, u.id))) as [{ n: number }];
  const activity = await db
    .select({ id: auditLogs.id, action: auditLogs.action, actorName: users.name, createdAt: auditLogs.createdAt })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorUserId))
    .where(and(eq(auditLogs.targetType, "user"), eq(auditLogs.targetId, u.id)))
    .orderBy(sql`${auditLogs.createdAt} desc`)
    .limit(15);
  return {
    id: u.id, name: u.name, email: u.email, company: u.company, status: u.status,
    role: role?.key ?? "CLIENT", parent, children: n, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt, activity,
  };
}

/** Headline counts for the admin overview. */
export async function accountCounts(actor: Actor) {
  assertPermission(actor, "users.read", "all");
  const rows = await db
    .select({ role: roles.key, status: users.status, n: sql<number>`count(*)::int` })
    .from(users)
    .innerJoin(userRoles, eq(userRoles.userId, users.id))
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .groupBy(roles.key, users.status);
  const out = { ADMIN: 0, DEALER: 0, RESELLER: 0, CLIENT: 0, disabled: 0 };
  for (const r of rows) {
    out[r.role as RoleKey] += r.n;
    if (r.status === "disabled") out.disabled += r.n;
  }
  return out;
}
