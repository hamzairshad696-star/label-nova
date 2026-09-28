"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Field, PasswordField } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { fieldErrors, loginSchema } from "@/lib/validation/auth";
import { SubmitButton } from "./submit-button";

export function LoginForm({ next, notice }: { next: string; notice?: string | null }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setPending(true);
    const { error } = await authClient.signIn.email({ ...parsed.data, rememberMe: true });
    if (error) {
      setPending(false);
      return setError(authErrorMessage(error));
    }
    // The welcome screen decides the destination from the person's role.
    router.replace(next ? `/welcome?next=${encodeURIComponent(next)}` : "/welcome");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Field label="Email" name="email" type="email" autoComplete="email" required autoFocus error={errors.email} />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="current-password"
        required
        error={errors.password}
      />
      <SubmitButton pending={pending} pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
      {/* After the button, so Tab goes Email → Password → Sign in. */}
      <Link href="/forgot-password" className="justify-self-center text-[0.875rem] font-medium text-nova hover:text-nova-strong">
        Forgot password?
      </Link>
    </form>
  );
}
