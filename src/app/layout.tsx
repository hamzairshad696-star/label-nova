import "@fontsource-variable/hanken-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.title, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: siteConfig.title, description: siteConfig.description },
};

export const viewport: Viewport = {
  themeColor: "#F4F5F2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main"
          className="sr-only z-[100] rounded-control bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
