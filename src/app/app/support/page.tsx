import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/shell";
import { WhatsAppTopics } from "@/components/marketing/page-parts";
import { SUPPORT_WHATSAPP_DISPLAY } from "@/config/support";

export const metadata: Metadata = { title: "Support", robots: { index: false } };

export default function SupportPage() {
  return (
    <>
      <PageHeader title="Support" description={`Reach the Label Nova team on WhatsApp at ${SUPPORT_WHATSAPP_DISPLAY}.`} />
      <div className="max-w-[860px] px-5 py-8 sm:px-8 lg:px-10">
        <WhatsAppTopics topics={["technical", "pricing", "general"]} />
        <p className="mt-6 text-[0.9375rem] text-ink-muted">
          Common questions are answered in the{" "}
          <Link href="/resources" className="text-nova underline underline-offset-4">FAQ</Link>.
        </p>
      </div>
    </>
  );
}
