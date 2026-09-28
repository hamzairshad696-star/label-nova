"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LogoMark, Wordmark } from "@/components/brand/logo";
import { cn } from "@/lib/cn";
import type { ShellNavItem } from "./nav";
import { SignOutButton } from "./sign-out-button";
import { WhatsAppButton } from "@/components/support/whatsapp-button";

const icons: Record<ShellNavItem["icon"], ReactNode> = {
  grid: <path d="M3.5 3.5h5v5h-5zM11.5 3.5h5v5h-5zM3.5 11.5h5v5h-5zM11.5 11.5h5v5h-5z" />,
  users: <path d="M7.5 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.5 16.5c.6-2.7 2.6-4.2 5-4.2s4.4 1.5 5 4.2M13 3.3a3 3 0 0 1 0 5.4M14.6 12.6c1.4.6 2.4 1.9 2.9 3.9" />,
  shield: <path d="M10 2.5 16 5v4.5c0 3.8-2.5 6.6-6 8-3.5-1.4-6-4.2-6-8V5z" />,
  box: <path d="M3 6.5 10 3l7 3.5v7L10 17l-7-3.5zM3 6.5 10 10l7-3.5M10 10v7" />,
};

export interface ShellUser {
  name: string;
  email: string;
  roleLabel: string;
}

export function Shell({
  area,
  nav,
  user,
  switchTo,
  children,
}: {
  area: "admin" | "app";
  nav: ShellNavItem[];
  user: ShellUser;
  switchTo?: { label: string; href: string };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
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

  const active = (i: ShellNavItem) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(`${i.href}/`));
  const initials = user.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const sidebar = (inDrawer: boolean) => (
    <div className="flex h-full flex-col">
      {inDrawer ? <div className="h-4" /> : (
        <div className="flex h-16 items-center gap-2.5 px-5">
          <LogoMark className="size-7" />
          <Wordmark className="text-[0.8125rem] text-white" />
        </div>
      )}
      <p className="px-5 pt-2 pb-3 text-[0.75rem] font-medium text-midnight-muted">{area === "admin" ? "Control center" : "Workspace"}</p>
      <nav aria-label={area === "admin" ? "Admin" : "Workspace"} className="px-3">
        <ul className="grid gap-0.5">
          {nav.map((i) => (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active(i) ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-control px-3 text-[0.9375rem] transition-colors",
                  active(i) ? "bg-white/10 text-white" : "text-midnight-muted hover:bg-white/5 hover:text-white",
                )}
              >
                <svg viewBox="0 0 20 20" className="size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
                  {icons[i.icon]}
                </svg>
                {i.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto border-t border-midnight-line p-4">
        {switchTo ? (
          <Link href={switchTo.href} className="mb-3 flex h-9 items-center rounded-control px-2 text-[0.875rem] text-midnight-muted hover:bg-white/5 hover:text-white">
            {switchTo.label}
          </Link>
        ) : null}
        <div className="flex items-center gap-3 px-1">
          <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-nova text-[0.75rem] font-semibold text-white">
            {initials}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[0.875rem] font-medium text-white">{user.name}</p>
            <p className="truncate text-[0.75rem] text-midnight-muted">{user.roleLabel}</p>
          </div>
        </div>
        <div className="mt-3 [&_button]:w-full [&_button]:justify-start [&_button]:text-midnight-muted [&_button:hover]:bg-white/5 [&_button:hover]:text-white">
          <SignOutButton />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-dvh bg-midnight lg:block">{sidebar(false)}</aside>

      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-midnight-line bg-midnight px-4 lg:hidden">
        <span className="flex items-center gap-2.5">
          <LogoMark className="size-7" />
          <Wordmark className="text-[0.8125rem] text-white" />
        </span>
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls="app-drawer"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-10 items-center justify-center rounded-control text-white hover:bg-white/10"
        >
          <span className="sr-only">{open ? "Close navigation" : "Open navigation"}</span>
          <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
          </svg>
        </button>
      </header>
      {/* z-50 so the drawer covers the floating support button (z-40). */}
      <div id="app-drawer" hidden={!open} className="fixed inset-x-0 top-14 bottom-0 z-50 overflow-y-auto bg-midnight lg:hidden">
        {sidebar(true)}
      </div>

      <main id="main" className="min-w-0">
        {children}
      </main>
      <WhatsAppButton />
    </div>
  );
}

/** Standard page header inside the shell. */
export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line bg-surface px-5 py-7 sm:px-8 lg:px-10">
      <div>
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.025em]">{title}</h1>
        {description ? <p className="mt-1.5 text-ink-muted">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}
