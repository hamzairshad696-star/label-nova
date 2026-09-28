import { FinalCta } from "@/components/marketing/final-cta";
import { Hero } from "@/components/marketing/hero";
import { Journey } from "@/components/marketing/journey";
import { LiveStatus } from "@/components/marketing/live-status";
import { Network } from "@/components/marketing/network";
import { siteConfig } from "@/config/site";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: siteConfig.name,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: siteConfig.description,
  url: siteConfig.url,
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Journey />
      <Network />
      <LiveStatus />
      <FinalCta />
      <script
        type="application/ld+json"
        // Static, server-authored JSON only — never interpolate user input here.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
