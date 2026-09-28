import type { Metadata } from "next";
import { CtaBand, PageIntro, Section } from "@/components/marketing/page-parts";
import { capabilities } from "@/config/capabilities";

export const metadata: Metadata = { title: "API", description: "The Label Nova developer platform: API keys, webhooks, sandbox and logs." };

export default function DevelopersPage() {
  return (
    <>
      <PageIntro title="Label Nova, inside your own systems." status={capabilities.api.status}>
        The API will let your store, warehouse or ERP create shipments, fetch labels and receive tracking updates, with
        the same prices and permissions as the dashboard.
      </PageIntro>
      <Section title="What the developer platform includes">
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["API keys", "Create a key per integration. Keys are shown once, stored only as a hash, and can be revoked instantly."],
            ["Webhooks", "Get notified when a label is created, a shipment is scanned or a bulk run finishes."],
            ["Sandbox", "Build and test against a separate environment that never buys real postage or touches your wallet."],
            ["Usage", "See request volume per key, so you know which integration is doing what."],
            ["Logs", "Inspect recent requests and responses when something doesn't behave as expected."],
            ["Documentation", "Reference docs and examples published alongside the first release."],
          ].map(([t, d]) => (
            <div key={t} className="border-t border-line pt-5">
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-2 text-ink-muted">{d}</p>
            </div>
          ))}
        </div>
      </Section>
      <CtaBand title="Want early API access?" topic="technical" />
    </>
  );
}
