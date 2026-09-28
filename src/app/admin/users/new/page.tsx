import type { Metadata } from "next";
import { Forbidden } from "@/components/app/forbidden";
import { PageHeader } from "@/components/app/shell";
import { requireActor } from "@/server/auth/session";
import { listPartners } from "@/server/services/accounts";
import { CreateAccountForm } from "./create-account-form";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default async function NewUserPage() {
  const actor = await requireActor("/admin/users/new");
  if (actor.role.key !== "ADMIN") return <Forbidden />;
  const partners = await listPartners(actor);
  return (
    <>
      <PageHeader title="Create account" description="The account can sign in as soon as it's active." />
      <div className="max-w-[760px] px-5 py-8 sm:px-8 lg:px-10">
        <div className="rounded-panel border border-line bg-surface p-6 sm:p-8">
          <CreateAccountForm partners={partners} />
        </div>
      </div>
    </>
  );
}
