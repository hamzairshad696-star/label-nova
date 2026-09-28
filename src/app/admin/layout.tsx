import { Forbidden } from "@/components/app/forbidden";
import { navFor } from "@/components/app/nav";
import { Shell } from "@/components/app/shell";
import { ROLE_LABEL } from "@/server/auth/catalog";
import { requireActor } from "@/server/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor("/admin");
  // Layouts are not a security boundary: every page and action checks again.
  if (actor.role.key !== "ADMIN") return <Forbidden />;
  return (
    <Shell area="admin" nav={navFor("admin", actor.role.key)} user={{ name: actor.name, email: actor.email, roleLabel: ROLE_LABEL[actor.role.key] }}>
      {children}
    </Shell>
  );
}
