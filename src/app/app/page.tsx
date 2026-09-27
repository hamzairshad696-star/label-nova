import type { Metadata } from "next";
import { Icons } from "@/components/ui/icons";
import { requireActor } from "@/server/auth/session";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

const upcoming = [
  { icon: Icons.file, title: "Create a label", body: "Pick a template, fill in the fields and download a print-ready PDF." },
  { icon: Icons.table, title: "Bulk upload", body: "Upload a CSV or Excel file and generate thousands of labels at once." },
  { icon: Icons.box, title: "Orders", body: "Every label you generate is tracked as an order you can search and reprint." },
  { icon: Icons.wallet, title: "Wallet", body: "Top up once; each label is deducted as it's generated." },
];

export default async function DashboardPage() {
  // Checked again here — layouts are not a security boundary.
  const actor = await requireActor("/app");
  const firstName = actor.name.trim().split(/\s+/)[0] || actor.name;

  return (
    <main id="main" className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8 lg:py-14">
      <h1 className="text-h2 font-semibold">Welcome, {firstName}.</h1>
      <p className="mt-2 text-lead text-ink-muted">
        You're signed in as {actor.role.name.toLowerCase()}
        {actor.company ? ` at ${actor.company}` : ""}. Your workspace is ready.
      </p>

      <section aria-labelledby="next-title" className="mt-10">
        <h2 id="next-title" className="text-[1rem] font-semibold">
          Coming to your workspace
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {upcoming.map(({ icon: Icon, title, body }) => (
            <li key={title} className="rounded-panel border border-line bg-surface p-6">
              <span className="flex size-10 items-center justify-center rounded-menu bg-nova-soft text-nova">
                <Icon />
              </span>
              <h3 className="mt-5 font-semibold">{title}</h3>
              <p className="mt-1.5 text-[0.9375rem] text-ink-muted">{body}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
