import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Forbidden } from "@/components/app/forbidden";
import { RoleBadge, StatusBadge } from "@/components/app/role-badge";
import { PageHeader } from "@/components/app/shell";
import { Alert } from "@/components/ui/alert";
import { requireActor } from "@/server/auth/session";
import { getAccount } from "@/server/services/accounts";
import { LedgerTable } from "@/components/app/ledger-table";
import { formatCents } from "@/lib/money";
import { listLedger, walletBalance } from "@/server/services/wallet";
import { WalletEntryForm } from "./wallet-entry-form";
import { ManageAccount } from "./manage-account";

export const metadata: Metadata = { title: "Account", robots: { index: false } };

const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const actionLabel: Record<string, string> = {
  "user.created": "Account created",
  "user.disabled": "Account disabled",
  "user.enabled": "Account enabled",
  "user.role_changed": "Role changed",
  "user.password_reset": "Password reset by email",
  "user.password_set_by_admin": "Password set by admin",
  "user.registered": "Registered",
  "wallet.entry_created": "Wallet entry recorded",
  "user.password_changed": "Password changed",
  "user.profile_updated": "Profile updated",
};

export default async function UserDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const actor = await requireActor("/admin/users");
  if (actor.role.key !== "ADMIN") return <Forbidden />;
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const account = await getAccount(actor, id);
  if (!account) notFound();
  const { created } = await searchParams;
  const hasWallet = account.role !== "ADMIN";
  const [balance, ledger] = hasWallet ? await Promise.all([walletBalance(actor, account.id), listLedger(actor, { userId: account.id, limit: 10 })]) : [0, []];

  const facts: [string, React.ReactNode][] = [
    ["Email", account.email],
    ["Company", account.company ?? "—"],
    ["Role", <RoleBadge key="r" role={account.role} />],
    ["Status", <StatusBadge key="s" status={account.status} />],
    ["Belongs to", account.parent ? <Link key="p" href={`/admin/users/${account.parent.id}`} className="text-nova hover:underline">{account.parent.name}</Link> : "Label Nova"],
    ["Customers in network", account.role === "DEALER" || account.role === "RESELLER" ? account.children : "—"],
    ["Created", date.format(account.createdAt)],
    ["Last sign-in", account.lastLoginAt ? date.format(account.lastLoginAt) : "Never"],
  ];

  return (
    <>
      <PageHeader title={account.name} description={<Link href="/admin/users" className="hover:text-ink">← All users</Link>} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:px-10">
        {created ? <Alert tone="success" className="lg:col-span-2">Account created. Share the email and password with the person privately.</Alert> : null}
        <section aria-labelledby="details-h" className="rounded-panel border border-line bg-surface">
          <h2 id="details-h" className="border-b border-line px-6 py-4 font-semibold">Details</h2>
          <dl className="divide-y divide-line">
            {facts.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[10rem_1fr] gap-4 px-6 py-3 text-[0.9375rem]">
                <dt className="text-ink-muted">{k}</dt>
                <dd className="min-w-0 break-words">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section aria-labelledby="manage-h" className="rounded-panel border border-line bg-surface p-6">
          <h2 id="manage-h" className="sr-only">Manage account</h2>
          <ManageAccount userId={account.id} status={account.status} role={account.role} isSelf={account.id === actor.id} />
        </section>
        {hasWallet ? (
          <section aria-labelledby="wallet-h" className="grid overflow-hidden rounded-panel border border-line bg-surface lg:col-span-2 lg:grid-cols-[1fr_1.3fr]">
            <div className="border-b border-line p-6 lg:border-r lg:border-b-0">
              <h2 id="wallet-h" className="font-semibold">Wallet</h2>
              <p className="mt-3 text-[0.875rem] text-ink-muted">Available balance</p>
              <p className="text-[2rem] leading-tight font-semibold tabular-nums">{formatCents(balance)}</p>
              <div className="mt-6"><WalletEntryForm userId={account.id} /></div>
            </div>
            <div>
              <h3 className="border-b border-line px-6 py-4 font-semibold">Recent entries</h3>
              <LedgerTable rows={ledger} empty="No wallet entries yet." />
            </div>
          </section>
        ) : null}
        <section aria-labelledby="hist-h" className="rounded-panel border border-line bg-surface lg:col-span-2">
          <h2 id="hist-h" className="border-b border-line px-6 py-4 font-semibold">Account history</h2>
          {account.activity.length === 0 ? (
            <p className="px-6 py-8 text-center text-ink-muted">No changes recorded yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {account.activity.map((a) => (
                <li key={a.id} className="flex flex-wrap justify-between gap-2 px-6 py-3 text-[0.9375rem]">
                  <span>
                    {actionLabel[a.action] ?? a.action}
                    <span className="text-ink-muted"> · by {a.actorName ?? "System"}</span>
                  </span>
                  <time className="text-[0.875rem] text-ink-muted">{date.format(a.createdAt)}</time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
