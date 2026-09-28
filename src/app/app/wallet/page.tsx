import type { Metadata } from "next";
import Link from "next/link";
import { LedgerTable } from "@/components/app/ledger-table";
import { PageHeader } from "@/components/app/shell";
import { whatsappLink } from "@/config/support";
import { formatCents } from "@/lib/money";
import { requireActor } from "@/server/auth/session";
import { listLedger, monthSpend, walletBalance } from "@/server/services/wallet";

export const metadata: Metadata = { title: "Wallet", robots: { index: false } };

export default async function WalletPage() {
  const actor = await requireActor("/app/wallet");
  const [balance, spent, recent] = await Promise.all([walletBalance(actor), monthSpend(actor), listLedger(actor, { limit: 5 })]);
  return (
    <>
      <PageHeader title="Wallet" description="Your prepaid balance. Each label is paid from it." />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 px-5 py-8 sm:px-8 lg:px-10">
        <div className="grid gap-px overflow-hidden rounded-panel border border-line bg-line md:grid-cols-[1.2fr_1fr_1.2fr]">
          <div className="bg-midnight p-6 text-white">
            <p className="text-[0.875rem] text-midnight-muted">Available balance</p>
            <p className="mt-2 text-[2.5rem] leading-none font-semibold tabular-nums">{formatCents(balance)}</p>
          </div>
          <div className="bg-surface p-6">
            <p className="text-[0.875rem] text-ink-muted">Spent this month</p>
            <p className="mt-2 text-[1.75rem] leading-none font-semibold tabular-nums">{formatCents(spent)}</p>
          </div>
          <div className="bg-surface p-6">
            <p className="font-semibold">Add funds</p>
            <p className="mt-1 text-[0.9375rem] text-ink-muted">Top-ups are credited by the Label Nova team. Card payments will be added later.</p>
            <a href={whatsappLink("general")} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block font-medium text-nova underline underline-offset-4">
              Request a top-up on WhatsApp
            </a>
          </div>
        </div>
        <section aria-labelledby="recent-h" className="overflow-hidden rounded-panel border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 id="recent-h" className="font-semibold">Recent activity</h2>
            <Link href="/app/transactions" className="text-[0.875rem] text-nova hover:underline">All transactions</Link>
          </div>
          <LedgerTable rows={recent} empty="No wallet activity yet. Your first top-up will appear here." />
        </section>
      </div>
    </>
  );
}
