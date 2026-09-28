"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SelectField } from "@/components/ui/select";
import { generatePassword } from "@/lib/generate-password";
import { createAccountAction } from "../actions";

interface Partner {
  id: string;
  name: string;
  company: string | null;
  role: string;
}

const roleHelp: Record<string, string> = {
  CLIENT: "Ships parcels and sees only their own account.",
  DEALER: "Runs their own network of customers.",
  RESELLER: "Sells Label Nova shipping to their own clients.",
};

export function CreateAccountForm({ partners }: { partners: Partner[] }) {
  const router = useRouter();
  const [role, setRole] = useState("CLIENT");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const res = await createAccountAction(data);
    if (res.ok) {
      router.push(`/admin/users/${res.id}?created=1`);
      return;
    }
    setPending(false);
    setError(res.error);
    setFields(res.fields ?? {});
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6">
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 font-semibold">Person</legend>
        <Field label="Full name" name="name" autoComplete="off" required error={fields.name} />
        <Field label="Email" name="email" type="email" autoComplete="off" required error={fields.email} />
        <Field label="Company" name="company" optional autoComplete="off" error={fields.company} className="sm:col-span-2" />
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-4 font-semibold">Access</legend>
        <SelectField label="Role" name="role" value={role} onChange={(e) => setRole(e.target.value)} error={fields.role} hint={roleHelp[role]}>
          <option value="CLIENT">Customer</option>
          <option value="DEALER">Dealer</option>
          <option value="RESELLER">Reseller</option>
        </SelectField>
        {role === "CLIENT" ? (
          <SelectField label="Belongs to" name="parentUserId" defaultValue="" error={fields.parentUserId} hint="Dealer or reseller who manages this customer.">
            <option value="">Label Nova (direct customer)</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.company ? ` — ${p.company}` : ""} ({p.role === "DEALER" ? "Dealer" : "Reseller"})
              </option>
            ))}
          </SelectField>
        ) : (
          <p className="self-end pb-3 text-[0.875rem] text-ink-muted">Dealers and resellers report directly to the admin.</p>
        )}
        <SelectField label="Status" name="status" defaultValue="active">
          <option value="active">Active — can sign in now</option>
          <option value="disabled">Disabled — create now, enable later</option>
        </SelectField>
      </fieldset>

      <fieldset>
        <legend className="mb-4 font-semibold">First password</legend>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <Field
            label="Password"
            name="password"
            type="text"
            autoComplete="new-password"
            spellCheck={false}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fields.password}
            hint="Share it with the person privately. They can change it with “Forgot password”."
            className="flex-1"
            inputClassName="font-mono"
          />
          <Button variant="secondary" className="sm:mt-[1.85rem]" onClick={() => setPassword(generatePassword())}>
            Generate
          </Button>
        </div>
      </fieldset>

      <div className="flex gap-3 border-t border-line pt-6">
        <Button type="submit" variant="accent" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
        <Button variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
