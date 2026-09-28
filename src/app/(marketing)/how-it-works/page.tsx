import type { Metadata } from "next";
import { Journey } from "@/components/marketing/journey";
import { CtaBand, PageIntro, Section, Steps } from "@/components/marketing/page-parts";

export const metadata: Metadata = { title: "How it works", description: "From requesting access to your first delivered parcel." };

export default function HowItWorksPage() {
  return (
    <>
      <PageIntro title="From first message to first delivery.">
        Getting started takes a conversation, not a sign-up form. Here is what happens.
      </PageIntro>
      <Section title="Getting set up">
        <Steps
          steps={[
            { title: "Request access", body: "Tell us what you ship and how, from the website or on WhatsApp." },
            { title: "We create your account", body: "The admin sets your role, prices, limits and wallet before you sign in." },
            { title: "Sign in", body: "Land on the dashboard built for your role: customer, dealer or reseller." },
            { title: "Ship", body: "Create labels one at a time or in bulk, then follow each parcel to the door." },
          ]}
        />
      </Section>
      <Journey />
      <CtaBand title="Start the conversation." />
    </>
  );
}
