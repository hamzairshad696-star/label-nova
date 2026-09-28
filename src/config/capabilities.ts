/**
 * What Label Nova can do today, and what is still being built.
 * Every public page reads its status tags from here, so the website can never claim more than
 * the product does. Flip a status only when the feature is live in production and tested.
 */
export type CapabilityStatus = "available" | "building" | "partner";

export interface Capability {
  title: string;
  summary: string;
  status: CapabilityStatus;
}

export const statusLabel: Record<CapabilityStatus, string> = {
  available: "Available",
  building: "In development",
  partner: "Needs carrier partner",
};

export const capabilities = {
  accounts: {
    title: "Managed accounts and roles",
    summary: "Admin, dealer, reseller and customer accounts, each seeing only what their role allows.",
    status: "available",
  },
  audit: {
    title: "Activity log",
    summary: "Sign-ins, role changes and password resets are recorded with time, account and IP address.",
    status: "available",
  },
  orders: {
    title: "Orders and shipments",
    summary: "Every shipment keeps its order, label, cost and status together in one record.",
    status: "available",
  },
  rates: {
    title: "Rate comparison",
    summary: "Compare services side by side with your account's price, delivery time and the best value flagged.",
    status: "partner",
  },
  labels: {
    title: "Print-ready labels",
    summary: "Vector PDF Label Nova labels with scannable Code 128 barcodes in 4×6, 4×4, 2×1, A4 and Letter. Label-only: no carrier postage.",
    status: "available",
  },
  carriers: {
    title: "Carrier postage",
    summary: "USPS, UPS and FedEx postage bought through an authorised carrier partner, never self-printed.",
    status: "partner",
  },
  bulk: {
    title: "Bulk shipping",
    summary: "Upload CSV or Excel, map columns, fix bad rows in place, then generate every label as one PDF or ZIP.",
    status: "building",
  },
  tracking: {
    title: "Tracking",
    summary: "One timeline per shipment, built from real carrier scan events.",
    status: "partner",
  },
  wallet: {
    title: "Wallet and ledger",
    summary: "Prepaid balance where every charge, top-up, refund and adjustment is an auditable ledger entry. Top-ups are credited by the Label Nova team.",
    status: "available",
  },
  pricing: {
    title: "Tiered pricing",
    summary: "Separate customer, dealer and reseller prices per carrier, service, weight and zone, set by the admin.",
    status: "available",
  },
  api: {
    title: "Developer API",
    summary: "API keys, webhooks, a sandbox and request logs for connecting your own systems.",
    status: "building",
  },
  askNova: {
    title: "Ask Nova",
    summary: "Ask questions about your own shipping data in plain language.",
    status: "building",
  },
} satisfies Record<string, Capability>;

export type CapabilityKey = keyof typeof capabilities;
