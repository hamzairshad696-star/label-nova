import type { RoleKey } from "@/server/auth/catalog";

export type NavIcon = "grid" | "users" | "file" | "stack" | "box" | "route" | "layers" | "wallet" | "list" | "code" | "cog" | "help";

export interface ShellNavItem {
  label: string;
  href: string;
  icon: NavIcon;
  /** Exact match only (for index routes like /admin). */
  exact?: boolean;
  /** Not built yet: shown so people can see what's coming, but not a link. */
  soon?: boolean;
}

/** Each phase flips `soon` off when its page ships and is tested. */
export function navFor(area: "admin" | "app", role: RoleKey): ShellNavItem[] {
  if (area === "admin") {
    return [
      { label: "Overview", href: "/admin", icon: "grid", exact: true },
      { label: "Users", href: "/admin/users", icon: "users" },
      { label: "Pricing", href: "/admin/pricing", icon: "list" },
    ];
  }
  const account: ShellNavItem[] = [
    { label: "Settings", href: "/app/settings", icon: "cog" },
    { label: "Support", href: "/app/support", icon: "help" },
  ];
  if (role !== "CLIENT") return [{ label: "Dashboard", href: "/app", icon: "grid", exact: true }, ...account];
  return [
    { label: "Dashboard", href: "/app", icon: "grid", exact: true },
    { label: "Create label", href: "/app/create-label", icon: "file", soon: true },
    { label: "Bulk shipping", href: "/app/bulk", icon: "stack", soon: true },
    { label: "Shipments", href: "/app/shipments", icon: "box" },
    { label: "Tracking", href: "/app/tracking", icon: "route", soon: true },
    { label: "Templates", href: "/app/templates", icon: "layers", soon: true },
    { label: "Wallet", href: "/app/wallet", icon: "wallet" },
    { label: "Transactions", href: "/app/transactions", icon: "list" },
    { label: "API", href: "/app/api", icon: "code", soon: true },
    ...account,
  ];
}
