import "server-only";
import { and, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { assertPermission, type Actor } from "@/server/auth/permissions";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  company: string | null;
  role: string;
  parentName: string | null;
  status: "active" | "disabled" | "pending";
  createdAt: Date;
  lastLoginAt: Date | null;
}

/** Ids of every user below `userId` in the ownership tree (not including the user). */
function descendantIds(userId: string): SQL {
  return sql`(
    with recursive tree as (
      select id from users where parent_user_id = ${userId}
      union
      select u.id from users u inner join tree t on u.parent_user_id = t.id
    )
    select id from tree
  )`;
}

/**
 * Lists users the actor may see. Scope comes from the actor's `users.read` grant:
 * `all` = everyone, `network` = everyone below them in the tree, `own` = only themselves.
 */
export async function listUsers(
  actor: Actor,
  { limit = 50, role }: { limit?: number; role?: string } = {},
): Promise<UserSummary[]> {
  const scope = assertPermission(actor, "users.read");
  const scoped =
    scope === "all" ? undefined : scope === "network" ? inArray(users.id, descendantIds(actor.id)) : eq(users.id, actor.id);
  const byRole = role
    ? sql`exists (select 1 from user_roles ur inner join roles r on r.id = ur.role_id where ur.user_id = "users"."id" and r.key = ${role})`
    : undefined;
  const where = scoped && byRole ? and(scoped, byRole) : (scoped ?? byRole);

  // Highest-ranked role per user. Written as plain SQL so the outer "users" reference stays qualified.
  const roleKey = sql<string | null>`(
    select r.key from user_roles ur
    inner join roles r on r.id = ur.role_id
    where ur.user_id = "users"."id"
    order by r.rank desc
    limit 1
  )`;

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      company: users.company,
      role: roleKey,
      parentName: sql<string | null>`(select p.name from users p where p.id = "users"."parent_user_id")`,
      status: users.status,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(Math.min(Math.max(limit, 1), 500));

  return rows.map((r) => ({ ...r, role: r.role ?? "NONE" }));
}
