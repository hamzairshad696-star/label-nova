import { index, integer, pgEnum, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const permissionScope = pgEnum("permission_scope", ["own", "network", "all"]);

export const roles = pgTable("roles", {
  id: uuid().primaryKey().defaultRandom(),
  key: text().notNull().unique(),
  name: text().notNull(),
  /** Higher rank = more privileged. Nobody can grant a role at or above their own rank. */
  rank: integer().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const permissions = pgTable("permissions", {
  id: uuid().primaryKey().defaultRandom(),
  key: text().notNull().unique(),
  description: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid()
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid()
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    scope: permissionScope().notNull(),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
);

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid()
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] }), index("user_roles_role_idx").on(t.roleId)],
);
