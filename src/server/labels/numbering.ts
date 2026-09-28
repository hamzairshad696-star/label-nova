import { sql } from "drizzle-orm";
import type { db } from "@/server/db/client";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * How a new label gets its number. Today there is one allocator: the global Label Nova series ("LN…").
 *
 * EXTENSION POINT — multiple number series (specified separately; not implemented yet).
 * The purchase flow only ever calls `allocatorFor(ctx).allocate(tx, ctx)` inside its transaction and stores the
 * result in shipments.label_number. A series feature plugs in here without touching the purchase flow:
 *
 *  - Several series, each with its own prefix/format, e.g. a "9302…" series alongside "LN…". Selection by
 *    account, service or admin setting happens in `allocatorFor`.
 *  - Series state (next value, ranges, active flag) belongs in its own table and must be advanced inside the
 *    same transaction as the purchase (row lock or sequence), so a failed purchase never burns or reuses a number.
 *  - Historical numbers: imported numbers are inserted as ordinary rows; allocators must skip values already used.
 *  - Duplicate prevention across ALL series is already enforced by the unique index on shipments.label_number,
 *    so two series can never issue the same number even if their ranges were misconfigured to overlap.
 *  - `isValidLabelNumber` is LN-specific; each series should bring its own validator.
 *
 * Carrier-number rule: numbers that follow a carrier's own format or ranges (for example USPS IMpb numbers
 * beginning 92/93/94/95) must only ever come from that carrier or an authorised partner, on carrier_postage
 * labels. Label-only labels must never carry a number a carrier would recognise as its own.
 */
export interface NumberingContext {
  ownerUserId: string;
  serviceId: string;
}

export interface LabelNumberAllocator {
  readonly id: string;
  allocate(tx: Tx, ctx: NumberingContext): Promise<string>;
}

/** Luhn (mod 10) check digit over a digit string. Catches single-digit typos and most transpositions. */
export function luhnCheckDigit(digits: string): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (10 - (sum % 10)) % 10;
}

/** "LN" + 9-digit sequence + check digit, e.g. LN0000000017. */
export function formatLabelNumber(sequence: number): string {
  if (!Number.isSafeInteger(sequence) || sequence < 1 || sequence > 999_999_999) throw new Error("Label sequence out of range.");
  const body = String(sequence).padStart(9, "0");
  return `LN${body}${luhnCheckDigit(body)}`;
}

export function isValidLabelNumber(value: string): boolean {
  const m = /^LN(\d{9})(\d)$/.exec(value);
  return m !== null && luhnCheckDigit(m[1]!) === Number(m[2]);
}

export const defaultSeries: LabelNumberAllocator = {
  id: "label_nova_default",
  async allocate(tx) {
    const r = await tx.execute<{ n: string }>(sql`select nextval('label_number_seq')::text as n`);
    return formatLabelNumber(Number(r.rows[0]!.n));
  },
};

export function allocatorFor(_ctx: NumberingContext): LabelNumberAllocator {
  return defaultSeries;
}
