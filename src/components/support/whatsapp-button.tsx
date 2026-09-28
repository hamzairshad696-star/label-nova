"use client";

import { usePathname } from "next/navigation";
import { whatsappLink, type SupportTopic } from "@/config/support";

/** Page → prefilled message. Most specific prefix wins. */
const topicByPath: [string, SupportTopic][] = [
  ["/pricing", "pricing"],
  ["/request-access", "account"],
  ["/solutions", "partner"],
  ["/developers", "technical"],
  ["/app", "technical"],
  ["/admin", "technical"],
];

export function WhatsAppButton() {
  const pathname = usePathname();
  const topic = topicByPath.find(([p]) => pathname === p || pathname.startsWith(`${p}/`))?.[1] ?? "general";

  return (
    <aside aria-label="Support">
    <a
      href={whatsappLink(topic)}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-4 bottom-4 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-[#177a40] pr-4 pl-3.5 text-[0.9375rem] font-medium text-white shadow-lift transition-[transform,background-color] duration-150 hover:bg-[#136836] active:translate-y-px max-sm:size-12 max-sm:justify-center max-sm:p-0 sm:right-6 sm:bottom-6"
    >
      <svg viewBox="0 0 20 20" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
        <path d="M10 3.2a6.8 6.8 0 0 0-5.9 10.2L3.2 16.8l3.5-.9A6.8 6.8 0 1 0 10 3.2Z" />
        <path d="M7.6 8.2c.2 1.7 2 3.6 4.2 4.2" strokeLinecap="round" />
      </svg>
      <span className="max-sm:sr-only">WhatsApp support</span>
    </a>
    </aside>
  );
}
