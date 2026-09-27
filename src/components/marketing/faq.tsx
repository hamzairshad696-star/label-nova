import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";

export const faqs = [
  {
    q: "What printers does Label Nova work with?",
    a: "Any printer that can print a PDF. Thermal printers like Zebra, Rollo and DYMO work best for 4×6 labels; laser and inkjet printers work with sheet layouts.",
  },
  {
    q: "Can I use my own logo and layout?",
    a: "Yes. On Growth and Scale you can add your logo and build custom layouts in the designer, on top of templates your admin has approved.",
  },
  {
    q: "What happens to rows with errors in a bulk upload?",
    a: "They're skipped and never charged. You see each error by row and field, can download just the failed rows as a CSV, fix them and upload them again.",
  },
  {
    q: "Are these labels valid postage for carriers?",
    a: "Label Nova creates the label document. Carrier postage must be purchased from the carrier or an authorised partner; carrier integrations fill the tracking number and barcode from the carrier's response so labels scan correctly in their network.",
  },
  {
    q: "How does the wallet work?",
    a: "You add funds, and each generated label is deducted at your plan's price. Bulk jobs reserve the estimated amount first and release anything unused when the job finishes.",
  },
  {
    q: "Can I resell Label Nova to my own clients?",
    a: "Yes. Dealer and reseller accounts on the Scale plan can create client accounts, set their own prices and manage each client's wallet.",
  },
];

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="border-t border-line bg-surface py-24 lg:py-32">
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <SectionHeader
          id="faq-title"
          title="Questions, answered."
          intro={
            <>
              Something else on your mind?{" "}
              <a href="mailto:hello@labelnova.com" className="text-nova underline-offset-4 hover:underline">
                Email the team
              </a>
              .
            </>
          }
        />
        <div className="divide-y divide-line border-y border-line">
          {faqs.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[1.0625rem] font-medium [&::-webkit-details-marker]:hidden">
                {f.q}
                <svg
                  viewBox="0 0 20 20"
                  className="size-5 shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-45"
                  aria-hidden="true"
                >
                  <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </summary>
              <p className="max-w-[60ch] pb-6 text-[0.9375rem] text-ink-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
