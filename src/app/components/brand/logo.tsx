import { cn } from "@/lib/cn";

/**
 * Label Nova mark: a folded-corner label with a four-point spark (the "nova")
 * where a shipping tag's eyelet would sit.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-7 shrink-0", className)}>
      <path d="M6 4h14.5L27 10.5V28H6z" fill="currentColor" />
      <path d="M20.5 4v6.5H27" fill="none" stroke="var(--paper)" strokeWidth="1.5" />
      <path
        d="M14 9.8c.45 2.7 1.4 3.65 4.1 4.1-2.7.45-3.65 1.4-4.1 4.1-.45-2.7-1.4-3.65-4.1-4.1 2.7-.45 3.65-1.4 4.1-4.1z"
        fill="#8f87ff"
      />
      <rect x="10" y="21" width="12" height="1.6" rx=".8" fill="var(--paper)" opacity=".55" />
      <rect x="10" y="24" width="8" height="1.6" rx=".8" fill="var(--paper)" opacity=".35" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-ink", className)}>
      <LogoMark />
      <span className="text-[1.0625rem] font-semibold tracking-[-0.02em]">Label Nova</span>
    </span>
  );
}
