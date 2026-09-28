/**
 * Roles, permissions and default grants. This file is the seed for the database —
 * at runtime, permissions are read from the `role_permissions` table, so an admin
 * can change grants without a deploy. Run `npm run db:bootstrap` after editing.
 *
 * No server-only imports: CLI scripts import this file too.
 */

export const ROLE_KEYS = ["ADMIN", "DEALER", "RESELLER", "CLIENT"] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];

export const ROLES: Record<RoleKey, { name: string; rank: number }> = {
  ADMIN: { name: "Admin", rank: 100 },
  DEALER: { name: "Dealer", rank: 70 },
  RESELLER: { name: "Reseller", rank: 40 },
  CLIENT: { name: "Customer", rank: 10 },
};

/** Safety net for any account created through Better Auth directly. Public sign-up is disabled. */
export const DEFAULT_ROLE: RoleKey = "CLIENT";

/** Roles an admin can create from the console. ADMIN is deliberately not creatable from the UI. */
export const CREATABLE_ROLES = ["DEALER", "RESELLER", "CLIENT"] as const satisfies readonly RoleKey[];
export type CreatableRole = (typeof CREATABLE_ROLES)[number];

/** How each role is named in the interface. The database key CLIENT is shown as "Customer". */
export const ROLE_LABEL: Record<RoleKey, string> = { ADMIN: "Admin", DEALER: "Dealer", RESELLER: "Reseller", CLIENT: "Customer" };

/** Where each role lands after signing in. */
export function dashboardFor(role: RoleKey): string {
  return role === "ADMIN" ? "/admin" : "/app";
}

export const PERMISSIONS = {
  "labels.create": "Create labels",
  "labels.read": "View labels",
  "bulk.create": "Run bulk uploads",
  "orders.read": "View orders",
  "orders.cancel": "Cancel orders",
  "customers.manage": "Manage customers",
  "templates.use": "Use templates",
  "templates.write": "Create, edit and publish templates",
  "designer.custom_layouts": "Build custom layouts in the designer",
  "pricing.write": "Change platform pricing",
  "pricing.override_downline": "Set margins for accounts below you",
  "wallet.read": "View wallets and transactions",
  "wallet.adjust": "Manually credit or debit wallets",
  "wallet.transfer_downline": "Transfer balance to accounts below you",
  "users.read": "View user accounts",
  "users.create": "Create user accounts",
  "users.disable": "Disable user accounts",
  "users.assign_role": "Change a user's role",
  "users.reset_password": "Set a new password for another user",
  "api_keys.manage": "Manage API keys",
  "analytics.read": "View analytics",
  "audit.read": "View the audit log",
  "settings.system": "Change system settings",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionScope = "own" | "network" | "all";
export type Grants = Partial<Record<PermissionKey, PermissionScope>>;

export const DEFAULT_GRANTS: Record<RoleKey, Grants> = {
  ADMIN: Object.fromEntries(Object.keys(PERMISSIONS).map((k) => [k, "all"])) as Grants,
  DEALER: {
    "labels.create": "own",
    "labels.read": "network",
    "bulk.create": "own",
    "orders.read": "network",
    "orders.cancel": "network",
    "customers.manage": "network",
    "templates.use": "own",
    "designer.custom_layouts": "own",
    "pricing.override_downline": "network",
    "wallet.read": "network",
    "wallet.transfer_downline": "network",
    "users.read": "network",
    "users.create": "network",
    "users.disable": "network",
    "api_keys.manage": "own",
    "analytics.read": "network",
  },
  RESELLER: {
    "labels.create": "own",
    "labels.read": "network",
    "bulk.create": "own",
    "orders.read": "network",
    "orders.cancel": "own",
    "customers.manage": "network",
    "templates.use": "own",
    "designer.custom_layouts": "own",
    "pricing.override_downline": "network",
    "wallet.read": "network",
    "wallet.transfer_downline": "network",
    "users.read": "network",
    "users.create": "network",
    "users.disable": "network",
    "api_keys.manage": "own",
    "analytics.read": "network",
  },
  CLIENT: {
    "labels.create": "own",
    "labels.read": "own",
    "bulk.create": "own",
    "orders.read": "own",
    "orders.cancel": "own",
    "customers.manage": "own",
    "templates.use": "own",
    "wallet.read": "own",
    "api_keys.manage": "own",
    "analytics.read": "own",
  },
};
