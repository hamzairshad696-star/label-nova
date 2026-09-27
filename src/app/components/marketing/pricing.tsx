import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Icons } from "@/components/ui/icons";
import { formatCents, plans } from "@/config/plans";
import { cn } from "@/lib/cn";

export function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="border-t border-line py-24 lg:py-32">
      <Container>
        <SectionHeader
          id="pricing-title"
          title="Pay per label. Nothing hidden."
          intro="Top up your wallet and each label is deducted as it's generated. Failed and cancelled labels are refunded automatically."
          align="center"
        />
        <ul className="mt-14 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <li
              key={plan.id}
              className={cn(
                "flex flex-col rounded-panel border p-7",
                plan.recommended ? "border-ink bg-ink text-white" : "border-line bg-surface",
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-h3 font-semibold">{plan.name}</h3>
                {plan.recommended ? (
                  <span className="rounded-full bg-white/12 px-2.5 py-0.5 text-[0.75rem] font-medium">Most teams pick this</span>
                ) : null}
              </div>
              <p className={cn("mt-2 text-[0.9375rem]", plan.recommended ? "text-white/65" : "text-ink-muted")}>{plan.summary}</p>

              <p className="mt-8 flex items-baseline gap-1.5">
                {plan.perLabelCents !== null ? (
                  <>
                    <span className="text-[2.5rem] leading-none font-semibold tracking-[-0.03em]">
                      {formatCents(plan.perLabelCents)}
                    </span>
                    <span className={plan.recommended ? "text-white/65" : "text-ink-muted"}>per label</span>
                  </>
                ) : (
                  <span className="text-[2.5rem] leading-none font-semibold tracking-[-0.03em]">Custom</span>
                )}
              </p>
              <p className={cn("mt-2 text-[0.875rem]", plan.recommended ? "text-white/65" : "text-ink-muted")}>
                {plan.perLabelCents === null
                  ? "Volume pricing with per-client margins"
                  : plan.monthlyCents > 0
                    ? `plus ${formatCents(plan.monthlyCents)} per month`
                    : "No monthly fee"}
              </p>

              <ul className="mt-8 grid gap-3 text-[0.9375rem]">
                {plan.includes.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <Icons.check className={cn("mt-0.5 shrink-0", plan.recommended ? "text-[#a8a2ff]" : "text-nova")} />
                    {item}
                  </li>
                ))}
              </ul>

              <ButtonLink
                href={plan.cta.href}
                variant={plan.recommended ? "accent" : "secondary"}
                size="lg"
                className="mt-10"
              >
                {plan.cta.label}
              </ButtonLink>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
