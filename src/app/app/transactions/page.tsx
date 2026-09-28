import type { Metadata } from "next";
import { LedgerTable } from "@/components/app/ledger-table";
import { PageHeader } from "@/components/app/shell";
import { requireActor } from "@/server/auth/session";
import { listLedger } from "@/server/services/wallet";

export const metadata: Metadata = { title: "Transactions", robots: { index: false } };

export default async function TransactionsPage() {
  const actor = await requireActor("/app/transactions");
  const rows = await listLedger(actor, { limit: 500 });
  return (
    <>
      <PageHeader title="Transactions" description="Every change to your balance. Entries are permanent: corrections appear as new entries." />
      <div className="px-5 py-8 sm:px-8 lg:px-10">
        <div className="overflow-hidden rounded-panel border border-line bg-surface">
          <LedgerTable rows={rows} empty="No transactions yet." />
        </div>
      </div>
    </>
  );
}
