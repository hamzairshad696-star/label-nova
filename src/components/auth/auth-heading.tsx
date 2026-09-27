import type { ReactNode } from "react";

export function AuthHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="text-[2rem] leading-tight font-semibold tracking-[-0.025em]">{title}</h1>
      {children ? <p className="mt-2 text-[0.9375rem] text-ink-muted">{children}</p> : null}
    </div>
  );
}
