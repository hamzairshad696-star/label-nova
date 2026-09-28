import { navFor } from "@/components/app/nav";
import { Shell } from "@/components/app/shell";
import { ROLE_LABEL } from "@/server/auth/catalog";
import { requireActor } from "@/server/auth/session";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor("/app");
  return (
    <Shell
      area="app"
      nav={navFor("app", actor.role.key)}
      user={{ name: actor.name, email: actor.email, roleLabel: ROLE_LABEL[actor.role.key] }}
      switchTo={actor.role.key === "ADMIN" ? { label: "Open control center", href: "/admin" } : undefined}
    >
      {children}
    </Shell>
  );
}
