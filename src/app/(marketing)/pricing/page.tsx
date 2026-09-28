import type { Metadata } from "next";
import { CtaBand, PageIntro, Section } from "@/components/marketing/page-parts";
import { StatusTag } from "@/components/marketing/status-tag";
import { capabilities } from "@/config/capabilities";

export const metadata: Metadata = { title: "Pricing", description: "How Label Nova pricing works for customers, dealers and resellers." };

export default function PricingPage() {
  return (
    <>
      <PageIntro title="Your price, set for your account.">
        Shipping costs depend on carrier, service, weight and destination, so Label Nova doesn&rsquo;t publish one rate
        card. Your prices are agreed when your account is created.
      </PageIntro>
      <Section title="How pricing works">
        <div className="grid gap-10 md:grid-cols-3">
          {[
            ["Priced per shipment", "Each label is priced by carrier, service, weight range and zone. You see the price before you buy."],
            ["Tiers for partners", "Customers, dealers and resellers each have their own rate, so partners keep a margin on what they sell."],
            ["Prepaid wallet", "Top up your balance and each shipment is deducted as a ledger entry you can audit line by line."],
          ].map(([t, d]) => (
            <div key={t} className="border-t border-line pt-5">
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-2 text-ink-muted">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 flex flex-wrap items-center gap-3 text-[0.9375rem] text-ink-muted">
          <StatusTag status={capabilities.pricing.status} /> The pricing engine and wallet are being built. No charges are
          taken until they are live.
        </p>
      </Section>
      <CtaBand title="Ask for a quote on your volume." topic="pricing" />
    </>
  );
}
