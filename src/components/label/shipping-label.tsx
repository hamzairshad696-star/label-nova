"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Barcode } from "./barcode";
import { regionBindings, type Address, type LabelData, type LabelRegion } from "./types";

interface ShippingLabelProps {
  data: LabelData;
  /** Controlled highlight. Leave undefined to let the label manage hover itself. */
  highlight?: LabelRegion | null;
  onHighlightChange?: (region: LabelRegion | null) => void;
  /** Show the template placeholder chip on the highlighted region. */
  showBindings?: boolean;
  /** Play the print-feed sequence (hero only). */
  printing?: boolean;
  className?: string;
}

/**
 * A 4×6 in label rendered with container-query units, so every measurement
 * scales with the label's width exactly like the printed page does.
 * 1cqw = 1% of label width ≈ 1.016 mm on a 4 in label.
 */
export function ShippingLabel({
  data,
  highlight,
  onHighlightChange,
  showBindings = true,
  printing = false,
  className,
}: ShippingLabelProps) {
  const [internal, setInternal] = useState<LabelRegion | null>(null);
  const active = highlight !== undefined ? highlight : internal;
  const setActive = (r: LabelRegion | null) => {
    if (highlight === undefined) setInternal(r);
    onHighlightChange?.(r);
  };

  let order = 0;
  const region = (key: LabelRegion, children: ReactNode, extra?: string) => {
    const delay = printing ? 900 + order++ * 110 : 0;
    const isActive = active === key;
    return (
      <div
        data-region={key}
        onPointerEnter={() => setActive(key)}
        onPointerLeave={() => setActive(null)}
        className={cn(
          "relative transition-[background-color,box-shadow] duration-150",
          isActive && "bg-nova-soft shadow-[0_0_0_0.5cqw_var(--nova)]",
          printing && "animate-ink",
          extra,
        )}
        style={printing ? ({ animationDelay: `${delay}ms` } as CSSProperties) : undefined}
      >
        {children}
        {showBindings && isActive ? (
          <span className="pointer-events-none absolute -top-[4.2cqw] right-[1cqw] z-10 rounded-[1cqw] bg-nova px-[1.6cqw] py-[0.5cqw] font-mono text-[2.3cqw] leading-none font-medium whitespace-nowrap text-white">
            {regionBindings[key]}
          </span>
        ) : null}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "@container relative aspect-[2/3] w-full rounded-paper bg-surface text-ink shadow-lift select-none",
        className,
      )}
      role="img"
      aria-label={`Shipping label from ${data.sender.name} to ${data.recipient.name}, ${data.service}, tracking ${data.trackingNumber}`}
    >
      <div aria-hidden="true" className="absolute inset-[3.5cqw] flex flex-col border-[0.5cqw] border-ink">
        {/* Header: merchant mark + service */}
        <div className="flex border-b-[0.5cqw] border-ink">
          {region(
            "logo",
            <div className="flex h-full items-center gap-[2cqw] px-[3cqw] py-[3cqw]">
              <BrandMark />
              <span className="text-[3.6cqw] leading-tight font-bold tracking-[-0.01em]">{data.brand}</span>
            </div>,
            "flex-1",
          )}
          {region(
            "service",
            <div className="flex h-full flex-col items-center justify-center bg-ink px-[3.5cqw] py-[2cqw] text-white">
              <span className="text-[9cqw] leading-none font-extrabold tracking-[-0.04em]">{data.serviceCode}</span>
              <span className="mt-[0.8cqw] text-[2.3cqw] font-semibold whitespace-nowrap">{data.service}</span>
            </div>,
            "w-[30cqw]",
          )}
        </div>

        {/* Sender */}
        {region(
          "sender",
          <div className="px-[3cqw] py-[2.5cqw]">
            <FieldCaption>From</FieldCaption>
            <AddressLines address={data.sender} size="sm" />
          </div>,
          "border-b-[0.25cqw] border-ink",
        )}

        {/* Recipient */}
        {region(
          "recipient",
          <div className="px-[3cqw] pt-[3cqw] pb-[3.5cqw]">
            <FieldCaption>Ship to</FieldCaption>
            <AddressLines address={data.recipient} size="lg" />
          </div>,
          "border-b-[0.5cqw] border-ink",
        )}

        {/* Package row */}
        {region(
          "package",
          <div className="grid grid-cols-3 divide-x-[0.25cqw] divide-ink">
            <PackageCell label="Weight" value={data.weight} />
            <PackageCell label="Dimensions" value={data.dimensions} />
            <PackageCell label="Ship date" value={data.shipDate} />
          </div>,
          "border-b-[0.5cqw] border-ink",
        )}

        {/* Barcode + tracking */}
        {region(
          "barcode",
          <div className="flex flex-col px-[4cqw] pt-[3.5cqw] pb-[2.5cqw]">
            <FieldCaption>Tracking</FieldCaption>
            <Barcode value={data.trackingNumber.replace(/\s+/g, "")} className="mt-[1cqw] h-[20cqw]" />
            <span className="mt-[1.6cqw] text-center font-mono text-[3.6cqw] font-semibold tracking-[0.06em]">
              {data.trackingNumber}
            </span>
          </div>,
          "flex-1",
        )}

        {/* Reference footer */}
        {region(
          "reference",
          <div className="flex items-center justify-between px-[3cqw] py-[1.8cqw] text-[2.4cqw]">
            <span>
              Order <span className="font-mono font-semibold">{data.reference}</span>
            </span>
            <span className="text-ink-muted">4 × 6 in</span>
          </div>,
          "border-t-[0.25cqw] border-ink",
        )}
      </div>
    </div>
  );
}

function FieldCaption({ children }: { children: ReactNode }) {
  return <p className="mb-[0.8cqw] text-[2.2cqw] font-bold tracking-[0.04em] text-ink-muted uppercase">{children}</p>;
}

function AddressLines({ address, size }: { address: Address; size: "sm" | "lg" }) {
  const lg = size === "lg";
  return (
    <div className={cn("leading-[1.22]", lg ? "text-[4.4cqw]" : "text-[2.9cqw]")}>
      <p className={cn("truncate font-bold", lg && "text-[5.2cqw] tracking-[-0.01em]")}>{address.name || "\u00a0"}</p>
      {address.company ? <p className="truncate">{address.company}</p> : null}
      <p className="truncate">{address.line1 || "\u00a0"}</p>
      {address.line2 ? <p className="truncate">{address.line2}</p> : null}
      <p className={cn("truncate", lg && "font-semibold")}>
        {[address.city, address.state].filter(Boolean).join(", ")} {address.postalCode}
        {address.country ? ` ${address.country}` : ""}
      </p>
    </div>
  );
}

function PackageCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-[2.5cqw] py-[2cqw]">
      <p className="text-[2cqw] font-bold tracking-[0.04em] text-ink-muted uppercase">{label}</p>
      <p className="mt-[0.4cqw] truncate text-[3cqw] font-semibold">{value || "\u2014"}</p>
    </div>
  );
}

/** Fictional merchant mark for demo labels. */
function BrandMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[7cqw] shrink-0" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path d="M12 5l4.5 8h-3v6h-3v-6h-3z" fill="var(--surface)" />
    </svg>
  );
}
