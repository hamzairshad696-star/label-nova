import { cn } from "@/lib/cn";

/**
 * Label Nova mark: a four-point nova inside an orbit, with the amber parcel riding the orbit.
 * The orbit is the route; the star is the platform at its centre.
 */
export function LogoMark({ className, orbitClassName }: { className?: string; orbitClassName?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="9" fill="#4b3fea" />
      <path
        d="M16 6.5C16.8 13.2 18.8 15.2 25.5 16 18.8 16.8 16.8 18.8 16 25.5 15.2 18.8 13.2 16.8 6.5 16 13.2 15.2 15.2 13.2 16 6.5Z"
        fill="#fff"
      />
      <ellipse
        className={orbitClassName}
        cx="16"
        cy="16"
        rx="12.5"
        ry="5"
        transform="rotate(-28 16 16)"
        fill="none"
        stroke="#fff"
        strokeOpacity=".55"
        strokeWidth="1.1"
        strokeDasharray="44 60"
        strokeLinecap="round"
      />
      <circle cx="26.2" cy="11.2" r="2" fill="#ffb13b" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return <span className={cn("font-semibold tracking-[0.16em] uppercase", className)}>Label Nova</span>;
}

/** Full lockup. `tone="dark"` is for midnight backgrounds. */
export function Logo({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", tone === "dark" ? "text-white" : "text-ink", className)}>
      <LogoMark />
      <Wordmark className="text-[0.9375rem]" />
    </span>
  );
}
