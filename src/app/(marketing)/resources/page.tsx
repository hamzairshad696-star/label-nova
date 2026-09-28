import type { Metadata } from "next";
import { FaqList, faqs } from "@/components/marketing/faq";
import { CtaBand, PageIntro, Section } from "@/components/marketing/page-parts";

export const metadata: Metadata = { title: "Resources and FAQ", description: "Answers to common questions about Label Nova." };

const structuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function ResourcesPage() {
  return (
    <>
      <PageIntro title="Questions, answered.">Straight answers about accounts, carriers, pricing and what is live today.</PageIntro>
      <Section id="faq">
        <div className="max-w-[48rem]">
          <FaqList />
        </div>
      </Section>
      <CtaBand title="Still have a question?" topic="general" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
