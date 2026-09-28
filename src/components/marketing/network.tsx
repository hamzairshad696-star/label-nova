import { Container } from "@/components/ui/container";
import { capabilities } from "@/config/capabilities";
import { cn } from "@/lib/cn";
import { StatusTag } from "./status-tag";

function Node({ role, note, strong }: { role: string; note: string; strong?: boolean }) {
  return (
    <div className={cn("rounded-menu border px-4 py-3 text-center", strong ? "border-nova bg-nova text-white" : "border-line-strong bg-surface")}>
      <p className="font-semibold">{role}</p>
      <p className={cn("text-[0.8125rem]", strong ? "text-[#e6e4fd]" : "text-ink-muted")}>{note}</p>
    </div>
  );
}

export function Network() {
  return (
    <section aria-labelledby="network-title" className="border-y border-line bg-surface py-24 lg:py-32">
      <Container className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <StatusTag status={capabilities.accounts.status} />
          <h2 id="network-title" className="mt-5 text-h2 font-semibold text-balance">
            Built for shipping networks, not just shippers.
          </h2>
          <p className="mt-4 max-w-[30rem] text-lead text-ink-muted">
            Dealers and resellers run their own customers inside Label Nova. Each account sees its own shipments, prices and
            people, and nothing above it.
          </p>
          <dl className="mt-10 grid gap-6 sm:grid-cols-2">
            {[
              ["Admin-issued accounts", "Nobody can sign themselves up or pick their own role. Every account is created by an admin."],
              ["Enforced on the server", "Permissions are checked in the service layer on every request, not just hidden in the interface."],
              ["Changes apply instantly", "Disable an account or change a permission and it takes effect on the next request."],
              ["Every change recorded", "Sign-ins, role changes and password resets land in an activity log."],
            ].map(([t, d]) => (
              <div key={t}>
                <dt className="font-semibold">{t}</dt>
                <dd className="mt-1 text-[0.9375rem] text-ink-muted">{d}</dd>
              </div>
            ))}
          </dl>
        </div>

        <figure aria-label="Account hierarchy: admin above dealers and resellers, each with their own customers" className="rounded-panel border border-line bg-paper p-6 sm:p-10">
          <div className="mx-auto max-w-[220px]">
            <Node role="Admin" note="Controls everything" strong />
          </div>
          <div aria-hidden="true" className="mx-auto h-6 w-px bg-line-strong" />
          <div aria-hidden="true" className="mx-auto h-px w-1/2 bg-line-strong" />
          <div className="grid grid-cols-2 gap-4">
            {(
              [
                ["Dealer", "Own network"],
                ["Reseller", "Own network"],
              ] as const
            ).map(([r, n]) => (
              <div key={r}>
                <div aria-hidden="true" className="mx-auto h-6 w-px bg-line-strong" />
                <Node role={r} note={n} />
                <div aria-hidden="true" className="mx-auto h-6 w-px bg-line-strong" />
                <div className="grid gap-2">
                  {["Customer", "Customer"].map((c, i) => (
                    <div key={i} className="rounded-control border border-dashed border-line-strong px-3 py-2 text-center text-[0.8125rem] text-ink-muted">
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </figure>
      </Container>
    </section>
  );
}
