import { relations } from "drizzle-orm";
import { permissions, rolePermissions, roles, userRoles } from "./access";
import { auditLogs } from "./audit";
import { authAccounts, sessions, users } from "./auth";

export * from "./access";
export * from "./audit";
export * from "./auth";

export const usersRelations = relations(users, ({ one, many }) => ({
  parent: one(users, { fields: [users.parentUserId], references: [users.id], relationName: "ownership" }),
  children: many(users, { relationName: "ownership" }),
  sessions: many(sessions),
  accounts: many(authAccounts),
  roles: many(userRoles),
  auditLogs: many(auditLogs),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const authAccountsRelations = relations(authAccounts, ({ one }) => ({
  user: one(users, { fields: [authAccounts.userId], references: [users.id] }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(userRoles),
  permissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  roles: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, { fields: [auditLogs.actorUserId], references: [users.id] }),
}));
