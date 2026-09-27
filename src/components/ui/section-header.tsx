import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SectionHeaderProps {
  id?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

/** Heading block for landing sections. The h2's id is referenced by the section's aria-labelledby. */
export function SectionHeader({ id, title, intro, align = "left", className }: SectionHeaderProps) {
  return (
    <div className={cn("max-w-[40rem]", align === "center" && "mx-auto text-center", className)}>
      <h2 id={id} className="text-h2 font-semibold text-balance">
        {title}
      </h2>
      {intro ? <p className="mt-4 text-lead text-ink-muted text-pretty">{intro}</p> : null}
    </div>
  );
}
