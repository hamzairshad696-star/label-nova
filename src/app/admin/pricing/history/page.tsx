import type { Metadata } from "next";
import Link from "next/link";
import { Forbidden } from "@/components/app/forbidden";
import { PricingHistory } from "@/components/app/pricing-history";
import { PageHeader } from "@/components/app/shell";
import { requireActor } from "@/server/auth/session";
import { listPricingChanges } from "@/server/services/pricing";

export const metadata: Metadata = { title: "Pricing history", robots: { index: false } };

export default async function PricingHistoryPage() {
  const actor = await requireActor("/admin/pricing/history");
  if (actor.role.key !== "ADMIN") return <Forbidden />;
  const rows = await listPricingChanges(actor, { limit: 300 });
  return (
    <>
      <PageHeader title="Pricing history" description={<Link href="/admin/pricing" className="hover:text-ink">← Pricing</Link>} />
      <div className="px-5 py-8 sm:px-8 lg:px-10">
        <section className="rounded-panel border border-line bg-surface" aria-label="All pricing changes">
          <PricingHistory rows={rows} showService />
        </section>
      </div>
    </>
  );
}
