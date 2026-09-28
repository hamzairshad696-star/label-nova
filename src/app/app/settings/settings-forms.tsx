"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, PasswordField } from "@/components/ui/field";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/auth-constants";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

type Notice = { tone: "success" | "danger"; text: string } | null;

export function ProfileForm({ name, company }: { name: string; company: string | null }) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const nextName = String(f.get("name") ?? "").trim();
    const nextCompany = String(f.get("company") ?? "").trim();
    if (!nextName) return setErr("Enter your name.");
    if (nextName.length > 120) return setErr("Keep your name under 120 characters.");
    setErr(undefined);
    setPending(true);
    const { error } = await authClient.updateUser({ name: nextName, company: nextCompany.slice(0, 160) || null });
    setPending(false);
    if (error) return setNotice({ tone: "danger", text: authErrorMessage(error) });
    setNotice({ tone: "success", text: "Profile saved." });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <div aria-live="polite">{notice ? <Alert tone={notice.tone}>{notice.text}</Alert> : null}</div>
      <Field label="Name" name="name" defaultValue={name} autoComplete="name" required error={err} />
      <Field label="Company" name="company" defaultValue={company ?? ""} autoComplete="organization" optional maxLength={160} />
      <div>
        <Button type="submit" variant="accent" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const current = String(f.get("current") ?? "");
    const next = String(f.get("next") ?? "");
    const confirm = String(f.get("confirm") ?? "");
    const errs: Record<string, string> = {};
    if (!current) errs.current = "Enter your current password.";
    if (next.length < PASSWORD_MIN) errs.next = `Use at least ${PASSWORD_MIN} characters.`;
    else if (next.length > PASSWORD_MAX) errs.next = `Use ${PASSWORD_MAX} characters or fewer.`;
    if (confirm !== next) errs.confirm = "Passwords don't match.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setPending(true);
    const { error } = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true });
    setPending(false);
    if (error) {
      const invalid = /invalid password|incorrect/i.test(error.message ?? "") || error.status === 400;
      return setNotice({ tone: "danger", text: invalid ? "Your current password is incorrect." : authErrorMessage(error) });
    }
    form.reset();
    setNotice({ tone: "success", text: "Password changed. You've been signed out on your other devices." });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <div aria-live="polite">{notice ? <Alert tone={notice.tone}>{notice.text}</Alert> : null}</div>
      <PasswordField label="Current password" name="current" autoComplete="current-password" required error={errors.current} />
      <PasswordField label="New password" name="next" autoComplete="new-password" required error={errors.next} hint={`At least ${PASSWORD_MIN} characters.`} />
      <PasswordField label="Confirm new password" name="confirm" autoComplete="new-password" required error={errors.confirm} />
      <div>
        <Button type="submit" variant="accent" disabled={pending}>
          {pending ? "Changing…" : "Change password"}
        </Button>
      </div>
    </form>
  );
}
