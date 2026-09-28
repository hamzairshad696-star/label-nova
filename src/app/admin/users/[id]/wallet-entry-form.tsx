"use client";

import { useState } from "react";
import { useActionForm } from "@/components/app/use-action-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SelectField } from "@/components/ui/select";
import { walletEntryAction } from "../actions";

export function WalletEntryForm({ userId }: { userId: string }) {
  // One key per intended entry: a retry or double-click sends the same key, so it's recorded once.
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [type, setType] = useState("top_up");
  const f = useActionForm(walletEntryAction, { resetOnSuccess: true, onSuccess: () => { setKey(crypto.randomUUID()); setType("top_up"); } });
  return (
    <form onSubmit={f.onSubmit} noValidate className="grid gap-4">
      <div aria-live="polite">{f.notice ? <Alert tone={f.notice.tone}>{f.notice.text}</Alert> : null}</div>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="idempotencyKey" value={key} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Type" name="type" value={type} onChange={(e) => setType(e.target.value)} error={f.fields.type}>
          <option value="top_up">Top-up (money received)</option>
          <option value="adjustment_credit">Adjustment — add to balance</option>
          <option value="adjustment_debit">Adjustment — take from balance</option>
        </SelectField>
        <Field label="Amount ($)" name="amount" inputMode="decimal" placeholder="25.00" error={f.fields.amount} />
      </div>
      <Field label="Note" name="note" placeholder={type === "top_up" ? "Bank transfer received 28 Sep" : "Reason for the adjustment"} error={f.fields.note} hint="Shown to the customer in their transactions." />
      <Field label="Payment reference" name="reference" optional error={f.fields.reference} hint="Bank or receipt reference, for your records." />
      <div>
        <Button type="submit" variant="accent" disabled={f.pending}>{f.pending ? "Recording…" : "Record entry"}</Button>
      </div>
    </form>
  );
}
