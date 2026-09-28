import type { Metadata } from "next";
import { StatusBadge } from "@/components/app/role-badge";
import { PageHeader } from "@/components/app/shell";
import { StatusTag } from "@/components/marketing/status-tag";
import Link from "next/link";
import { ShipmentsList } from "@/components/app/shipments-table";
import { Button, ButtonLink } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import type { Actor } from "@/server/auth/permissions";
import { recentActivity } from "@/server/services/activity";
import { listShipments, shipmentCounts } from "@/server/services/shipments";
import { ledgerKindLabel, monthSpend, walletBalance } from "@/server/services/wallet";
import { capabilities, type CapabilityKey } from "@/config/capabilities";
import { whatsappLink } from "@/config/support";
import { ROLE_LABEL } from "@/server/auth/catalog";
import { requireActor } from "@/server/auth/session";
import { listUsers } from "@/server/services/users";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const dateTime = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

function Upcoming({ keys }: { keys: CapabilityKey[] }) {
  return (
    <section aria-labelledby="next-h" className="rounded-panel border border-line bg-surface">
      <h2 id="next-h" className="border-b border-line px-6 py-4 font-semibold">Coming to your workspace</h2>
      <ul className="divide-y divide-line">
        {keys.map((k) => (
          <li key={k} className="flex flex-wrap items-start justify-between gap-3 px-6 py-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{capabilities[k].title}</p>
              <p className="mt-0.5 text-[0.9375rem] text-ink-muted">{capabilities[k].summary}</p>
            </div>
            <StatusTag status={capabilities[k].status} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function DashboardPage() {
  const actor = await requireActor("/app");
  const role = actor.role.key;
  const firstName = actor.name.trim().split(/\s+/)[0] || actor.name;

  if (role === "DEALER" || role === "RESELLER") {
    const customers = (await listUsers(actor, { limit: 500 })).filter((u) => u.id !== actor.id);
    return (
      <>
        <PageHeader title={`${ROLE_LABEL[role]} dashboard`} description={`Hello, ${firstName}. Here's your network.`} />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 px-5 py-8 sm:px-8 lg:px-10">
          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-line bg-line lg:grid-cols-3">
            <li className="bg-surface p-5">
              <p className="text-[0.875rem] text-ink-muted">Customers in your network</p>
              <p className="mt-1 text-[2rem] leading-none font-semibold tabular-nums">{customers.length}</p>
            </li>
            <li className="bg-surface p-5">
              <p className="text-[0.875rem] text-ink-muted">Active</p>
              <p className="mt-1 text-[2rem] leading-none font-semibold tabular-nums">{customers.filter((c) => c.status === "active").length}</p>
            </li>
            <li className="col-span-2 bg-surface p-5 lg:col-span-1">
              <p className="text-[0.875rem] text-ink-muted">Need a new customer account?</p>
              <a href={whatsappLink("partner")} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-medium text-nova hover:underline">
                Ask the Label Nova team
              </a>
            </li>
          </ul>
          <section aria-labelledby="cust-h" className="rounded-panel border border-line bg-surface">
            <h2 id="cust-h" className="border-b border-line px-6 py-4 font-semibold">Your customers</h2>
            {customers.length === 0 ? (
              <p className="px-6 py-10 text-center text-ink-muted">No customers in your network yet. The Label Nova team adds them for you.</p>
            ) : (
              <ul className="divide-y divide-line">
                {customers.slice(0, 20).map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-[0.8125rem] text-ink-muted">{c.company ?? c.email}</p>
                    </div>
                    <div className="flex items-center gap-4 text-[0.875rem] text-ink-muted">
                      <span>Since {date.format(c.createdAt)}</span>
                      <StatusBadge status={c.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <Upcoming keys={["pricing", "wallet", "orders"]} />
        </div>
      </>
    );
  }

  if (role === "ADMIN") {
    return (
      <>
        <PageHeader title="Workspace" description={`Hello, ${firstName}.`} actions={<ButtonLink href="/admin" variant="accent">Open control center</ButtonLink>} />
        <div className="px-5 py-8 sm:px-8 lg:px-10">
          <p className="text-ink-muted">Customers, dealers and resellers each get their own workspace here. You manage the platform from the control center.</p>
        </div>
      </>
    );
  }

  return <CustomerDashboard actor={actor} firstName={firstName} />;
}

async function CustomerDashboard({ actor, firstName }: { actor: Actor; firstName: string }) {
  const [counts, balance, spent, recent, activity] = await Promise.all([
    shipmentCounts(actor),
    walletBalance(actor),
    monthSpend(actor),
    listShipments(actor, { limit: 5 }),
    recentActivity(actor, 8),
  ]);
  const month = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(new Date());

  const tiles = [
    { label: "Wallet balance", value: formatCents(balance), href: "/app/wallet" },
    { label: `Spent in ${month}`, value: formatCents(spent), href: "/app/transactions" },
    { label: "Shipments", value: String(counts.total), href: "/app/shipments" },
    { label: "Pending", value: String(counts.pending), href: "/app/shipments?status=label_created" },
  ];

  return (
    <>
      <PageHeader
        title="Shipping command center"
        description={`Hello, ${firstName}.${actor.company ? ` ${actor.company}` : ""}`}
        actions={
          <div className="flex flex-col items-end gap-1">
            <Button variant="accent" disabled aria-describedby="create-soon">
              Create label
            </Button>
            <span id="create-soon" className="text-[0.8125rem] text-ink-muted">Label creation arrives in the next release.</span>
          </div>
        }
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 px-5 py-8 sm:px-8 lg:px-10">
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-line bg-line lg:grid-cols-4">
          {tiles.map((t) => (
            <li key={t.label}>
              <Link href={t.href} className="block h-full bg-surface p-5 transition-colors hover:bg-paper">
                <p className="text-[0.875rem] text-ink-muted">{t.label}</p>
                <p className="mt-1 text-[1.75rem] leading-none font-semibold tabular-nums">{t.value}</p>
              </Link>
            </li>
          ))}
        </ul>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <section aria-labelledby="recent-h" className="overflow-hidden rounded-panel border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 id="recent-h" className="font-semibold">Recent shipments</h2>
              {counts.total > 0 ? <Link href="/app/shipments" className="text-[0.875rem] text-nova hover:underline">View all</Link> : null}
            </div>
            {recent.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="font-medium">No shipments yet.</p>
                <p className="mx-auto mt-1 max-w-[26rem] text-[0.9375rem] text-ink-muted">
                  Your shipments will appear here with their status and cost as soon as label creation is live.
                </p>
              </div>
            ) : (
              <ShipmentsList rows={recent} />
            )}
          </section>

          <section aria-labelledby="activity-h" className="rounded-panel border border-line bg-surface">
            <h2 id="activity-h" className="border-b border-line px-6 py-4 font-semibold">Recent activity</h2>
            {activity.length === 0 ? (
              <p className="px-6 py-12 text-center text-[0.9375rem] text-ink-muted">Top-ups, label charges and tracking updates will show up here.</p>
            ) : (
              <ul className="divide-y divide-line">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3 px-6 py-3 text-[0.9375rem]">
                    <div className="min-w-0">
                      <p className="font-medium">{a.kind === "wallet" ? ledgerKindLabel[a.title as keyof typeof ledgerKindLabel] ?? a.title : a.title}</p>
                      <p className="text-[0.8125rem] text-ink-muted">
                        {a.detail ? `${a.detail} · ` : ""}
                        {dateTime.format(a.at)}
                      </p>
                    </div>
                    {a.amountCents !== null ? (
                      <span className={`shrink-0 tabular-nums ${a.amountCents > 0 ? "text-success" : ""}`}>
                        {a.amountCents > 0 ? "+" : "−"}
                        {formatCents(Math.abs(a.amountCents))}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <p className="text-[0.9375rem] text-ink-muted">
          Need to add funds or have a question?{" "}
          <a href={whatsappLink("general")} target="_blank" rel="noopener noreferrer" className="text-nova underline underline-offset-4 hover:text-nova-strong">
            Message support on WhatsApp
          </a>
          .
        </p>
      </div>
    </>
  );
}
