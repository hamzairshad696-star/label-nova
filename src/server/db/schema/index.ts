import { relations } from "drizzle-orm";
import { permissions, rolePermissions, roles, userRoles } from "./access";
import { auditLogs } from "./audit";
import { authAccounts, sessions, users } from "./auth";
import { shipmentEvents, shipments } from "./shipping";
import { walletLedger } from "./wallet";

export * from "./access";
export * from "./audit";
export * from "./auth";
export * from "./shipping";
export * from "./wallet";

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

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  owner: one(users, { fields: [shipments.ownerUserId], references: [users.id] }),
  events: many(shipmentEvents),
}));

export const shipmentEventsRelations = relations(shipmentEvents, ({ one }) => ({
  shipment: one(shipments, { fields: [shipmentEvents.shipmentId], references: [shipments.id] }),
}));

export const walletLedgerRelations = relations(walletLedger, ({ one }) => ({
  user: one(users, { fields: [walletLedger.userId], references: [users.id] }),
  shipment: one(shipments, { fields: [walletLedger.shipmentId], references: [shipments.id] }),
}));
