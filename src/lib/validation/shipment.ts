import { z } from "zod";

const text = (label: string, max: number) => z.string().trim().min(1, `Enter the ${label}.`).max(max, `Keep the ${label} under ${max} characters.`);
const optional = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);

export const US_STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR VI GU AS MP AA AE AP".split(" ");

export const addressSchema = z
  .object({
    name: text("name", 80),
    company: optional(80),
    line1: text("street address", 100),
    line2: optional(100),
    city: text("city", 60),
    state: z.string().trim().toUpperCase().min(1, "Enter the state or region.").max(40),
    postalCode: z.string().trim().toUpperCase().min(1, "Enter the ZIP or postal code.").max(12),
    country: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "Use a 2-letter country code, like US.").default("US"),
    phone: optional(30),
  })
  .superRefine((a, ctx) => {
    if (a.country === "US") {
      if (!US_STATES.includes(a.state)) ctx.addIssue({ code: "custom", path: ["state"], message: "Use a 2-letter US state code, like TX." });
      if (!/^\d{5}(-\d{4})?$/.test(a.postalCode)) ctx.addIssue({ code: "custom", path: ["postalCode"], message: "Use a 5-digit ZIP, like 78704, or ZIP+4." });
    }
  });
export type AddressInput = z.input<typeof addressSchema>;

const int = (label: string, min: number, max: number) =>
  z.coerce.number({ error: `Enter the ${label}.` }).int(`Use a whole number for the ${label}.`).min(min, `The ${label} must be at least ${min}.`).max(max, `The ${label} must be at most ${max}.`);

export const packageSchema = z
  .object({
    weightLb: z.union([z.literal(""), int("pounds", 0, 150)]).optional().transform((v) => (v === "" || v === undefined ? 0 : v)),
    weightOz: z.union([z.literal(""), int("ounces", 0, 15)]).optional().transform((v) => (v === "" || v === undefined ? 0 : v)),
    lengthIn: z.union([z.literal(""), int("length", 1, 108)]).optional().transform((v) => (v === "" || v === undefined ? null : v)),
    widthIn: z.union([z.literal(""), int("width", 1, 108)]).optional().transform((v) => (v === "" || v === undefined ? null : v)),
    heightIn: z.union([z.literal(""), int("height", 1, 108)]).optional().transform((v) => (v === "" || v === undefined ? null : v)),
    reference: optional(40),
  })
  .transform((p) => ({ ...p, totalOz: p.weightLb * 16 + p.weightOz }))
  .superRefine((p, ctx) => {
    if (p.totalOz < 1) ctx.addIssue({ code: "custom", path: ["weightOz"], message: "Enter a weight of at least 1 oz." });
    if (p.totalOz > 2400) ctx.addIssue({ code: "custom", path: ["weightLb"], message: "The maximum weight is 150 lb." });
    const dims = [p.lengthIn, p.widthIn, p.heightIn];
    if (dims.some((d) => d !== null) && dims.some((d) => d === null)) ctx.addIssue({ code: "custom", path: ["lengthIn"], message: "Enter all three dimensions, or none." });
  });
