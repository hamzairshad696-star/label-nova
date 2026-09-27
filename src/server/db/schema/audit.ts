import { index, inet, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

/** Append-only security and business event log. */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid().primaryKey().defaultRandom(),
    actorUserId: uuid().references(() => users.id, { onDelete: "set null" }),
    action: text().notNull(),
    targetType: text().notNull(),
    targetId: text(),
    metadata: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    ip: inet(),
    userAgent: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_logs_created_idx").on(t.createdAt.desc()),
    index("audit_logs_target_idx").on(t.targetType, t.targetId),
    index("audit_logs_actor_idx").on(t.actorUserId),
  ],
);
