import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { safeNextPath } from "@/lib/safe-redirect";
import { dashboardFor } from "@/server/auth/catalog";
import type { Actor } from "@/server/auth/permissions";
import { db } from "@/server/db/client";
import { auditLogs } from "@/server/db/schema";

/** True when the session just created is this person's first ever sign-in (from the audit log, so no schema change). */
export async function isFirstSignIn(actor: Actor): Promise<boolean> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(auditLogs)
    .where(and(eq(auditLogs.actorUserId, actor.id), eq(auditLogs.action, "user.signed_in")));
  return (row?.n ?? 0) <= 1;
}

/**
 * Where to go after signing in: a requested page if this role may open it, otherwise the role's dashboard.
 * Non-admins asking for /admin go to their own dashboard instead of a 403.
 */
export function destinationFor(actor: Actor, requested: string | string[] | undefined | null): string {
  const home = dashboardFor(actor.role.key);
  if (!requested) return home;
  const next = safeNextPath(requested, home);
  if ((next === "/admin" || next.startsWith("/admin/")) && actor.role.key !== "ADMIN") return home;
  if (next === "/welcome" || next.startsWith("/welcome?") || next === "/login") return home;
  return next;
}
