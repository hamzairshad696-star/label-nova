"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { whatsappLink } from "@/config/support";
import { cn } from "@/lib/cn";
import { formatCents } from "@/lib/money";
import type { PublicQuote } from "@/server/services/labels";
import { checkStepAction, purchaseAction, quoteAction } from "./actions";

type Address = { name: string; company: string; line1: string; line2: string; city: string; state: string; postalCode: string; country: string; phone: string };
const EMPTY: Address = { name: "", company: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "US", phone: "" };
const STEPS = ["Addresses", "Package", "Service", "Review", "Label"] as const;
const FORMATS = [
  { id: "4x6", label: "4 × 6 thermal" },
  { id: "4x4", label: "4 × 4 thermal" },
  { id: "letter", label: "Letter sheet" },
  { id: "a4", label: "A4 sheet" },
  { id: "2x1", label: "2 × 1 sticker" },
];

function AddressFields({ side, title, value, onChange, errors }: { side: "from" | "to"; title: string; value: Address; onChange: (a: Address) => void; errors: Record<string, string> }) {
  const f = (k: keyof Address, label: string, props: Record<string, unknown> = {}) => (
    <Field
      label={label}
      value={value[k]}
      onChange={(e) => onChange({ ...value, [k]: e.target.value })}
      error={errors[`${side}.${k}`]}
      autoComplete={side === "to" ? "off" : undefined}
      {...props}
    />
  );
  return (
    <fieldset className="grid gap-4 sm:grid-cols-6">
      <legend className="mb-4 font-semibold">{title}</legend>
      <div className="sm:col-span-3">{f("name", "Full name")}</div>
      <div className="sm:col-span-3">{f("company", "Company", { optional: true })}</div>
      <div className="sm:col-span-4">{f("line1", "Street address")}</div>
      <div className="sm:col-span-2">{f("line2", "Apt, suite, unit", { optional: true })}</div>
      <div className="sm:col-span-3">{f("city", "City")}</div>
      <div className="sm:col-span-1">{f("state", "State", { maxLength: 40 })}</div>
      <div className="sm:col-span-2">{f("postalCode", "ZIP code", { inputMode: "numeric" })}</div>
      <div className="sm:col-span-2">{f("country", "Country", { maxLength: 2, hint: "2 letters, e.g. US" })}</div>
      <div className="sm:col-span-4">{f("phone", "Phone", { optional: true, type: "tel" })}</div>
    </fieldset>
  );
}

export function CreateLabelWizard({ initialFrom, initialBalance }: { initialFrom: Address | null; initialBalance: number }) {
  const [step, setStep] = useState(0);
  const [from, setFrom] = useState<Address>(initialFrom ?? EMPTY);
  const [to, setTo] = useState<Address>(EMPTY);
  const [pkg, setPkg] = useState({ weightLb: "", weightOz: "", lengthIn: "", widthIn: "", heightIn: "", reference: "" });
  const [totalOz, setTotalOz] = useState(0);
  const [quotes, setQuotes] = useState<PublicQuote[] | null>(null);
  const [balance, setBalance] = useState(initialBalance);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ id: string } | null>(null);
  const [key, setKey] = useState(() => crypto.randomUUID());
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { headingRef.current?.focus(); }, [step]);

  const available = (quotes ?? []).filter((q) => q.available && q.priceCents !== null);
  const cheapest = available.length ? Math.min(...available.map((q) => q.priceCents!)) : null;
  const fastest = available.filter((q) => q.transitMaxDays !== null).sort((a, b) => a.transitMaxDays! - b.transitMaxDays!)[0];
  const chosen = available.find((q) => q.serviceId === serviceId) ?? null;

  async function next() {
    setNotice(null);
    setBusy(true);
    try {
      if (step === 0) {
        const r = await checkStepAction("addresses", { from, to });
        if (!r.ok) return setErrors(r.fields);
      }
      if (step === 1) {
        const r = await checkStepAction("package", pkg);
        if (!r.ok) return setErrors(r.fields);
        setTotalOz(r.totalOz!);
        const q = await quoteAction(r.totalOz!);
        if (!q.ok) return setNotice(q.error);
        setQuotes(q.quotes);
        setBalance(q.balanceCents);
        const firstOk = q.quotes.find((x) => x.available);
        setServiceId((prev) => (q.quotes.some((x) => x.serviceId === prev && x.available) ? prev : (firstOk?.serviceId ?? null)));
      }
      if (step === 2 && !chosen) return setNotice("Choose a service to continue.");
      setErrors({});
      setStep((s) => s + 1);
    } finally {
      setBusy(false);
    }
  }

  async function buy() {
    if (!chosen) return;
    setBusy(true);
    setNotice(null);
    const r = await purchaseAction({ from, to, pkg, serviceId: chosen.serviceId, expectedPriceCents: chosen.priceCents, idempotencyKey: key });
    setBusy(false);
    if (r.ok) {
      setResult({ id: r.id! });
      setStep(4);
      return;
    }
    if (r.newPriceCents !== undefined) {
      setQuotes((qs) => (qs ?? []).map((q) => (q.serviceId === chosen.serviceId ? { ...q, priceCents: r.newPriceCents! } : q)));
    }
    setNotice(r.error);
  }

  function restart() {
    setStep(0); setTo(EMPTY); setPkg({ weightLb: "", weightOz: "", lengthIn: "", widthIn: "", heightIn: "", reference: "" });
    setQuotes(null); setServiceId(null); setResult(null); setErrors({}); setNotice(null); setKey(crypto.randomUUID());
  }

  const weightText = totalOz >= 16 ? `${Math.floor(totalOz / 16)} lb${totalOz % 16 ? ` ${totalOz % 16} oz` : ""}` : `${totalOz} oz`;

  return (
    <div className="grid gap-6">
      <ol aria-label="Progress" className="grid grid-cols-5 gap-2">
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined} className="min-w-0">
            <div className={cn("h-1 rounded-full", i < step ? "bg-nova" : i === step ? "bg-nova/60" : "bg-line-strong")} />
            <p className={cn("mt-2 truncate text-[0.8125rem]", i === step ? "font-semibold text-ink" : "text-ink-muted")}>
              <span className="sr-only">Step {i + 1} of {STEPS.length}: </span>
              {s}
              {i < step ? <span className="sr-only"> (done)</span> : null}
            </p>
          </li>
        ))}
      </ol>

      <section aria-labelledby="step-h" className="rounded-panel border border-line bg-surface p-5 sm:p-8">
        <h2 id="step-h" ref={headingRef} tabIndex={-1} className="mb-6 text-h3 font-semibold outline-none">
          {["Where is it going?", "What are you sending?", "Choose a service", "Review and create", "Your label is ready"][step]}
        </h2>
        <div aria-live="polite">{notice ? <Alert tone="danger" className="mb-6">{notice}</Alert> : null}</div>

        {step === 0 ? (
          <div className="grid gap-10">
            <AddressFields side="to" title="Ship to" value={to} onChange={setTo} errors={errors} />
            <AddressFields side="from" title="Ship from" value={from} onChange={setFrom} errors={errors} />
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-6">
            <fieldset className="grid grid-cols-2 gap-4 sm:max-w-[360px]">
              <legend className="mb-3 font-semibold">Weight</legend>
              <Field label="Pounds" inputMode="numeric" value={pkg.weightLb} onChange={(e) => setPkg({ ...pkg, weightLb: e.target.value })} error={errors.weightLb} />
              <Field label="Ounces" inputMode="numeric" value={pkg.weightOz} onChange={(e) => setPkg({ ...pkg, weightOz: e.target.value })} error={errors.weightOz} />
            </fieldset>
            <fieldset className="grid grid-cols-3 gap-4 sm:max-w-[480px]">
              <legend className="mb-3 font-semibold">Dimensions <span className="font-normal text-ink-muted">(inches, optional)</span></legend>
              <Field label="Length" inputMode="numeric" value={pkg.lengthIn} onChange={(e) => setPkg({ ...pkg, lengthIn: e.target.value })} error={errors.lengthIn} />
              <Field label="Width" inputMode="numeric" value={pkg.widthIn} onChange={(e) => setPkg({ ...pkg, widthIn: e.target.value })} error={errors.widthIn} />
              <Field label="Height" inputMode="numeric" value={pkg.heightIn} onChange={(e) => setPkg({ ...pkg, heightIn: e.target.value })} error={errors.heightIn} />
            </fieldset>
            <Field label="Your reference" optional value={pkg.reference} onChange={(e) => setPkg({ ...pkg, reference: e.target.value })} error={errors.reference} hint="An order number, printed on the label." className="sm:max-w-[360px]" />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-3" role="radiogroup" aria-label="Services">
            {(quotes ?? []).length === 0 || available.length === 0 ? (
              <Alert tone="info">No service has a price for a {weightText} parcel yet. <a className="underline" href={whatsappLink("pricing")} target="_blank" rel="noopener noreferrer">Ask the team</a>.</Alert>
            ) : null}
            {(quotes ?? []).map((q) => {
              const on = q.serviceId === serviceId;
              return (
                <label
                  key={q.serviceId}
                  className={cn(
                    "flex items-center justify-between gap-4 rounded-menu border p-4 transition-colors",
                    q.available ? "cursor-pointer hover:border-nova" : "cursor-not-allowed bg-paper",
                    on ? "border-nova ring-2 ring-nova/20" : "border-line-strong",
                  )}
                >
                  <span className="flex items-start gap-3">
                    <input type="radio" name="service" value={q.serviceId} checked={on} disabled={!q.available} onChange={() => setServiceId(q.serviceId)} className="mt-1 size-4 accent-[var(--color-nova)]" />
                    <span>
                      <span className="flex flex-wrap items-center gap-2 font-semibold">
                        {q.carrierName} {q.serviceName}
                        {q.available && q.priceCents === cheapest ? <Badge tone="success">Best value</Badge> : null}
                        {q.available && fastest && q.serviceId === fastest.serviceId && available.length > 1 ? <Badge tone="info">Fastest</Badge> : null}
                        {q.kind === "label_only" ? <Badge tone="accent">Label only · no postage</Badge> : null}
                      </span>
                      <span className="block text-[0.875rem] text-ink-muted">
                        {q.available ? (q.transitMinDays !== null ? `${q.transitMinDays}–${q.transitMaxDays ?? q.transitMinDays} days` : "Delivery time not set") : q.unavailableReason}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-[1.125rem] font-semibold tabular-nums">{q.available && q.priceCents !== null ? formatCents(q.priceCents) : "—"}</span>
                </label>
              );
            })}
          </div>
        ) : null}

        {step === 3 && chosen ? (
          <div className="grid gap-6">
            <dl className="grid gap-4 text-[0.9375rem] sm:grid-cols-2">
              {[
                ["Ship to", [to.name, to.company, to.line1, to.line2, `${to.city}, ${to.state} ${to.postalCode}`, to.country].filter(Boolean).join("\n")],
                ["Ship from", [from.name, from.company, from.line1, from.line2, `${from.city}, ${from.state} ${from.postalCode}`, from.country].filter(Boolean).join("\n")],
                ["Package", `${weightText}${pkg.lengthIn ? ` · ${pkg.lengthIn} × ${pkg.widthIn} × ${pkg.heightIn} in` : ""}${pkg.reference ? ` · Ref ${pkg.reference}` : ""}`],
                ["Service", `${chosen.carrierName} ${chosen.serviceName}${chosen.kind === "label_only" ? " (label only, no carrier postage)" : ""}`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-menu bg-paper p-4">
                  <dt className="text-[0.8125rem] font-medium text-ink-muted">{k}</dt>
                  <dd className="mt-1 whitespace-pre-line">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="grid gap-2 rounded-menu border border-line p-4 text-[0.9375rem] sm:max-w-[420px]">
              <div className="flex justify-between"><span>Label price</span><span className="font-semibold tabular-nums">{formatCents(chosen.priceCents!)}</span></div>
              <div className="flex justify-between text-ink-muted"><span>Wallet balance</span><span className="tabular-nums">{formatCents(balance)}</span></div>
              <div className="flex justify-between border-t border-line pt-2"><span>Balance after</span><span className="tabular-nums">{formatCents(balance - chosen.priceCents!)}</span></div>
            </div>
            {balance < chosen.priceCents! ? (
              <Alert tone="danger">
                Your balance isn't enough for this label.{" "}
                <a className="underline" href={whatsappLink("general")} target="_blank" rel="noopener noreferrer">Request a top-up on WhatsApp</a>.
              </Alert>
            ) : null}
          </div>
        ) : null}

        {step === 4 && result ? (
          <div className="grid gap-6">
            <Alert tone="success">Label created and {chosen ? formatCents(chosen.priceCents!) : "the price"} was charged to your wallet.</Alert>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={`/api/labels/${result.id}?format=4x6`} target="_blank" variant="accent">Download 4 × 6 label (PDF)</ButtonLink>
              <ButtonLink href={`/app/shipments/${result.id}`} variant="secondary">View shipment</ButtonLink>
            </div>
            <div>
              <p className="text-[0.875rem] font-medium text-ink-muted">Other formats</p>
              <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                {FORMATS.slice(1).map((f) => (
                  <li key={f.id}><a className="text-nova underline underline-offset-4" href={`/api/labels/${result.id}?format=${f.id}`} target="_blank" rel="noopener">{f.label}</a></li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-line pt-6">
          {step > 0 && step < 4 ? <Button variant="ghost" onClick={() => { setNotice(null); setStep((s) => s - 1); }} disabled={busy}>Back</Button> : <span />}
          {step < 3 ? <Button variant="accent" onClick={next} disabled={busy}>{busy ? "Checking…" : "Continue"}</Button> : null}
          {step === 3 ? (
            <Button variant="accent" onClick={buy} disabled={busy || !chosen || balance < (chosen?.priceCents ?? Infinity)}>
              {busy ? "Creating label…" : `Create label · ${chosen ? formatCents(chosen.priceCents!) : ""}`}
            </Button>
          ) : null}
          {step === 4 ? <Button variant="secondary" onClick={restart}>Create another label</Button> : null}
        </div>
      </section>
      {step === 0 ? <p className="text-[0.875rem] text-ink-muted">Need carrier postage (USPS, UPS, FedEx)? It becomes available once a carrier partner is connected. <Link href="/carriers" className="underline">Why</Link></p> : null}
    </div>
  );
}
