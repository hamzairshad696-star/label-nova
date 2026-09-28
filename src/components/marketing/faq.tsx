export const faqs = [
  {
    q: "How do I get an account?",
    a: "Accounts are created by the Label Nova team rather than by public sign-up, so each one starts with the right role, prices and limits. Request access from the website or message us on WhatsApp.",
  },
  {
    q: "Are Label Nova labels valid carrier postage?",
    a: "Carrier postage is only valid when it is bought from the carrier or an authorised partner. Label Nova will buy USPS, UPS and FedEx labels through such a partner, so tracking numbers and barcodes come from the carrier. Until that connection is live, carrier postage is not offered.",
  },
  {
    q: "Can I run my own customers as a dealer or reseller?",
    a: "Yes. Dealer and reseller accounts exist today and are scoped so each partner sees only their own customers. Per-customer pricing and wallet transfers arrive with the pricing engine and wallet.",
  },
  {
    q: "How is pricing set?",
    a: "Prices are set per account by the admin, with separate customer, dealer and reseller rates by carrier, service, weight and zone. Nothing is hard-coded, so a price change applies to the next shipment without a software update.",
  },
  {
    q: "What printers work with Label Nova?",
    a: "Labels are produced as PDFs, so any printer that prints a PDF works. Thermal printers suit 4×6 labels; laser and inkjet printers suit A4 and Letter sheets.",
  },
  {
    q: "What can I use today?",
    a: "The homepage lists every feature with its current status. Features marked In development or Needs carrier partner are not yet live, and we do not charge for anything that is not.",
  },
];

export function FaqList() {
  return (
    <div className="divide-y divide-line border-y border-line">
      {faqs.map((f) => (
        <details key={f.q} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[1.0625rem] font-medium [&::-webkit-details-marker]:hidden">
            {f.q}
            <svg viewBox="0 0 20 20" className="size-5 shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-45" aria-hidden="true">
              <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </summary>
          <p className="max-w-[44rem] pb-6 text-ink-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
