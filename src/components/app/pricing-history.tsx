import { formatCents } from "@/lib/money";

const dateTime = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const labels: Record<string, string> = { weightMinOz: "Weight from", weightMaxOz: "Weight to", zone: "Zone", costCents: "Cost", customerCents: "Customer", dealerCents: "Dealer", resellerCents: "Reseller", active: "Active" };
const fmt = (k: string, v: unknown) => (v === null || v === undefined ? "—" : k.endsWith("Cents") ? formatCents(Number(v)) : k.startsWith("weight") ? `${v} oz` : String(v));

export interface ChangeRow {
  id: string; action: string; before: Record<string, unknown> | null; after: Record<string, unknown> | null;
  createdAt: Date; actorName: string | null; serviceName?: string; carrierName?: string;
}

export function PricingHistory({ rows, showService }: { rows: ChangeRow[]; showService?: boolean }) {
  if (rows.length === 0) return <p className="px-6 py-10 text-center text-ink-muted">No pricing changes yet.</p>;
  return (
    <ul className="divide-y divide-line">
      {rows.map((c) => {
        const diffs = c.action === "created"
          ? Object.keys(labels).filter((k) => k !== "active").map((k) => `${labels[k]} ${fmt(k, c.after?.[k])}`)
          : Object.keys(labels).filter((k) => JSON.stringify(c.before?.[k]) !== JSON.stringify(c.after?.[k])).map((k) => `${labels[k]}: ${fmt(k, c.before?.[k])} → ${fmt(k, c.after?.[k])}`);
        return (
          <li key={c.id} className="px-6 py-3.5 text-[0.9375rem]">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="font-medium">
                Rule {c.action}
                {showService ? <span className="font-normal text-ink-muted"> · {c.carrierName} {c.serviceName}</span> : null}
              </span>
              <span className="text-[0.875rem] text-ink-muted">{c.actorName ?? "System"} · {dateTime.format(c.createdAt)}</span>
            </div>
            <p className="mt-1 text-[0.875rem] text-ink-muted">{diffs.join(" · ")}</p>
          </li>
        );
      })}
    </ul>
  );
}
