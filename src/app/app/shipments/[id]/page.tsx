import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/shell";
import { ShipmentStatusBadge } from "@/components/app/shipment-status";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { requireActor } from "@/server/auth/session";
import { LABEL_FORMATS } from "@/server/labels/render";
import { getShipment } from "@/server/services/labels";

export const metadata: Metadata = { title: "Shipment", robots: { index: false } };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const dateTime = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export default async function ShipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor("/app/shipments");
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const s = await getShipment(actor, id);
  if (!s) notFound();
  const to = s.toAddress, from = s.fromAddress;
  const addr = (a: typeof to) => (a ? [a.name, a.company, a.line1, a.line2, `${a.city}, ${a.state} ${a.postalCode}`, a.country].filter(Boolean).join("\n") : "—");
  const oz = s.weightOz ?? 0;

  return (
    <>
      <PageHeader
        title={s.labelNumber ?? s.reference ?? "Shipment"}
        description={<Link href="/app/shipments" className="hover:text-ink">← All shipments</Link>}
        actions={s.labelNumber ? <ButtonLink href={`/api/labels/${s.id}?format=4x6`} target="_blank" variant="accent">Download label</ButtonLink> : undefined}
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:px-10">
        <section aria-labelledby="d-h" className="rounded-panel border border-line bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
            <h2 id="d-h" className="font-semibold">Details</h2>
            <ShipmentStatusBadge status={s.status} />
          </div>
          <dl className="grid gap-px bg-line sm:grid-cols-2">
            {([
              ["Ship to", addr(to)],
              ["Ship from", addr(from)],
              ["Service", <span key="s">{s.carrierName} {s.serviceName} {s.serviceKind === "label_only" ? <Badge tone="accent">Label only · no postage</Badge> : null}</span>],
              ["Package", `${oz >= 16 ? `${Math.floor(oz / 16)} lb ${oz % 16} oz` : `${oz} oz`}${s.lengthIn ? ` · ${s.lengthIn} × ${s.widthIn} × ${s.heightIn} in` : ""}`],
              ["Label number", s.labelNumber ?? "—"],
              ["Carrier tracking", s.trackingNumber ?? "None — label-only labels have no carrier tracking number"],
              ["Your reference", s.reference ?? "—"],
              ["Charged", s.priceCents === null ? "—" : formatCents(s.priceCents, s.currency)],
            ] as [string, React.ReactNode][]).map(([k, v]) => (
              <div key={k} className="bg-surface px-6 py-4">
                <dt className="text-[0.8125rem] font-medium text-ink-muted">{k}</dt>
                <dd className={`mt-1 whitespace-pre-line text-[0.9375rem] ${k === "Label number" ? "font-mono" : ""}`}>{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="grid content-start gap-6">
          {s.labelNumber ? (
            <section aria-labelledby="l-h" className="rounded-panel border border-line bg-surface p-6">
              <h2 id="l-h" className="font-semibold">Print</h2>
              <p className="mt-1 text-[0.875rem] text-ink-muted">Every format is generated from this shipment&rsquo;s saved details.</p>
              <ul className="mt-4 grid gap-2">
                {Object.entries(LABEL_FORMATS).map(([k, f]) => (
                  <li key={k}>
                    <a href={`/api/labels/${s.id}?format=${k}`} target="_blank" rel="noopener" className="flex items-center justify-between rounded-control border border-line px-4 py-2.5 text-[0.9375rem] hover:border-nova">
                      {f.label}
                      <span className="text-[0.8125rem] text-nova">PDF</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <section aria-labelledby="t-h" className="rounded-panel border border-line bg-surface p-6">
            <h2 id="t-h" className="font-semibold">Timeline</h2>
            {s.events.length === 0 ? (
              <p className="mt-3 text-[0.9375rem] text-ink-muted">No events yet.</p>
            ) : (
              <ol className="mt-4 grid gap-4">
                {[...s.events].reverse().map((e) => (
                  <li key={e.id} className="grid grid-cols-[0.75rem_1fr] gap-3">
                    <span aria-hidden="true" className="mt-1.5 size-2.5 rounded-full bg-nova" />
                    <div>
                      <p className="font-medium">{e.description}</p>
                      <p className="text-[0.8125rem] text-ink-muted">{dateTime.format(e.occurredAt)}{e.location ? ` · ${e.location}` : ""} · {e.source === "label_nova" ? "Label Nova" : e.source}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-5 text-[0.8125rem] text-ink-muted">Carrier scan events appear here once a carrier partner is connected. Nothing is estimated or invented.</p>
          </section>
        </div>
      </div>
    </>
  );
}
