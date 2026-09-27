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
  title: "Label Nova — Labels, reimagined",
  description:
    "Create, customize, manage and generate professional shipping, product and warehouse labels — one label or ten thousand, as print-ready vector PDFs.",
  url: resolveSiteUrl(),
} as const;

export const mainNav = [
  { label: "Platform", href: "/#platform" },
  { label: "Features", href: "/#features" },
  { label: "Templates", href: "/#templates" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
] as const;
