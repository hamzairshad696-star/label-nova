function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.BETTER_AUTH_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  // Vercel sets these automatically, so the site works before a custom domain is configured.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const siteConfig = {
  name: "Label Nova",
  title: "Label Nova — Shipping, reimagined",
  description:
    "Label Nova connects the whole shipping journey — order, rate, label, carrier, tracking and delivery — in one platform for shippers, dealers and resellers.",
  url: resolveSiteUrl(),
} as const;

export interface NavItem {
  label: string;
  href: string;
}

/** Top navigation. Everything else is reachable from the footer. */
export const mainNav: NavItem[] = [
  { label: "Platform", href: "/platform" },
  { label: "Solutions", href: "/solutions" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Carriers", href: "/carriers" },
  { label: "Bulk shipping", href: "/bulk-shipping" },
  { label: "Tracking", href: "/tracking" },
  { label: "Pricing", href: "/pricing" },
  { label: "API", href: "/developers" },
  { label: "Resources", href: "/resources" },
];

export const footerNav: { title: string; links: NavItem[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Platform", href: "/platform" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Bulk shipping", href: "/bulk-shipping" },
      { label: "Tracking", href: "/tracking" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Shipping",
    links: [
      { label: "Solutions", href: "/solutions" },
      { label: "Carriers", href: "/carriers" },
      { label: "API", href: "/developers" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Resources and FAQ", href: "/resources" },
      { label: "Contact", href: "/contact" },
      { label: "Request access", href: "/request-access" },
    ],
  },
];
