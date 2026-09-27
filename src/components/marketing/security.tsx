import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Icons } from "@/components/ui/icons";

const items = [
  { icon: Icons.shield, title: "Permissions checked on the server", body: "Every request is checked against your role. Hiding a button is never the only protection." },
  { icon: Icons.key, title: "API keys you can't leak twice", body: "Keys are shown once, then stored only as a hash. Revoke any key and it stops working immediately." },
  { icon: Icons.lock, title: "Private files", body: "Label PDFs are stored privately and downloaded through short-lived links tied to your account." },
  { icon: Icons.log, title: "A complete audit trail", body: "Price changes, role changes, template edits and revoked keys are logged with who, what and when." },
  { icon: Icons.wallet, title: "A ledger, not a number", body: "Balances are built from an append-only record of every credit and debit, reconciled daily." },
  { icon: Icons.check, title: "Validated inputs", body: "Every field is checked against the template's rules before a label is generated or charged." },
];

export function Security() {
  return (
    <section aria-labelledby="security-title" className="border-t border-line bg-surface py-24 lg:py-32">
      <Container>
        <SectionHeader
          id="security-title"
          title="Built to be trusted with your customers' addresses."
          intro="Security is part of the architecture, not a setting."
        />
        <ul className="mt-14 grid gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, body }) => (
            <li key={title} className="bg-surface p-7">
              <Icon className="text-ink" />
              <h3 className="mt-4 text-[1rem] font-semibold">{title}</h3>
              <p className="mt-1.5 text-[0.9375rem] text-ink-muted">{body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
