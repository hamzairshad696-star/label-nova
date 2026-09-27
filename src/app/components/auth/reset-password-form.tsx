"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { PasswordField } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { PASSWORD_MIN } from "@/lib/auth-constants";
import { authErrorMessage } from "@/lib/auth-errors";
import { fieldErrors, resetSchema } from "@/lib/validation/auth";
import { SubmitButton } from "./submit-button";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const parsed = resetSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setPending(true);
    const { error } = await authClient.resetPassword({ newPassword: parsed.data.password, token });
    if (error) {
      setPending(false);
      return setError(authErrorMessage(error));
    }
    router.replace("/login?reset=1");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {error ? (
        <Alert tone="danger">
          {error}{" "}
          {error.includes("expired") ? (
            <Link href="/forgot-password" className="font-medium underline underline-offset-2">
              Request a new link
            </Link>
          ) : null}
        </Alert>
      ) : null}
      <PasswordField
        label="New password"
        name="password"
        autoComplete="new-password"
        required
        autoFocus
        error={errors.password}
        hint={`At least ${PASSWORD_MIN} characters.`}
      />
      <PasswordField label="Confirm new password" name="confirm" autoComplete="new-password" required error={errors.confirm} />
      <SubmitButton pending={pending} pendingLabel="Saving…">
        Save new password
      </SubmitButton>
    </form>
  );
}
