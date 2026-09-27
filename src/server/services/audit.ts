import "server-only";
import { desc, eq } from "drizzle-orm";
import type { Actor } from "@/server/auth/session";
import { assertPermission } from "@/server/auth/permissions";
import { db } from "@/server/db/client";
import { auditLogs, users } from "@/server/db/schema";

export interface AuditEntry {
  actorUserId: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}

/** Append an audit event. Never throws: a logging failure must not break the user's action. */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      actorUserId: entry.actorUserId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId ?? null,
      metadata: entry.metadata ?? {},
      ip: entry.ip ?? null,
      userAgent: entry.userAgent ?? null,
    });
  } catch (err) {
    console.error("[audit] failed to record", entry.action, err);
  }
}

export interface AuditRow {
  id: string;
  action: string;
  actorName: string | null;
  targetType: string;
  targetId: string | null;
  createdAt: Date;
}

export async function listRecentAudit(actor: Actor, limit = 20): Promise<AuditRow[]> {
  assertPermission(actor, "audit.read", "all");
  return db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      actorName: users.name,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorUserId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(Math.min(Math.max(limit, 1), 200));
}
