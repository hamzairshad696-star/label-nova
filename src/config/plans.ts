/** Display copy for the landing page. Real prices move to the `pricing` table in Phase 9. */
export interface Plan {
  id: string;
  name: string;
  summary: string;
  /** Price per label in cents; null means custom pricing. */
  perLabelCents: number | null;
  monthlyCents: number;
  includes: string[];
  cta: { label: string; href: string };
  recommended?: boolean;
}

export const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    summary: "For shops printing a few labels a day.",
    perLabelCents: 12,
    monthlyCents: 0,
    includes: ["All standard templates", "Single-label creator", "CSV bulk up to 500 rows", "Label history for 90 days"],
    cta: { label: "Request access", href: "/request-access" },
  },
  {
    id: "growth",
    name: "Growth",
    summary: "For teams shipping every day.",
    perLabelCents: 8,
    monthlyCents: 2900,
    includes: [
      "Everything in Starter",
      "Custom layouts in the designer",
      "CSV and Excel bulk up to 25,000 rows",
      "REST API and webhooks",
      "Unlimited label history",
    ],
    cta: { label: "Request access", href: "/request-access" },
    recommended: true,
  },
  {
    id: "network",
    name: "Network",
    summary: "For dealers and resellers serving their own clients.",
    perLabelCents: null,
    monthlyCents: 0,
    includes: ["Everything in Growth", "Dealer and reseller accounts", "Per-client pricing and margins", "Priority support"],
    cta: { label: "Talk to sales", href: "mailto:sales@labelnova.com" },
  },
];

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

export function formatCents(cents: number): string {
  return usd.format(cents / 100);
}
