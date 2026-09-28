import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="border-t border-line py-24 lg:py-32">
      <Container className="text-center">
        <h2 id="cta-title" className="mx-auto max-w-[18ch] text-h2 font-semibold text-balance">
          Your next label is thirty seconds away.
        </h2>
        <p className="mx-auto mt-4 max-w-[34rem] text-lead text-ink-muted">
          Accounts are set up by our team so your pricing and access are right from day one.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/request-access" size="lg">
            Request access
          </ButtonLink>
          <ButtonLink href="mailto:sales@labelnova.com" size="lg" variant="secondary">
            Talk to sales
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
