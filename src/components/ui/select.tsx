import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { inputStyles } from "./field";

export function SelectField({ label, error, hint, className, children, ...props }: Omit<ComponentProps<"select">, "id"> & { label: string; error?: string; hint?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[0.875rem] font-medium">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined}
          className={cn(inputStyles, "appearance-none pr-10", error ? "border-danger" : "border-line-strong hover:border-ink/40")}
          {...props}
        >
          {children}
        </select>
        <svg viewBox="0 0 20 20" aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-[18px] -translate-y-1/2 text-ink-muted" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8l4 4 4-4" />
        </svg>
      </div>
      {error ? (
        <p id={`${id}-e`} className="mt-1.5 text-[0.8125rem] text-danger">{error}</p>
      ) : hint ? (
        <p id={`${id}-h`} className="mt-1.5 text-[0.8125rem] text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}
