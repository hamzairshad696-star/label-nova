import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { LogoMark } from "@/components/brand/logo";

const nav = ["Dashboard", "Create label", "Templates", "Bulk upload", "Orders", "Labels", "Customers", "Wallet", "Analytics", "API"];

const stats = [
  { label: "Labels this month", value: "4,812", change: "+18%" },
  { label: "Orders", value: "1,236", change: "+9%" },
  { label: "Printed successfully", value: "99.6%", change: "+0.2 pt" },
  { label: "Wallet balance", value: "$1,284.50", change: "Auto top-up on" },
];

// Labels generated per week, last 12 weeks.
const weekly = [620, 710, 680, 790, 840, 760, 910, 980, 1040, 990, 1130, 1210];

const activity: { id: string; what: string; when: string; status: string; tone: BadgeTone }[] = [
  { id: "LN-26-004812", what: "Bulk upload, 998 labels", when: "2 min ago", status: "Completed", tone: "success" },
  { id: "LN-26-004811", what: "Premium Shipping, 1 label", when: "14 min ago", status: "Completed", tone: "success" },
  { id: "LN-26-004810", what: "Returns 4×4, 24 labels", when: "1 hr ago", status: "Processing", tone: "info" },
  { id: "LN-26-004809", what: "Wallet top-up", when: "3 hr ago", status: "+$500.00", tone: "neutral" },
];

export function DashboardPreview() {
  const max = Math.max(...weekly);
  return (
    <section aria-labelledby="dash-title" className="overflow-hidden border-t border-line bg-ink py-24 text-white lg:py-32">
      <Container>
        <SectionHeader
          id="dash-title"
          title="A dashboard that answers the first question."
          intro={<span className="text-white/65">How many labels went out, what failed, and how much is left in the wallet — before you click anything.</span>}
        />

        <figure className="mt-14 overflow-hidden rounded-panel bg-paper text-ink shadow-[0_40px_120px_-30px_rgb(0_0_0/0.6)] ring-1 ring-white/10">
          <figcaption className="sr-only">
            Preview of the Label Nova dashboard showing monthly label totals, a weekly chart and recent activity
          </figcaption>
          <div aria-hidden="true" className="grid md:grid-cols-[200px_1fr]">
            <aside className="hidden border-r border-line bg-surface p-4 md:block">
              <div className="flex items-center gap-2 px-2 pb-5">
                <LogoMark className="size-6" />
                <span className="text-[0.875rem] font-semibold">Label Nova</span>
              </div>
              <ul className="grid gap-0.5 text-[0.8125rem]">
                {nav.map((n, i) => (
                  <li
                    key={n}
                    className={`rounded-control px-2.5 py-1.5 ${i === 0 ? "bg-nova-soft font-medium text-nova-strong" : "text-ink-muted"}`}
                  >
                    {n}
                  </li>
                ))}
              </ul>
            </aside>

            <div className="min-w-0 p-5 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <p className="text-lg font-semibold tracking-[-0.01em]">Good morning, Amara</p>
                <span className="hidden rounded-control border border-line-strong bg-surface px-3 py-1.5 text-[0.8125rem] text-ink-faint sm:block">
                  Search orders, labels, tracking…
                </span>
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-menu border border-line bg-surface p-4">
                    <dt className="text-[0.75rem] text-ink-muted">{s.label}</dt>
                    <dd className="mt-1.5 text-xl font-semibold tracking-[-0.02em] sm:text-2xl">{s.value}</dd>
                    <dd className="mt-1 text-[0.75rem] text-success">{s.change}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-3 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
                <div className="rounded-menu border border-line bg-surface p-4">
                  <p className="text-[0.8125rem] font-medium">Labels generated, last 12 weeks</p>
                  <svg viewBox="0 0 240 100" className="mt-4 h-36 w-full" preserveAspectRatio="none">
                    {[25, 50, 75].map((y) => (
                      <line key={y} x1="0" x2="240" y1={y} y2={y} stroke="var(--line)" strokeWidth="0.5" />
                    ))}
                    {weekly.map((v, i) => {
                      const h = (v / max) * 92;
                      return (
                        <rect
                          key={i}
                          x={i * 20 + 4}
                          y={100 - h}
                          width="12"
                          height={h}
                          rx="1.5"
                          fill={i === weekly.length - 1 ? "var(--nova)" : "var(--line-strong)"}
                        />
                      );
                    })}
                  </svg>
                </div>
                <div className="rounded-menu border border-line bg-surface">
                  <p className="px-4 pt-4 text-[0.8125rem] font-medium">Recent activity</p>
                  <ul className="mt-2 divide-y divide-line">
                    {activity.map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-[0.8125rem] font-medium">{a.what}</p>
                          <p className="text-[0.75rem] text-ink-faint">
                            {a.id}, {a.when}
                          </p>
                        </div>
                        <Badge tone={a.tone}>{a.status}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </figure>
      </Container>
    </section>
  );
}
