"use client";

import { useState, type ReactNode } from "react";
import { ShippingLabel } from "@/components/label/shipping-label";
import { sampleLabel } from "@/components/label/sample-data";
import type { LabelData, LabelRegion } from "@/components/label/types";
import { Container } from "@/components/ui/container";
import { Field, type FieldProps } from "@/components/ui/field";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/cn";

const services = [
  { name: "Priority 2-Day", code: "P2" },
  { name: "Ground Saver", code: "G5" },
  { name: "Overnight", code: "O1" },
] as const;

const ZIP_PATTERN = /^\d{5}(-\d{4})?$/;

function newTrackingNumber() {
  const digits = Array.from({ length: 14 }, () => Math.floor(Math.random() * 10)).join("");
  return `LN ${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12)}`;
}

export function LabelStudio() {
  const [data, setData] = useState<LabelData>(sampleLabel);
  const [active, setActive] = useState<LabelRegion | null>(null);

  const setRecipient = (patch: Partial<LabelData["recipient"]>) =>
    setData((d) => ({ ...d, recipient: { ...d.recipient, ...patch } }));

  const zipError =
    data.recipient.postalCode.length > 0 && !ZIP_PATTERN.test(data.recipient.postalCode)
      ? "Use a 5-digit ZIP, like 78704, or ZIP+4, like 78704-1234."
      : data.recipient.postalCode.length === 0
        ? "ZIP code is required to print this label."
        : null;

  return (
    <section id="platform" aria-labelledby="studio-title" className="border-y border-line bg-surface py-24 lg:py-32">
      <Container>
        <SectionHeader
          id="studio-title"
          title={"Type on the left. Print\u2011ready on the right."}
          intro="Every field in a template is bound to your data. Change it and the label redraws instantly, barcode included — the same layout that lands in your PDF."
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_minmax(0,400px)] lg:gap-16">
          <form
            className="grid content-start gap-8"
            onSubmit={(e) => e.preventDefault()}
            aria-label="Try the label editor"
          >
            <FieldGroup legend="Ship to" region="recipient" active={active} onActive={setActive}>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Full name" value={data.recipient.name} onChange={(v) => setRecipient({ name: v })} />
                <TextField
                  label="Company"
                  optional
                  value={data.recipient.company ?? ""}
                  onChange={(v) => setRecipient({ company: v })}
                />
                <TextField
                  className="sm:col-span-2"
                  label="Street address"
                  value={data.recipient.line1}
                  onChange={(v) => setRecipient({ line1: v })}
                />
                <TextField label="City" value={data.recipient.city} onChange={(v) => setRecipient({ city: v })} />
                <div className="grid grid-cols-[5rem_1fr] gap-4">
                  <TextField
                    label="State"
                    value={data.recipient.state}
                    maxLength={2}
                    onChange={(v) => setRecipient({ state: v.toUpperCase() })}
                  />
                  <TextField
                    label="ZIP"
                    inputMode="numeric"
                    value={data.recipient.postalCode}
                    error={zipError}
                    onChange={(v) => setRecipient({ postalCode: v })}
                  />
                </div>
              </div>
            </FieldGroup>

            <div className="grid gap-8 sm:grid-cols-2">
              <FieldGroup legend="Service" region="service" active={active} onActive={setActive}>
                <div className="grid gap-2" role="radiogroup" aria-label="Service level">
                  {services.map((s) => {
                    const checked = data.service === s.name;
                    return (
                      <label
                        key={s.code}
                        className={cn(
                          "flex cursor-pointer items-center justify-between rounded-control border px-3.5 py-2.5 text-[0.9375rem] transition-colors",
                          checked ? "border-nova bg-nova-soft" : "border-line-strong hover:border-ink/40",
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="service"
                            className="accent-[var(--nova)]"
                            checked={checked}
                            onChange={() => setData((d) => ({ ...d, service: s.name, serviceCode: s.code }))}
                          />
                          {s.name}
                        </span>
                        <span className="font-mono text-[0.8125rem] text-ink-muted">{s.code}</span>
                      </label>
                    );
                  })}
                </div>
              </FieldGroup>

              <div className="grid content-start gap-8">
                <FieldGroup legend="Package" region="package" active={active} onActive={setActive}>
                  <TextField
                    label="Weight"
                    value={data.weight}
                    onChange={(v) => setData((d) => ({ ...d, weight: v }))}
                  />
                </FieldGroup>
                <FieldGroup legend="Tracking" region="barcode" active={active} onActive={setActive}>
                  <div className="flex items-center justify-between gap-3 rounded-control border border-line-strong px-3.5 py-2.5">
                    <span className="truncate font-mono text-[0.875rem]">{data.trackingNumber}</span>
                    <button
                      type="button"
                      className="shrink-0 text-[0.875rem] font-medium text-nova hover:text-nova-strong"
                      onClick={() => setData((d) => ({ ...d, trackingNumber: newTrackingNumber() }))}
                    >
                      Generate new
                    </button>
                  </div>
                </FieldGroup>
              </div>
            </div>
          </form>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <ShippingLabel data={data} highlight={active} onHighlightChange={setActive} />
            <p className="mt-4 text-center text-[0.8125rem] text-ink-faint" aria-live="polite">
              {zipError ? "Fix the ZIP code to enable printing." : "Ready to print at 4 × 6 in."}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function FieldGroup({
  legend,
  region,
  active,
  onActive,
  children,
}: {
  legend: string;
  region: LabelRegion;
  active: LabelRegion | null;
  onActive: (r: LabelRegion | null) => void;
  children: ReactNode;
}) {
  return (
    <fieldset
      onFocus={() => onActive(region)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onActive(null);
      }}
      onPointerEnter={() => onActive(region)}
      onPointerLeave={() => onActive(null)}
      className={cn(
        "relative rounded-menu pl-4 transition-[box-shadow] duration-150",
        "before:absolute before:inset-y-0 before:left-0 before:w-[2px] before:rounded-full before:transition-colors",
        active === region ? "before:bg-nova" : "before:bg-line",
      )}
    >
      <legend className="mb-3 text-[0.9375rem] font-semibold">{legend}</legend>
      {children}
    </fieldset>
  );
}

/** Adapts the shared Field to a value-only onChange for this demo form. */
function TextField({ onChange, ...props }: Omit<FieldProps, "onChange"> & { onChange: (v: string) => void }) {
  return <Field {...props} onChange={(e) => onChange(e.target.value)} />;
}
