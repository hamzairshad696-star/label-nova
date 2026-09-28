import type { Metadata } from "next";
import { PageIntro, Section, WhatsAppTopics } from "@/components/marketing/page-parts";
import { SUPPORT_WHATSAPP_DISPLAY } from "@/config/support";

export const metadata: Metadata = { title: "Contact", description: "Reach the Label Nova team on WhatsApp." };

export default function ContactPage() {
  return (
    <>
      <PageIntro title="Talk to the team.">
        The fastest way to reach us is WhatsApp at {SUPPORT_WHATSAPP_DISPLAY}. Pick a topic and your message is started
        for you.
      </PageIntro>
      <Section>
        <div className="max-w-[48rem]">
          <WhatsAppTopics />
        </div>
      </Section>
    </>
  );
}
