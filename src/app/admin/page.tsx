import type { Metadata } from "next";
import Link from "next/link";
import { Forbidden } from "@/components/app/forbidden";
import { PageHeader } from "@/components/app/shell";
import { ButtonLink } from "@/components/ui/button";
import { requireActor } from "@/server/auth/session";
import { accountCounts } from "@/server/services/accounts";
import { listRecentAudit } from "@/server/services/audit";

export const metadata: Metadata = { title: "Control center", robots: { index: false } };

const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

const actionLabel: Record<string, string> = {
  "user.signed_in": "Signed in",
  "user.created": "Account created",
  "user.disabled": "Account disabled",
  "user.enabled": "Account enabled",
  "user.role_changed": "Role changed",
  "user.password_reset": "Password reset",
  "user.password_set_by_admin": "Password set by admin",
  "user.registered": "Registered",
};

export default async function AdminOverviewPage() {
  const actor = await requireActor("/admin");
  if (actor.role.key !== "ADMIN") return <Forbidden />;
  const [counts, audit] = await Promise.all([accountCounts(actor), listRecentAudit(actor, 10)]);

  const tiles = [
    { label: "Dealers", value: counts.DEALER, href: "/admin/users?role=DEALER" },
    { label: "Resellers", value: counts.RESELLER, href: "/admin/users?role=RESELLER" },
    { label: "Customers", value: counts.CLIENT, href: "/admin/users?role=CLIENT" },
    { label: "Disabled accounts", value: counts.disabled, href: "/admin/users" },
  ];

  return (
    <>
      <PageHeader
        title="Control center"
        description="Accounts across the platform and what's happened recently."
        actions={<ButtonLink href="/admin/users/new" variant="accent">Create account</ButtonLink>}
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 px-5 py-8 sm:px-8 lg:px-10">
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-line bg-line lg:grid-cols-4">
          {tiles.map((t) => (
            <li key={t.label}>
              <Link href={t.href} className="block h-full bg-surface p-5 transition-colors hover:bg-paper">
                <p className="text-[0.875rem] text-ink-muted">{t.label}</p>
                <p className="mt-1 text-[2rem] leading-none font-semibold tabular-nums">{t.value}</p>
              </Link>
            </li>
          ))}
        </ul>

        <section aria-labelledby="activity-title" className="rounded-panel border border-line bg-surface">
          <h2 id="activity-title" className="border-b border-line px-6 py-4 font-semibold">
            Recent activity
          </h2>
          {audit.length === 0 ? (
            <p className="px-6 py-10 text-center text-ink-muted">Nothing has happened yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {audit.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 text-[0.9375rem]">
                  <span>
                    {actionLabel[a.action] ?? a.action}
                    <span className="text-ink-muted"> · {a.actorName ?? "System"}</span>
                  </span>
                  <time className="text-[0.875rem] text-ink-muted" dateTime={a.createdAt.toISOString()}>
                    {date.format(a.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
