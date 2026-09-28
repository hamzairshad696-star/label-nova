import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Forbidden } from "@/components/app/forbidden";
import { PricingHistory } from "@/components/app/pricing-history";
import { PageHeader } from "@/components/app/shell";
import { requireActor } from "@/server/auth/session";
import { getRule, listPricingChanges } from "@/server/services/pricing";
import { RuleForm } from "../../pricing-forms";

export const metadata: Metadata = { title: "Edit price rule", robots: { index: false } };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditRulePage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor("/admin/pricing");
  if (actor.role.key !== "ADMIN") return <Forbidden />;
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const found = await getRule(actor, id);
  if (!found) notFound();
  const history = await listPricingChanges(actor, { ruleId: id });
  const { rule, service } = found;
  return (
    <>
      <PageHeader title={`Edit rule · ${service.name}`} description={<Link href="/admin/pricing" className="hover:text-ink">← Pricing</Link>} />
      <div className="grid max-w-[1000px] gap-6 px-5 py-8 sm:px-8 lg:px-10">
        <section aria-labelledby="edit-h" className="rounded-panel border border-line bg-surface p-6">
          <h2 id="edit-h" className="mb-1 font-semibold">Price band</h2>
          <p className="mb-5 text-[0.9375rem] text-ink-muted">Saving applies to the next label. Labels already bought keep the price they were charged.</p>
          <RuleForm serviceId={rule.serviceId} ruleId={rule.id} defaults={rule} />
        </section>
        <section aria-labelledby="hist-h" className="rounded-panel border border-line bg-surface">
          <h2 id="hist-h" className="border-b border-line px-6 py-4 font-semibold">History of this rule</h2>
          <PricingHistory rows={history} />
        </section>
      </div>
    </>
  );
}
