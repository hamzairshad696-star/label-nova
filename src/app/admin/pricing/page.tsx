import type { Metadata } from "next";
import Link from "next/link";
import { Forbidden } from "@/components/app/forbidden";
import { PageHeader } from "@/components/app/shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { requireActor } from "@/server/auth/session";
import { getCatalog } from "@/server/services/pricing";
import { ActiveToggle, AddCarrierForm, AddServiceForm, RuleForm } from "./pricing-forms";

export const metadata: Metadata = { title: "Pricing", robots: { index: false } };

const weight = (min: number, max: number) => `${min}–${max} oz`;
const lb = (oz: number) => (oz % 16 === 0 ? `${oz / 16} lb` : `${(oz / 16).toFixed(2)} lb`);

export default async function PricingPage() {
  const actor = await requireActor("/admin/pricing");
  if (actor.role.key !== "ADMIN") return <Forbidden />;
  const catalog = await getCatalog(actor);
  const hasServices = catalog.some((c) => c.services.length > 0);

  return (
    <>
      <PageHeader
        title="Pricing"
        description="Every label is charged from these rules. Changes apply to the next label; past labels keep the price they were charged."
        actions={<ButtonLink href="/admin/pricing/history" variant="secondary">Change history</ButtonLink>}
      />
      {/* minmax(0,1fr): grid items otherwise grow to their widest table and push the page sideways on phones. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 px-5 py-8 sm:px-8 lg:px-10">
        {!hasServices ? (
          <div className="rounded-panel border border-dashed border-line-strong bg-surface p-6">
            <p className="font-semibold">No services are priced yet.</p>
            <p className="mt-1 max-w-[42rem] text-[0.9375rem] text-ink-muted">
              Customers can't create labels until a service has an active price for their parcel's weight. Add a carrier (for
              example “Label Nova” for label-only services), then a service, then its price rules.
            </p>
          </div>
        ) : null}

        {catalog.map((c) => (
          <section key={c.id} aria-labelledby={`c-${c.id}`} className="rounded-panel border border-line bg-surface">
            <h2 id={`c-${c.id}`} className="border-b border-line px-6 py-4 font-semibold">{c.name}</h2>
            {c.services.length === 0 ? <p className="px-6 py-6 text-[0.9375rem] text-ink-muted">No services for this carrier yet.</p> : null}
            {c.services.map((s) => (
              <div key={s.id} className="border-b border-line last:border-b-0">
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-semibold">{s.name}</h3>
                    <Badge tone={s.kind === "label_only" ? "accent" : "warning"}>{s.kind === "label_only" ? "Label only" : "Carrier postage · needs partner"}</Badge>
                    {!s.active ? <Badge tone="neutral">Inactive</Badge> : null}
                    {s.transitMinDays !== null ? <span className="text-[0.875rem] text-ink-muted">{s.transitMinDays}–{s.transitMaxDays ?? s.transitMinDays} days</span> : null}
                  </div>
                  <ActiveToggle id={s.id} active={s.active} kind="service" />
                </div>
                {s.rules.length > 0 ? (
                  <div className="relative overflow-x-auto">
                    <table className="w-full min-w-[780px] text-left text-[0.9375rem]">
                      <caption className="sr-only">Price rules for {c.name} {s.name}</caption>
                      <thead className="bg-paper text-[0.8125rem] text-ink-muted">
                        <tr>
                          {["Weight", "Zone", "Cost", "Customer", "Dealer", "Reseller", "Status", ""].map((h, i) => (
                            <th key={i} scope="col" className="px-5 py-2.5 font-medium">{h || <span className="sr-only">Actions</span>}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {s.rules.map((r) => (
                          <tr key={r.id} className={r.active ? "" : "text-ink-muted"}>
                            <td className="px-5 py-3">{weight(r.weightMinOz, r.weightMaxOz)}<span className="block text-[0.8125rem] text-ink-muted">up to {lb(r.weightMaxOz)}</span></td>
                            <td className="px-5 py-3">{r.zone ?? "Any"}</td>
                            <td className="px-5 py-3 tabular-nums">{r.costCents === null ? "—" : formatCents(r.costCents)}</td>
                            <td className="px-5 py-3 font-medium tabular-nums">{formatCents(r.customerCents)}</td>
                            <td className="px-5 py-3 tabular-nums">{formatCents(r.dealerCents)}</td>
                            <td className="px-5 py-3 tabular-nums">{formatCents(r.resellerCents)}</td>
                            <td className="px-5 py-3"><Badge tone={r.active ? "success" : "neutral"}>{r.active ? "Active" : "Inactive"}</Badge></td>
                            <td className="px-5 py-3">
                              <div className="flex items-start gap-1">
                                <Link href={`/admin/pricing/rules/${r.id}`} className="rounded-control px-3 py-1.5 text-[0.8125rem] font-medium text-nova hover:bg-nova-soft">Edit<span className="sr-only"> rule {weight(r.weightMinOz, r.weightMaxOz)}</span></Link>
                                <ActiveToggle id={r.id} active={r.active} kind="rule" />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="px-6 pb-4 text-[0.9375rem] text-ink-muted">No price rules yet, so this service can't be bought.</p>
                )}
                <details className="group border-t border-line px-6 py-4">
                  <summary className="cursor-pointer text-[0.9375rem] font-medium text-nova">Add a price rule</summary>
                  <div className="pt-5"><RuleForm serviceId={s.id} /></div>
                </details>
              </div>
            ))}
          </section>
        ))}

        <div className="grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="add-service-h" className="rounded-panel border border-line bg-surface p-6">
            <h2 id="add-service-h" className="mb-4 font-semibold">Add a service</h2>
            <AddServiceForm carriers={catalog.map((c) => ({ id: c.id, name: c.name }))} />
          </section>
          <section aria-labelledby="add-carrier-h" className="rounded-panel border border-line bg-surface p-6">
            <h2 id="add-carrier-h" className="mb-4 font-semibold">Add a carrier</h2>
            <AddCarrierForm />
          </section>
        </div>
      </div>
    </>
  );
}
