"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { mainNav } from "@/config/site";
import { cn } from "@/lib/cn";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close on navigation.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-midnight-line bg-midnight text-midnight-ink">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label="Label Nova home" className="rounded-control">
          <Logo tone="dark" />
        </Link>

        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center gap-0.5">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "rounded-control px-2.5 py-2 text-[0.875rem] transition-colors",
                    isActive(item.href) ? "text-white" : "text-midnight-muted hover:text-white",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-control px-3 py-2 text-[0.875rem] font-medium text-midnight-ink hover:text-white sm:inline-flex"
          >
            Sign in
          </Link>
          <ButtonLink href="/request-access" size="sm" variant="accent" className="hidden sm:inline-flex">
            Get started
          </ButtonLink>
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-10 items-center justify-center rounded-control text-white hover:bg-white/10 xl:hidden"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
            </svg>
          </button>
        </div>
      </Container>

      <div
        id={panelId}
        hidden={!open}
        className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto border-t border-midnight-line bg-midnight xl:hidden"
      >
        <Container className="flex min-h-full flex-col py-6">
          <nav aria-label="Main">
            <ul className="grid">
              {mainNav.map((item) => (
                <li key={item.href} className="border-b border-midnight-line">
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className="flex py-4 text-[1.125rem] text-midnight-ink hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto grid gap-3 pt-8">
            <ButtonLink href="/request-access" size="lg" variant="accent">
              Get started
            </ButtonLink>
            <ButtonLink href="/login" size="lg" variant="secondary">
              Sign in
            </ButtonLink>
          </div>
        </Container>
      </div>
    </header>
  );
}
