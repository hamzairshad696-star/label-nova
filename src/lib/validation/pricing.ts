import { z } from "zod";

/** "8.49" / "8" / "8.5" → 849 / 800 / 850. Integer maths only; rejects negatives, >2 decimals, and absurd values. */
export function parseMoney(input: unknown): number | null {
  if (typeof input !== "string" && typeof input !== "number") return null;
  const s = String(input).trim().replace(/^\$/, "");
  const m = /^(\d{1,6})(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0"));
}

function moneyIssue(v: unknown, label: string, ctx: z.RefinementCtx, allowZero: boolean): number | typeof z.NEVER {
  const cents = parseMoney(v);
  if (cents === null) {
    ctx.addIssue({ code: "custom", message: `Enter the ${label} as an amount like 8.49.` });
    return z.NEVER;
  }
  if (!allowZero && cents === 0) {
    ctx.addIssue({ code: "custom", message: `The ${label} must be more than $0.00.` });
    return z.NEVER;
  }
  return cents;
}

/** Required amount in cents, greater than zero. */
const money = (label: string) =>
  z.union([z.string(), z.number()]).optional().transform((v, ctx): number => {
    if (v === undefined || v === "") {
      ctx.addIssue({ code: "custom", message: `Enter the ${label}.` });
      return z.NEVER;
    }
    return moneyIssue(v, label, ctx, false);
  });

/** Optional amount in cents (zero allowed); empty → null. */
const optionalMoney = (label: string) =>
  z.union([z.string(), z.number()]).optional().transform((v, ctx): number | null => (v === undefined || v === "" ? null : moneyIssue(v, label, ctx, true)));

const int = (label: string, min: number, max: number) =>
  z.coerce.number({ error: `Enter the ${label}.` }).int(`Use a whole number for the ${label}.`).min(min, `The ${label} must be at least ${min}.`).max(max, `The ${label} must be at most ${max}.`);

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9_-]{1,39}$/, "Use 2–40 lowercase letters, numbers, dashes or underscores.");

export const carrierSchema = z.object({
  key: slug,
  name: z.string().trim().min(1, "Enter a name.").max(60, "Keep the name under 60 characters."),
});

export const serviceSchema = z
  .object({
    carrierId: z.uuid("Choose a carrier."),
    key: slug,
    name: z.string().trim().min(1, "Enter a name.").max(80, "Keep the name under 80 characters."),
    kind: z.enum(["carrier_postage", "label_only"], { error: "Choose the service type." }),
    transitMinDays: z.union([z.literal(""), int("minimum days", 0, 60)]).optional().transform((v) => (v === "" || v === undefined ? null : v)),
    transitMaxDays: z.union([z.literal(""), int("maximum days", 0, 60)]).optional().transform((v) => (v === "" || v === undefined ? null : v)),
  })
  .refine((v) => v.transitMinDays === null || v.transitMaxDays === null || v.transitMaxDays >= v.transitMinDays, {
    path: ["transitMaxDays"],
    message: "Maximum days can't be less than minimum days.",
  });

export const ruleSchema = z
  .object({
    serviceId: z.uuid("Choose a service."),
    weightMinOz: int("minimum weight", 1, 2400),
    weightMaxOz: int("maximum weight", 1, 2400),
    zone: z.union([z.literal(""), int("zone", 1, 9)]).optional().transform((v) => (v === "" || v === undefined ? null : v)),
    cost: optionalMoney("carrier cost"),
    customer: money("customer price"),
    dealer: money("dealer price"),
    reseller: money("reseller price"),
  })
  .refine((v) => v.weightMaxOz >= v.weightMinOz, { path: ["weightMaxOz"], message: "Maximum weight can't be less than minimum weight." });

export type RuleInput = z.input<typeof ruleSchema>;
