import { AppTopbar } from "@/components/app/app-topbar";
import { Forbidden } from "@/components/app/forbidden";
import { requireActor } from "@/server/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor("/admin");
  const allowed = actor.role.key === "ADMIN";
  return (
    <div className="min-h-dvh">
      <AppTopbar actor={actor} area={allowed ? "admin" : "app"} />
      {allowed ? children : <Forbidden />}
    </div>
  );
}
