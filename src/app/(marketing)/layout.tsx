import { BrandIntro } from "@/components/brand/intro";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { WhatsAppButton } from "@/components/support/whatsapp-button";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BrandIntro />
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <WhatsAppButton />
    </>
  );
}
