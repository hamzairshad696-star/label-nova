"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LogoMark, Wordmark } from "@/components/brand/logo";
import { cn } from "@/lib/cn";
import type { NavIcon, ShellNavItem } from "./nav";
import { SignOutButton } from "./sign-out-button";
import { WhatsAppButton } from "@/components/support/whatsapp-button";

const icons: Record<NavIcon, ReactNode> = {
  grid: <path d="M3.5 3.5h5v5h-5zM11.5 3.5h5v5h-5zM3.5 11.5h5v5h-5zM11.5 11.5h5v5h-5z" />,
  users: <path d="M7.5 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.5 16.5c.6-2.7 2.6-4.2 5-4.2s4.4 1.5 5 4.2M13 3.3a3 3 0 0 1 0 5.4M14.6 12.6c1.4.6 2.4 1.9 2.9 3.9" />,
  file: <path d="M5 2.5h6.5L15 6v11.5H5zM11.5 2.5V6H15M10 9v5M7.5 11.5h5" />,
  stack: <path d="M3 5.5h14v3H3zM3 11.5h14v3H3z" />,
  box: <path d="M3 6.5 10 3l7 3.5v7L10 17l-7-3.5zM3 6.5 10 10l7-3.5M10 10v7" />,
  route: <path d="M4.5 15.5a2 2 0 1 0 0-.01M15.5 4.5a2 2 0 1 0 0-.01M6.5 15.5h5a3 3 0 0 0 0-6h-3a3 3 0 0 1 0-6h5" />,
  layers: <path d="M10 3l7 4-7 4-7-4zM3 11l7 4 7-4" />,
  wallet: <path d="M3 6.5h13.5v10H3zM3 6.5 13 3.5v3M13 11.5h1.5" />,
  list: <path d="M7 5.5h10M7 10h10M7 14.5h10M3.5 5.5h.01M3.5 10h.01M3.5 14.5h.01" />,
  code: <path d="M7 6 3 10l4 4M13 6l4 4-4 4" />,
  cog: <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" />,
  help: <path d="M10 17.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15ZM7.8 7.8a2.3 2.3 0 1 1 3 2.2c-.5.2-.8.6-.8 1.1v.4M10 14h.01" />,
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
          {nav.map((i) =>
            i.soon ? (
              <li key={i.href}>
                <span
                  aria-disabled="true"
                  className="flex h-10 cursor-default items-center gap-3 rounded-control px-3 text-[0.9375rem] text-midnight-muted/60"
                >
                  <svg viewBox="0 0 20 20" className="size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
                    {icons[i.icon]}
                  </svg>
                  {i.label}
                  <span className="ml-auto rounded-full bg-white/[0.06] px-2 py-0.5 text-[0.6875rem] text-midnight-muted">
                    Soon<span className="sr-only"> — not available yet</span>
                  </span>
                </span>
              </li>
            ) : (
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
            ),
          )}
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
