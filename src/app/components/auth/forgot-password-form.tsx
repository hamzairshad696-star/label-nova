"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { fieldErrors, forgotSchema } from "@/lib/validation/auth";
import { SubmitButton } from "./submit-button";

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const parsed = forgotSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setPending(true);
    const { error } = await authClient.requestPasswordReset({ email: parsed.data.email, redirectTo: "/reset-password" });
    setPending(false);
    // Only rate limits and outages are surfaced. Whether an account exists is never revealed.
    if (error && (error.status === 429 || (error.status ?? 0) >= 500)) return setError(authErrorMessage(error));
    setSentTo(parsed.data.email);
  }

  if (sentTo) {
    return (
      <div className="grid gap-6">
        <Alert tone="success" title="Check your email">
          If an account exists for {sentTo}, a reset link is on its way. It expires in 1 hour.
        </Alert>
        <p className="text-[0.9375rem] text-ink-muted">
          Nothing after a few minutes? Check spam, or{" "}
          <button type="button" onClick={() => setSentTo(null)} className="font-medium text-nova hover:text-nova-strong">
            try a different email
          </button>
          .
        </p>
        <Link href="/login" className="text-[0.9375rem] font-medium text-nova hover:text-nova-strong">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Field label="Email" name="email" type="email" autoComplete="email" required autoFocus error={errors.email} />
      <SubmitButton pending={pending} pendingLabel="Sending link…">
        Send reset link
      </SubmitButton>
    </form>
  );
}
