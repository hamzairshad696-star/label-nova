import { formatCents } from "@/lib/money";
import type { ShipmentStatus } from "@/server/services/shipments";
import { ShipmentStatusBadge } from "./shipment-status";

const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export interface ShipmentRow {
  id: string;
  reference: string | null;
  status: ShipmentStatus;
  toName: string | null;
  toCity: string | null;
  carrier: string | null;
  service: string | null;
  trackingNumber: string | null;
  priceCents: number | null;
  currency: string;
  createdAt: Date;
}

export function ShipmentsTable({ rows }: { rows: ShipmentRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-[0.9375rem]">
        <thead className="bg-paper text-[0.8125rem] text-ink-muted">
          <tr>
            {["Recipient", "Reference", "Service", "Tracking", "Status", "Cost", "Created"].map((h) => (
              <th key={h} scope="col" className="px-5 py-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((s) => (
            <tr key={s.id}>
              <td className="px-5 py-3.5">
                <p className="font-medium">{s.toName ?? "—"}</p>
                {s.toCity ? <p className="text-[0.8125rem] text-ink-muted">{s.toCity}</p> : null}
              </td>
              <td className="px-5 py-3.5 text-ink-muted">{s.reference ?? "—"}</td>
              <td className="px-5 py-3.5 text-ink-muted">{s.carrier ? `${s.carrier} ${s.service ?? ""}` : "—"}</td>
              <td className="px-5 py-3.5 font-mono text-[0.8125rem]">{s.trackingNumber ?? "—"}</td>
              <td className="px-5 py-3.5"><ShipmentStatusBadge status={s.status} /></td>
              <td className="px-5 py-3.5 tabular-nums">{s.priceCents === null ? "—" : formatCents(s.priceCents, s.currency)}</td>
              <td className="px-5 py-3.5 text-ink-muted">{date.format(s.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Compact list for narrow panels such as the dashboard. */
export function ShipmentsList({ rows }: { rows: ShipmentRow[] }) {
  return (
    <ul className="divide-y divide-line">
      {rows.map((s) => (
        <li key={s.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
          <div className="min-w-0">
            <p className="truncate font-medium">{s.toName ?? s.reference ?? "Untitled shipment"}</p>
            <p className="truncate text-[0.8125rem] text-ink-muted">
              {[s.toName ? s.reference : null, s.carrier ? `${s.carrier} ${s.service ?? ""}`.trim() : null, date.format(s.createdAt)].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <ShipmentStatusBadge status={s.status} />
            <span className="w-16 text-right tabular-nums">{s.priceCents === null ? "—" : formatCents(s.priceCents, s.currency)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
