import { Automation } from "@/components/marketing/automation";
import { BulkGeneration } from "@/components/marketing/bulk-generation";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { Faq, faqs } from "@/components/marketing/faq";
import { Features } from "@/components/marketing/features";
import { FinalCta } from "@/components/marketing/final-cta";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { LabelStudio } from "@/components/marketing/label-studio";
import { Pricing } from "@/components/marketing/pricing";
import { Security } from "@/components/marketing/security";
import { TemplatesShowcase } from "@/components/marketing/templates-showcase";
import { siteConfig } from "@/config/site";

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: siteConfig.description,
    url: siteConfig.url,
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <LabelStudio />
      <Features />
      <HowItWorks />
      <TemplatesShowcase />
      <BulkGeneration />
      <DashboardPreview />
      <Automation />
      <Security />
      <Pricing />
      <Faq />
      <FinalCta />
      <script
        type="application/ld+json"
        // Static, server-authored JSON only — never interpolate user input here.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
