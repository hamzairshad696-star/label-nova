import type { Metadata } from "next";
import { CtaBand, PageIntro, Section } from "@/components/marketing/page-parts";

export const metadata: Metadata = { title: "About", description: "What Label Nova is and how we build it." };

export default function AboutPage() {
  return (
    <>
      <PageIntro title="Shipping software that tells the truth.">
        Label Nova is a shipping platform for merchants and for the dealers and resellers who serve them. We build it on
        three rules.
      </PageIntro>
      <Section>
        <div className="grid gap-10 md:grid-cols-3">
          {[
            ["Real or clearly not yet", "If a feature isn't live, we say so on the page. We don't show made-up rates, balances or tracking."],
            ["Postage done properly", "Carrier labels come from the carrier or an authorised partner, never from a template pretending to be one."],
            ["Accounts under control", "Nobody promotes themselves. Roles, prices and limits are set by an admin and every change is logged."],
          ].map(([t, d]) => (
            <div key={t} className="border-t border-line pt-5">
              <h2 className="text-h3 font-semibold">{t}</h2>
              <p className="mt-2 text-ink-muted">{d}</p>
            </div>
          ))}
        </div>
      </Section>
      <CtaBand title="Work with us." topic="general" />
    </>
  );
}
