import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Icons } from "@/components/ui/icons";

const features = [
  {
    icon: Icons.layers,
    title: "Templates with guardrails",
    body: "Admins decide which fields are editable and which are fixed, so nobody drags the barcode off the page by accident.",
  },
  {
    icon: Icons.table,
    title: "Bulk from CSV or Excel",
    body: "Map your columns once, see every problem row before you pay, and download one merged PDF.",
  },
  {
    icon: Icons.file,
    title: "True vector PDFs",
    body: "Text stays text and barcodes stay sharp at 203, 300 or 600 dpi. No screenshots, no blur.",
  },
  {
    icon: Icons.box,
    title: "Orders and label history",
    body: "Every label is tied to an order. Search by tracking number, re-download, or cancel in a click.",
  },
  {
    icon: Icons.wallet,
    title: "Prepaid wallet",
    body: "Top up once and generate as you go. Every debit, refund and credit is itemised.",
  },
  {
    icon: Icons.users,
    title: "Built for resellers",
    body: "Dealers and resellers manage their own clients, set their own margins and see their own numbers.",
  },
];

export function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="py-24 lg:py-32">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <SectionHeader
            id="features-title"
            title="Everything between the order and the printer."
            intro="Label Nova replaces the spreadsheet, the design tool and the PDF script with one place your whole team can use."
            className="lg:sticky lg:top-28 lg:self-start"
          />
          <ul className="grid gap-x-10 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, body }) => (
              <li key={title} className="border-t border-line py-7">
                <Icon className="text-nova" />
                <h3 className="mt-4 text-[1.0625rem] font-semibold tracking-[-0.01em]">{title}</h3>
                <p className="mt-2 text-[0.9375rem] text-ink-muted">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
