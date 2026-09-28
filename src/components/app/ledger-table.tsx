import { formatCents } from "@/lib/money";
import { ledgerKindLabel } from "@/server/services/wallet";

const dateTime = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export interface LedgerRow {
  id: string;
  kind: keyof typeof ledgerKindLabel;
  amountCents: number;
  currency: string;
  note: string | null;
  createdAt: Date;
  balanceAfter: string;
}

export function LedgerTable({ rows, empty }: { rows: LedgerRow[]; empty: string }) {
  if (rows.length === 0) return <p className="px-6 py-12 text-center text-[0.9375rem] text-ink-muted">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-[0.9375rem]">
        <thead className="bg-paper text-[0.8125rem] text-ink-muted">
          <tr>
            <th scope="col" className="px-5 py-3 font-medium">Date</th>
            <th scope="col" className="px-5 py-3 font-medium">Type</th>
            <th scope="col" className="px-5 py-3 font-medium">Note</th>
            <th scope="col" className="px-5 py-3 text-right font-medium">Amount</th>
            <th scope="col" className="px-5 py-3 text-right font-medium">Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-5 py-3.5 text-ink-muted">{dateTime.format(r.createdAt)}</td>
              <td className="px-5 py-3.5">{ledgerKindLabel[r.kind]}</td>
              <td className="px-5 py-3.5 text-ink-muted">{r.note ?? "—"}</td>
              <td className={`px-5 py-3.5 text-right tabular-nums ${r.amountCents > 0 ? "text-success" : ""}`}>
                {r.amountCents > 0 ? "+" : "−"}
                {formatCents(Math.abs(r.amountCents), r.currency)}
              </td>
              <td className="px-5 py-3.5 text-right tabular-nums">{formatCents(Number(r.balanceAfter), r.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
