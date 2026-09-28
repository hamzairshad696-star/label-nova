import type { Metadata } from "next";
import { CtaBand, PageIntro, Section } from "@/components/marketing/page-parts";
import { StatusTag } from "@/components/marketing/status-tag";

export const metadata: Metadata = { title: "Solutions", description: "Label Nova for shippers, dealers and resellers." };

const audiences = [
  {
    who: "Shippers",
    title: "Send parcels without juggling tools",
    points: ["Create one label or upload a whole order file", "See your spend and wallet balance in one place", "Track every shipment from a single timeline"],
  },
  {
    who: "Dealers",
    title: "Run a shipping business on your own terms",
    points: ["Create and manage your own customer accounts", "See your network's shipments and activity", "Set customer prices above your dealer rate"],
  },
  {
    who: "Resellers",
    title: "Offer shipping to your clients",
    points: ["Onboard clients under your account", "Keep each client's data separate", "Earn the margin between your rate and theirs"],
  },
];

export default function SolutionsPage() {
  return (
    <>
      <PageIntro title="One platform, three kinds of business.">
        Label Nova is built for companies that ship, and for the partners who sell shipping to others.
      </PageIntro>
      <Section>
        <div className="grid gap-px overflow-hidden rounded-panel border border-line bg-line lg:grid-cols-3">
          {audiences.map((a) => (
            <article key={a.who} className="bg-surface p-7 sm:p-9">
              <p className="text-[0.875rem] font-medium text-nova">{a.who}</p>
              <h2 className="mt-2 text-h3 font-semibold">{a.title}</h2>
              <ul className="mt-6 grid gap-3 text-ink-muted">
                {a.points.map((p) => (
                  <li key={p} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-nova" />
                    {p}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="mt-8 flex flex-wrap items-center gap-3 text-[0.9375rem] text-ink-muted">
          <StatusTag status="available" /> Dealer, reseller and customer accounts with network scoping are live.
          <StatusTag status="available" /> Dealer and reseller price tiers are live. <StatusTag status="building" /> Setting your own customers&rsquo; prices and moving funds to them come next.
        </p>
      </Section>
      <CtaBand title="Talk to us about a partner account." topic="partner" />
    </>
  );
}
