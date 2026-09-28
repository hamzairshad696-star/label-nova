import type { Metadata } from "next";
import { CapabilityList, CtaBand, PageIntro, Section } from "@/components/marketing/page-parts";

export const metadata: Metadata = { title: "Platform", description: "Everything Label Nova does, and the real status of each part." };

export default function PlatformPage() {
  return (
    <>
      <PageIntro title="One platform, from order to doorstep.">
        Shipping, accounts, money and integrations share one database and one set of permissions. Every feature below
        shows its real status.
      </PageIntro>
      <Section title="Ship" intro="Everything that moves a parcel.">
        <CapabilityList keys={["orders", "rates", "labels", "carriers", "bulk", "tracking"]} />
      </Section>
      <Section title="Run the business" intro="Accounts, permissions and money, controlled by the admin." tone="surface">
        <CapabilityList keys={["accounts", "audit", "pricing", "wallet"]} />
      </Section>
      <Section title="Connect" intro="For teams that want Label Nova inside their own systems.">
        <CapabilityList keys={["api", "askNova"]} />
      </Section>
      <CtaBand title="See it with your own shipments." />
    </>
  );
}
