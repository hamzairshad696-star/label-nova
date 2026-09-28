import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

const pages = ["", "platform", "solutions", "how-it-works", "carriers", "bulk-shipping", "tracking", "pricing", "developers", "resources", "about", "contact", "request-access"];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((p) => ({
    url: `${siteConfig.url}/${p}`,
    changeFrequency: p === "" ? "weekly" : "monthly",
    priority: p === "" ? 1 : 0.6,
  }));
}
