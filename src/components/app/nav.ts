import type { RoleKey } from "@/server/auth/catalog";

export interface ShellNavItem {
  label: string;
  href: string;
  icon: "grid" | "users" | "shield" | "box";
  /** Exact match only (for index routes like /admin). */
  exact?: boolean;
}

/** Only pages that exist are listed. Each phase adds its items here when the page ships. */
export function navFor(area: "admin" | "app", _role: RoleKey): ShellNavItem[] {
  if (area === "admin") {
    return [
      { label: "Overview", href: "/admin", icon: "grid", exact: true },
      { label: "Users", href: "/admin/users", icon: "users" },
    ];
  }
  return [{ label: "Dashboard", href: "/app", icon: "grid", exact: true }];
}
