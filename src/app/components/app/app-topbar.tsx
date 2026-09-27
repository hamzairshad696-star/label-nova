import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import type { Actor } from "@/server/auth/session";
import { SignOutButton } from "./sign-out-button";

/** Interim top bar for signed-in pages. Phase 3 replaces it with the full sidebar shell. */
export function AppTopbar({ actor, area }: { actor: Actor; area: "app" | "admin" }) {
  const initials = actor.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex items-center gap-4">
          <Link href="/app" aria-label="Label Nova dashboard" className="rounded-control">
            <Logo />
          </Link>
          {area === "admin" ? <Badge tone="accent">Admin console</Badge> : null}
        </div>
        <div className="flex items-center gap-3">
          {actor.role.key === "ADMIN" ? (
            <Link
              href={area === "admin" ? "/app" : "/admin"}
              className="hidden rounded-control px-3 py-1.5 text-[0.875rem] text-ink-muted hover:text-ink sm:block"
            >
              {area === "admin" ? "Back to workspace" : "Admin console"}
            </Link>
          ) : null}
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-ink text-[0.75rem] font-semibold text-white" aria-hidden="true">
              {initials}
            </span>
            <div className="hidden leading-tight sm:block">
              <p className="text-[0.875rem] font-medium">{actor.name}</p>
              <p className="text-[0.75rem] text-ink-muted">{actor.role.name}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
