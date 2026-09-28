"use server";

import { ZodError } from "zod";
import { fieldErrors } from "@/lib/validation/auth";
import { addressSchema, packageSchema } from "@/lib/validation/shipment";
import { runAction, type ActionResult } from "@/server/actions/run";
import { getActor } from "@/server/auth/session";
import { PriceChangedError, purchaseLabel, quoteForActor, type PublicQuote } from "@/server/services/labels";
import { walletBalance } from "@/server/services/wallet";

type Check = { ok: true; totalOz?: number } | { ok: false; fields: Record<string, string> };

/** Same schemas the purchase uses, so step-by-step checks can never disagree with the final one. */
export async function checkStepAction(step: "addresses" | "package", data: Record<string, unknown>): Promise<Check> {
  if (!(await getActor())) return { ok: false, fields: { _: "Your session has ended. Sign in again." } };
  try {
    if (step === "addresses") {
      const errs: Record<string, string> = {};
      for (const side of ["from", "to"] as const) {
        const r = addressSchema.safeParse(data[side] ?? {});
        if (!r.success) for (const [k, v] of Object.entries(fieldErrors(r.error))) errs[`${side}.${k}`] = v;
      }
      return Object.keys(errs).length ? { ok: false, fields: errs } : { ok: true };
    }
    const p = packageSchema.parse(data);
    return { ok: true, totalOz: p.totalOz };
  } catch (e) {
    if (e instanceof ZodError) return { ok: false, fields: fieldErrors(e) };
    throw e;
  }
}

export async function quoteAction(weightOz: number): Promise<{ ok: true; quotes: PublicQuote[]; balanceCents: number } | { ok: false; error: string }> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Your session has ended. Sign in again." };
  try {
    const [quotes, balanceCents] = await Promise.all([quoteForActor(actor, weightOz), walletBalance(actor)]);
    return { ok: true, quotes, balanceCents };
  } catch {
    return { ok: false, error: "We couldn't load services. Try again." };
  }
}

export async function purchaseAction(input: Record<string, unknown>): Promise<ActionResult & { newPriceCents?: number }> {
  let newPrice: number | undefined;
  const r = await runAction(async (actor, meta) => {
    try {
      const out = await purchaseLabel(actor, input as never, meta);
      return { id: out.id, message: out.duplicate ? "This label was already created." : undefined };
    } catch (e) {
      if (e instanceof PriceChangedError) newPrice = e.newPriceCents;
      throw e;
    }
  }, ["/app"]);
  return newPrice !== undefined ? { ...r, newPriceCents: newPrice } : r;
}
