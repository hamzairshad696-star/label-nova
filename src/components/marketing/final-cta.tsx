import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { whatsappLink } from "@/config/support";

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="py-24 lg:py-32">
      <Container className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
        <h2 id="cta-title" className="max-w-[16ch] text-h2 font-semibold text-balance">
          Ready when your first parcel is.
        </h2>
        <div>
          <p className="max-w-[30rem] text-lead text-ink-muted">
            Accounts are set up by our team, so your role, prices and limits are right from day one.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/request-access" size="lg" variant="accent">
              Request access
            </ButtonLink>
            <ButtonLink href={whatsappLink("general")} target="_blank" rel="noopener noreferrer" size="lg" variant="secondary">
              Chat on WhatsApp
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
