import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { RouteVisual } from "./route/route-visual";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-midnight text-midnight-ink">
      <Container className="pt-16 pb-10 md:pt-24 lg:pt-28">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-end lg:gap-16">
          <h1 id="hero-title" className="text-display font-semibold text-balance text-white">
            Shipping, reimagined.
          </h1>
          <div className="lg:pb-3">
            <p className="max-w-[30rem] text-lead text-midnight-muted text-pretty">
              Label Nova connects every step between an order and a doorstep, so your team, your partners and your
              customers work from the same record.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/request-access" size="lg" variant="accent">
                Get started
              </ButtonLink>
              <ButtonLink href="/how-it-works" size="lg" variant="outlineDark">
                See how it works
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
      <Container className="pt-8 pb-16 md:pt-14 md:pb-24">
        <RouteVisual />
      </Container>
    </section>
  );
}
