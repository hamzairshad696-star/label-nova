import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ROLE_LABEL, type RoleKey } from "@/server/auth/catalog";

const tone: Record<string, BadgeTone> = { ADMIN: "accent", DEALER: "info", RESELLER: "warning", CLIENT: "neutral" };

export function RoleBadge({ role }: { role: string }) {
  return <Badge tone={tone[role] ?? "neutral"}>{ROLE_LABEL[role as RoleKey] ?? role}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const t: BadgeTone = status === "active" ? "success" : status === "disabled" ? "danger" : "warning";
  return <Badge tone={t}>{status === "active" ? "Active" : status === "disabled" ? "Disabled" : "Pending"}</Badge>;
}
