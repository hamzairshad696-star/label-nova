import type { Metadata } from "next";
import { StatusBadge } from "@/components/app/role-badge";
import { PageHeader } from "@/components/app/shell";
import { StatusTag } from "@/components/marketing/status-tag";
import { ButtonLink } from "@/components/ui/button";
import { capabilities, type CapabilityKey } from "@/config/capabilities";
import { whatsappLink } from "@/config/support";
import { ROLE_LABEL } from "@/server/auth/catalog";
import { requireActor } from "@/server/auth/session";
import { listUsers } from "@/server/services/users";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

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
        <div className="grid gap-6 px-5 py-8 sm:px-8 lg:px-10">
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

  return (
    <>
      <PageHeader
        title={role === "ADMIN" ? "Workspace" : "Shipping command center"}
        description={`Hello, ${firstName}.${actor.company ? ` ${actor.company}` : ""}`}
        actions={role === "ADMIN" ? <ButtonLink href="/admin" variant="accent">Open control center</ButtonLink> : undefined}
      />
      <div className="grid gap-6 px-5 py-8 sm:px-8 lg:px-10">
        <Upcoming keys={["labels", "bulk", "orders", "tracking", "wallet"]} />
        <p className="text-[0.9375rem] text-ink-muted">
          Questions about your account?{" "}
          <a href={whatsappLink("general")} target="_blank" rel="noopener noreferrer" className="text-nova underline underline-offset-4 hover:text-nova-strong">
            Message support on WhatsApp
          </a>
          .
        </p>
      </div>
    </>
  );
}
