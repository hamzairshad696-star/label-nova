"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Field, PasswordField } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { PASSWORD_MIN } from "@/lib/auth-constants";
import { authErrorMessage } from "@/lib/auth-errors";
import { fieldErrors, registerSchema } from "@/lib/validation/auth";
import { SubmitButton } from "./submit-button";

export function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const raw = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const parsed = registerSchema.safeParse({ ...raw, company: raw.company || undefined });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setPending(true);
    const { name, email, password, company } = parsed.data;
    const { error } = await authClient.signUp.email({ name, email, password, company });
    if (error) {
      setPending(false);
      return setError(authErrorMessage(error));
    }
    router.replace("/app");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Field label="Full name" name="name" autoComplete="name" required autoFocus error={errors.name} />
      <Field label="Company" name="company" autoComplete="organization" optional error={errors.company} />
      <Field label="Work email" name="email" type="email" autoComplete="email" required error={errors.email} />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        required
        error={errors.password}
        hint={`At least ${PASSWORD_MIN} characters. A short phrase is easier to remember than symbols.`}
      />
      <SubmitButton pending={pending} pendingLabel="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
