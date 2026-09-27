import type { Metadata } from "next";
import { Forbidden } from "@/components/app/forbidden";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { requireActor } from "@/server/auth/session";
import { listRecentAudit } from "@/server/services/audit";
import { listUsers } from "@/server/services/users";

export const metadata: Metadata = { title: "Admin console", robots: { index: false } };

const roleTone: Record<string, BadgeTone> = { ADMIN: "accent", DEALER: "info", RESELLER: "warning", CLIENT: "neutral" };
const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export default async function AdminPage() {
  const actor = await requireActor("/admin");
  // Enforced again here and inside each service — the layout check is not relied on.
  if (actor.role.key !== "ADMIN") return <Forbidden />;
  const [people, audit] = await Promise.all([listUsers(actor, { limit: 100 }), listRecentAudit(actor, 12)]);

  return (
    <main id="main" className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8 lg:py-14">
      <h1 className="text-h2 font-semibold">Admin console</h1>
      <p className="mt-2 text-lead text-ink-muted">Every account on the platform and recent security events.</p>

      <section aria-labelledby="users-title" className="mt-10 overflow-hidden rounded-panel border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 id="users-title" className="text-[1rem] font-semibold">Users</h2>
          <span className="text-[0.875rem] text-ink-muted">{people.length} total</span>
        </div>
        {people.length === 0 ? (
          <p className="px-6 py-10 text-center text-ink-muted">No users yet. New sign-ups appear here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[0.875rem]">
              <thead className="bg-paper text-ink-muted">
                <tr>
                  {["Name", "Email", "Role", "Status", "Joined", "Last login"].map((h) => (
                    <th key={h} scope="col" className="px-6 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {people.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-3.5">
                      <p className="font-medium">{u.name}</p>
                      {u.company ? <p className="text-[0.8125rem] text-ink-muted">{u.company}</p> : null}
                    </td>
                    <td className="px-6 py-3.5 text-ink-muted">{u.email}</td>
                    <td className="px-6 py-3.5"><Badge tone={roleTone[u.role] ?? "neutral"}>{u.role}</Badge></td>
                    <td className="px-6 py-3.5">
                      <Badge tone={u.status === "active" ? "success" : u.status === "disabled" ? "danger" : "warning"}>{u.status}</Badge>
                    </td>
                    <td className="px-6 py-3.5 text-ink-muted">{date.format(u.createdAt)}</td>
                    <td className="px-6 py-3.5 text-ink-muted">{u.lastLoginAt ? date.format(u.lastLoginAt) : "Never"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="audit-title" className="mt-4 rounded-panel border border-line bg-surface">
        <h2 id="audit-title" className="border-b border-line px-6 py-5 text-[1rem] font-semibold">Recent activity</h2>
        {audit.length === 0 ? (
          <p className="px-6 py-10 text-center text-ink-muted">No events recorded yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {audit.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 text-[0.875rem]">
                <span>
                  <span className="font-mono text-[0.8125rem]">{a.action}</span>
                  <span className="text-ink-muted"> by {a.actorName ?? "system"}</span>
                </span>
                <time className="text-ink-muted" dateTime={a.createdAt.toISOString()}>{date.format(a.createdAt)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
