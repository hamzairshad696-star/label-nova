import "server-only";
import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/server/db/client";
import { permissions, rolePermissions, roles, userRoles, users } from "@/server/db/schema";
import { auth } from "./auth";
import type { Grants, PermissionKey, RoleKey } from "./catalog";
import { PermissionError, type Actor } from "./permissions";

export type { Actor } from "./permissions";
export { assertPermission, hasPermission, PermissionError } from "./permissions";

/**
 * The signed-in actor for this request, or null. Runs once per request (React cache).
 * Status, role and grants are read from the database every time, so disabling a user or
 * changing a grant takes effect immediately — not when the session expires.
 */
export const getActor = cache(async (): Promise<Actor | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      company: users.company,
      parentUserId: users.parentUserId,
      status: users.status,
      roleId: roles.id,
      roleKey: roles.key,
      roleName: roles.name,
      roleRank: roles.rank,
    })
    .from(users)
    .innerJoin(userRoles, eq(userRoles.userId, users.id))
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(users.id, session.user.id))
    .orderBy(desc(roles.rank))
    .limit(1);

  if (!row || row.status !== "active") return null;

  const grantRows = await db
    .select({ key: permissions.key, scope: rolePermissions.scope })
    .from(rolePermissions)
    .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(eq(rolePermissions.roleId, row.roleId));

  const grants: Grants = {};
  for (const g of grantRows) grants[g.key as PermissionKey] = g.scope;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    parentUserId: row.parentUserId,
    role: { id: row.roleId, key: row.roleKey as RoleKey, name: row.roleName, rank: row.roleRank },
    grants,
  };
});

/** For pages and layouts: returns the actor or redirects to /login?next=… */
export async function requireActor(nextPath = "/app"): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return actor;
}

type Handler = (actor: Actor, request: Request) => Promise<Response> | Response;

/** For route handlers: JSON 401 when signed out, 403 when the permission is missing. */
export function withActor(handler: Handler, options: { permission?: PermissionKey } = {}) {
  return async (request: Request): Promise<Response> => {
    const actor = await getActor();
    if (!actor) return Response.json({ error: "unauthorized", message: "Log in to continue." }, { status: 401 });
    try {
      if (options.permission && actor.grants[options.permission] === undefined) throw new PermissionError(options.permission);
      return await handler(actor, request);
    } catch (err) {
      if (err instanceof PermissionError) {
        return Response.json({ error: "forbidden", message: "You don't have permission to do this." }, { status: 403 });
      }
      throw err;
    }
  };
}
