import { AppTopbar } from "@/components/app/app-topbar";
import { requireActor } from "@/server/auth/session";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor("/app");
  return (
    <div className="min-h-dvh">
      <AppTopbar actor={actor} area="app" />
      {children}
    </div>
  );
}
