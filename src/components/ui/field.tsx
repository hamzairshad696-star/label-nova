"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export const inputStyles =
  "h-11 w-full rounded-control border bg-surface px-3 text-[0.9375rem] text-ink outline-none transition-[border-color,box-shadow] " +
  "placeholder:text-ink-faint focus:border-nova focus:shadow-[0_0_0_3px_var(--nova-soft)] focus-visible:outline-none " +
  "disabled:cursor-not-allowed disabled:bg-sunken";

export interface FieldProps extends Omit<ComponentProps<"input">, "id"> {
  label: string;
  error?: string | null;
  hint?: ReactNode;
  optional?: boolean;
  /** Content placed at the right of the label row, e.g. a "Forgot password?" link. */
  labelAside?: ReactNode;
  className?: string;
  inputClassName?: string;
}

/** Labelled input with hint and error wired to aria-describedby / aria-invalid. */
export function Field({ label, error, hint, optional, labelAside, className, inputClassName, ...input }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[0.875rem] font-medium">
          {label}
        </label>
        {optional ? <span className="text-[0.8125rem] text-ink-faint">Optional</span> : labelAside}
      </div>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[errorId, hintId].filter(Boolean).join(" ") || undefined}
        className={cn(inputStyles, error ? "border-danger" : "border-line-strong hover:border-ink/40", inputClassName)}
        {...input}
      />
      {error ? (
        <p id={errorId} className="mt-1.5 text-[0.8125rem] leading-snug text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-[0.8125rem] leading-snug text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Password input with a show/hide toggle. */
export function PasswordField(props: Omit<FieldProps, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Field {...props} type={visible ? "text" : "password"} inputClassName="pr-16" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute top-[2.05rem] right-1.5 h-8 rounded-[4px] px-2.5 text-[0.8125rem] font-medium text-ink-muted hover:bg-sunken hover:text-ink"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
