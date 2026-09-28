import type { Metadata } from "next";
import Link from "next/link";
import { Forbidden } from "@/components/app/forbidden";
import { RoleBadge, StatusBadge } from "@/components/app/role-badge";
import { PageHeader } from "@/components/app/shell";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { ROLE_KEYS } from "@/server/auth/catalog";
import { requireActor } from "@/server/auth/session";
import { listUsers } from "@/server/services/users";

export const metadata: Metadata = { title: "Users", robots: { index: false } };

const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const filters = [
  { label: "All", role: undefined },
  { label: "Dealers", role: "DEALER" },
  { label: "Resellers", role: "RESELLER" },
  { label: "Customers", role: "CLIENT" },
  { label: "Admins", role: "ADMIN" },
] as const;

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const actor = await requireActor("/admin/users");
  if (actor.role.key !== "ADMIN") return <Forbidden />;
  const { role: rawRole } = await searchParams;
  const role = ROLE_KEYS.find((r) => r === rawRole);
  const people = await listUsers(actor, { limit: 500, role });

  return (
    <>
      <PageHeader
        title="Users"
        description="Every account on the platform. Only admins create accounts."
        actions={<ButtonLink href="/admin/users/new" variant="accent">Create account</ButtonLink>}
      />
      <div className="px-5 py-8 sm:px-8 lg:px-10">
        <nav aria-label="Filter by role" className="mb-5 flex flex-wrap gap-2">
          {filters.map((f) => {
            const on = f.role === role;
            return (
              <Link
                key={f.label}
                href={f.role ? `/admin/users?role=${f.role}` : "/admin/users"}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-[0.875rem]",
                  on ? "border-ink bg-ink text-white" : "border-line-strong bg-surface text-ink-muted hover:text-ink",
                )}
              >
                {f.label}
              </Link>
            );
          })}
        </nav>

        <div className="overflow-hidden rounded-panel border border-line bg-surface">
          {people.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="font-medium">No accounts match this filter.</p>
              <p className="mt-1 text-ink-muted">Create one to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-[0.9375rem]">
                <thead className="bg-paper text-[0.8125rem] text-ink-muted">
                  <tr>
                    {["Name", "Role", "Belongs to", "Status", "Created", "Last sign-in"].map((h) => (
                      <th key={h} scope="col" className="px-5 py-3 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {people.map((u) => (
                    <tr key={u.id} className="hover:bg-paper/60">
                      <td className="px-5 py-3.5">
                        <Link href={`/admin/users/${u.id}`} className="font-medium hover:text-nova">
                          {u.name}
                        </Link>
                        <p className="text-[0.8125rem] text-ink-muted">{u.email}</p>
                      </td>
                      <td className="px-5 py-3.5"><RoleBadge role={u.role} /></td>
                      <td className="px-5 py-3.5 text-ink-muted">{u.parentName ?? "—"}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={u.status} /></td>
                      <td className="px-5 py-3.5 text-ink-muted">{date.format(u.createdAt)}</td>
                      <td className="px-5 py-3.5 text-ink-muted">{u.lastLoginAt ? date.format(u.lastLoginAt) : "Never"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
