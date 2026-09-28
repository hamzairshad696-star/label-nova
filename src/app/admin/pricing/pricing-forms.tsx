"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useActionForm } from "@/components/app/use-action-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SelectField } from "@/components/ui/select";
import { formatCents } from "@/lib/money";
import { parseMoney } from "@/lib/validation/pricing";
import { createCarrierAction, createRuleAction, createServiceAction, setRuleActiveAction, setServiceActiveAction, updateRuleAction } from "./actions";

function Notice({ n }: { n: { tone: "success" | "danger"; text: string } | null }) {
  return <div aria-live="polite">{n ? <Alert tone={n.tone}>{n.text}</Alert> : null}</div>;
}

export function AddCarrierForm() {
  const f = useActionForm(createCarrierAction, { success: "Carrier added.", resetOnSuccess: true });
  return (
    <form onSubmit={f.onSubmit} noValidate className="grid gap-4">
      <Notice n={f.notice} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Carrier name" name="name" placeholder="Label Nova" error={f.fields.name} />
        <Field label="Key" name="key" placeholder="label_nova" hint="Lowercase, used internally." error={f.fields.key} />
      </div>
      <div><Button type="submit" variant="secondary" disabled={f.pending}>{f.pending ? "Adding…" : "Add carrier"}</Button></div>
    </form>
  );
}

export function AddServiceForm({ carriers }: { carriers: { id: string; name: string }[] }) {
  const f = useActionForm(createServiceAction, { success: "Service added.", resetOnSuccess: true });
  return (
    <form onSubmit={f.onSubmit} noValidate className="grid gap-4">
      <Notice n={f.notice} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Carrier" name="carrierId" defaultValue="" error={f.fields.carrierId}>
          <option value="" disabled>Choose a carrier</option>
          {carriers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </SelectField>
        <SelectField label="Service type" name="kind" defaultValue="label_only" error={f.fields.kind} hint="Carrier postage can be priced now but can't be bought until a carrier partner is connected.">
          <option value="label_only">Label only (no postage)</option>
          <option value="carrier_postage">Carrier postage</option>
        </SelectField>
        <Field label="Service name" name="name" placeholder="Standard label" error={f.fields.name} />
        <Field label="Key" name="key" placeholder="standard" error={f.fields.key} />
        <Field label="Delivery days, from" name="transitMinDays" inputMode="numeric" optional error={f.fields.transitMinDays} />
        <Field label="Delivery days, to" name="transitMaxDays" inputMode="numeric" optional error={f.fields.transitMaxDays} />
      </div>
      <div><Button type="submit" variant="secondary" disabled={f.pending || carriers.length === 0}>{f.pending ? "Adding…" : "Add service"}</Button></div>
    </form>
  );
}

export interface RuleDefaults {
  weightMinOz?: number; weightMaxOz?: number; zone?: number | null; costCents?: number | null;
  customerCents?: number; dealerCents?: number; resellerCents?: number;
}
const dollars = (c: number | null | undefined) => (c === null || c === undefined ? "" : (c / 100).toFixed(2));

function Margin({ price, cost }: { price: string; cost: string }) {
  const p = parseMoney(price), c = parseMoney(cost);
  if (p === null || c === null || cost === "") return null;
  const m = p - c;
  return <span className={m < 0 ? "text-danger" : "text-ink-muted"}>{m < 0 ? `${formatCents(-m)} below cost` : `${formatCents(m)} over cost`}</span>;
}

export function RuleForm({ serviceId, ruleId, defaults = {}, onDone }: { serviceId: string; ruleId?: string; defaults?: RuleDefaults; onDone?: () => void }) {
  const [v, setV] = useState({ cost: dollars(defaults.costCents), customer: dollars(defaults.customerCents), dealer: dollars(defaults.dealerCents), reseller: dollars(defaults.resellerCents) });
  const action = ruleId ? (d: Record<string, string>) => updateRuleAction(ruleId, d) : createRuleAction;
  const f = useActionForm(action, { success: ruleId ? "Rule updated. New labels use this price." : "Rule added.", resetOnSuccess: !ruleId, onSuccess: () => { if (!ruleId) setV({ cost: "", customer: "", dealer: "", reseller: "" }); onDone?.(); } });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });
  return (
    <form onSubmit={f.onSubmit} noValidate className="grid gap-4">
      <Notice n={f.notice} />
      <input type="hidden" name="serviceId" value={serviceId} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Weight from (oz)" name="weightMinOz" inputMode="numeric" defaultValue={defaults.weightMinOz ?? ""} error={f.fields.weightMinOz} hint="16 oz = 1 lb" />
        <Field label="Weight to (oz)" name="weightMaxOz" inputMode="numeric" defaultValue={defaults.weightMaxOz ?? ""} error={f.fields.weightMaxOz} hint="Inclusive" />
        <Field label="Zone" name="zone" inputMode="numeric" defaultValue={defaults.zone ?? ""} optional error={f.fields.zone} hint="Leave empty for any zone." />
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Carrier cost ($)" name="cost" inputMode="decimal" value={v.cost} onChange={set("cost")} optional error={f.fields.cost} hint="Admin only" />
        {(["customer", "dealer", "reseller"] as const).map((k) => (
          <Field key={k} label={`${k[0]!.toUpperCase()}${k.slice(1)} price ($)`} name={k} inputMode="decimal" value={v[k]} onChange={set(k)} error={f.fields[k]} hint={<Margin price={v[k]} cost={v.cost} />} />
        ))}
      </div>
      <div className="flex gap-3">
        <Button type="submit" variant="accent" disabled={f.pending}>{f.pending ? "Saving…" : ruleId ? "Save changes" : "Add rule"}</Button>
      </div>
    </form>
  );
}

export function ActiveToggle({ id, active, kind }: { id: string; active: boolean; kind: "rule" | "service" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          const r = kind === "rule" ? await setRuleActiveAction(id, !active) : await setServiceActiveAction(id, !active);
          setPending(false);
          if (!r.ok) setError(r.error);
          else router.refresh();
        }}
      >
        {pending ? "Saving…" : `${active ? "Deactivate" : "Activate"}${kind === "service" ? " service" : ""}`}
      </Button>
      {error ? <span role="alert" className="max-w-[16rem] text-[0.8125rem] text-danger">{error}</span> : null}
    </span>
  );
}
