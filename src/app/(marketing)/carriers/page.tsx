import type { Metadata } from "next";
import { CtaBand, PageIntro, Section } from "@/components/marketing/page-parts";
import { StatusTag } from "@/components/marketing/status-tag";
import { capabilities } from "@/config/capabilities";

export const metadata: Metadata = { title: "Carriers", description: "How Label Nova works with USPS, UPS and FedEx." };

const carriers = [
  { name: "USPS", services: "Ground Advantage, Priority Mail, Priority Mail Express" },
  { name: "UPS", services: "Ground, 3 Day Select, 2nd Day Air, Next Day Air" },
  { name: "FedEx", services: "Ground, Home Delivery, Express Saver, 2Day" },
];

export default function CarriersPage() {
  return (
    <>
      <PageIntro title="Real postage, bought the right way." status={capabilities.carriers.status}>
        A carrier only accepts a label it sold. Label Nova will buy postage through an authorised carrier partner, so
        every barcode matches the carrier&rsquo;s own records.
      </PageIntro>
      <Section title="Planned carriers" intro="Services are listed as planned. Availability depends on the carrier partner and your account.">
        <ul className="grid border-t border-line">
          {carriers.map((c) => (
            <li key={c.name} className="grid gap-2 border-b border-line py-6 sm:grid-cols-[10rem_1fr_auto] sm:items-center sm:gap-8">
              <h3 className="text-h3 font-semibold">{c.name}</h3>
              <p className="text-ink-muted">{c.services}</p>
              <StatusTag status="partner" />
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Why we don't print our own postage" tone="surface">
        <div className="grid gap-10 md:grid-cols-3">
          {[
            ["Carriers check every barcode", "A tracking number that the carrier didn't issue is rejected in their network, and the parcel is returned or held."],
            ["It protects your account", "Self-made carrier labels can be treated as postage fraud. Buying through a partner keeps you on the right side of that line."],
            ["Tracking just works", "Because the carrier issued the label, their scan events flow back into your tracking timeline automatically."],
          ].map(([t, d]) => (
            <div key={t}>
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-2 text-ink-muted">{d}</p>
            </div>
          ))}
        </div>
      </Section>
      <CtaBand title="Ask which carriers fit your volume." topic="pricing" />
    </>
  );
}
