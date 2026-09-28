import "server-only";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { addressSchema, packageSchema } from "@/lib/validation/shipment";
import { assertPermission, type Actor } from "@/server/auth/permissions";
import { db } from "@/server/db/client";
import { auditLogs, carrierServices, carriers, shipmentEvents, shipments } from "@/server/db/schema";
import { allocatorFor } from "@/server/labels/numbering";
import { unprintableChars } from "@/server/labels/fonts";
import type { LabelData } from "@/server/labels/render";
import { AccountError } from "./accounts";
import { quotesFor, type Quote } from "./pricing";
import { shipmentScope } from "./shipments";
import { chargeLabelInTx, InsufficientFundsError } from "./wallet";

/** What the browser may see about a quote: never the cost, other tiers, or rule internals. */
export type PublicQuote = Pick<Quote, "serviceId" | "serviceName" | "carrierName" | "kind" | "transitMinDays" | "transitMaxDays" | "priceCents" | "available" | "unavailableReason">;
const toPublic = (q: Quote): PublicQuote => ({
  serviceId: q.serviceId, serviceName: q.serviceName, carrierName: q.carrierName, kind: q.kind,
  transitMinDays: q.transitMinDays, transitMaxDays: q.transitMaxDays, priceCents: q.available ? q.priceCents : null,
  available: q.available, unavailableReason: q.unavailableReason,
});

export async function quoteForActor(actor: Actor, weightOz: number): Promise<PublicQuote[]> {
  assertPermission(actor, "labels.create");
  if (!Number.isInteger(weightOz) || weightOz < 1 || weightOz > 2400) throw new AccountError("Enter a weight between 1 oz and 150 lb.", "weightOz");
  return (await quotesFor(db, actor.role.key, weightOz)).map(toPublic);
}

export class PriceChangedError extends AccountError {
  constructor(readonly newPriceCents: number) {
    super("The price for this service changed since you reviewed it. Check the new price and confirm again.");
  }
}

export const purchaseSchema = z.object({
  from: addressSchema,
  to: addressSchema,
  pkg: packageSchema,
  serviceId: z.uuid("Choose a service."),
  expectedPriceCents: z.coerce.number().int().positive(),
  idempotencyKey: z.uuid("This form expired. Reload the page and start again."),
});

async function assertPrintable(fields: Record<string, string | null | undefined>) {
  for (const [path, value] of Object.entries(fields)) {
    if (!value) continue;
    const bad = await unprintableChars(value);
    if (bad.length) throw new AccountError(`These characters can't be printed on a label: ${bad.join(" ")}. Use Latin letters (A–Z, including accents).`, path);
  }
}

/**
 * Buys one label. Everything happens in one transaction: price re-checked from the rules, shipment created,
 * label number allocated, wallet charged (locked), first event recorded. Any failure leaves nothing behind.
 */
export async function purchaseLabel(actor: Actor, raw: z.input<typeof purchaseSchema>, meta: { ip?: string | null; userAgent?: string | null } = {}) {
  assertPermission(actor, "labels.create");
  const input = purchaseSchema.parse(raw);
  const { from, to, pkg } = input;
  await assertPrintable({
    "from.name": from.name, "from.company": from.company, "from.line1": from.line1, "from.line2": from.line2, "from.city": from.city,
    "to.name": to.name, "to.company": to.company, "to.line1": to.line1, "to.line2": to.line2, "to.city": to.city, "pkg.reference": pkg.reference,
  });
  const idem = `label:${actor.id}:${input.idempotencyKey}`;

  try {
    return await db.transaction(async (tx) => {
      const existing = await tx.query.shipments.findFirst({ where: eq(shipments.idempotencyKey, idem) });
      if (existing) return { id: existing.id, labelNumber: existing.labelNumber!, duplicate: true as const };

      const quote = (await quotesFor(tx, actor.role.key, pkg.totalOz)).find((q) => q.serviceId === input.serviceId);
      if (!quote) throw new AccountError("That service isn't available. Choose another.", "serviceId");
      if (quote.kind === "carrier_postage") throw new AccountError("Carrier postage needs a carrier partner connection and can't be bought yet.", "serviceId");
      if (!quote.available || quote.priceCents === null || !quote.ruleId || !quote.snapshot) throw new AccountError(quote.unavailableReason ?? "No price is set for this weight.", "serviceId");
      if (quote.priceCents !== input.expectedPriceCents) throw new PriceChangedError(quote.priceCents);

      const labelNumber = await allocatorFor({ ownerUserId: actor.id, serviceId: quote.serviceId }).allocate(tx, { ownerUserId: actor.id, serviceId: quote.serviceId });
      const now = new Date();
      const [ship] = await tx
        .insert(shipments)
        .values({
          ownerUserId: actor.id, reference: pkg.reference, status: "label_created",
          fromAddress: from, toAddress: to, weightOz: pkg.totalOz, lengthIn: pkg.lengthIn, widthIn: pkg.widthIn, heightIn: pkg.heightIn,
          // carrier / service / trackingNumber stay null: reserved for real carrier data.
          serviceId: quote.serviceId, pricingRuleId: quote.ruleId, priceSnapshot: quote.snapshot,
          priceCents: quote.priceCents, labelNumber, labelCreatedAt: now, idempotencyKey: idem,
        })
        .returning({ id: shipments.id });
      await chargeLabelInTx(tx, { userId: actor.id, amountCents: quote.priceCents, shipmentId: ship!.id, note: `Label ${labelNumber}${pkg.reference ? ` · ${pkg.reference}` : ""}`, idempotencyKey: `charge:${idem}` });
      await tx.insert(shipmentEvents).values({ shipmentId: ship!.id, status: "label_created", description: `Label ${labelNumber} created`, source: "label_nova", occurredAt: now });
      await tx.insert(auditLogs).values({
        actorUserId: actor.id, action: "label.created", targetType: "shipment", targetId: ship!.id,
        metadata: { labelNumber, serviceId: quote.serviceId, priceCents: quote.priceCents, ruleId: quote.ruleId }, ip: meta.ip ?? null, userAgent: meta.userAgent ?? null,
      });
      return { id: ship!.id, labelNumber, duplicate: false as const };
    });
  } catch (err) {
    if (err instanceof InsufficientFundsError) {
      throw new AccountError(`Your balance is $${(err.balanceCents / 100).toFixed(2)} and this label costs $${(err.neededCents / 100).toFixed(2)}. Add funds to continue.`);
    }
    throw err;
  }
}

/** One shipment, if the actor may read it. */
export async function getShipment(actor: Actor, id: string) {
  const [row] = await db
    .select({ s: shipments, serviceName: carrierServices.name, serviceKind: carrierServices.kind, carrierName: carriers.name })
    .from(shipments)
    .leftJoin(carrierServices, eq(carrierServices.id, shipments.serviceId))
    .leftJoin(carriers, eq(carriers.id, carrierServices.carrierId))
    .where(and(eq(shipments.id, id), shipmentScope(actor)))
    .limit(1);
  if (!row) return null;
  const events = await db.select().from(shipmentEvents).where(eq(shipmentEvents.shipmentId, id)).orderBy(shipmentEvents.occurredAt);
  return { ...row.s, serviceName: row.serviceName, serviceKind: row.serviceKind, carrierName: row.carrierName, events };
}

/** Everything the PDF needs, taken only from the stored shipment. */
export function labelDataFor(s: NonNullable<Awaited<ReturnType<typeof getShipment>>>): LabelData | null {
  if (!s.labelNumber || !s.fromAddress || !s.toAddress || !s.weightOz) return null;
  return {
    labelNumber: s.labelNumber, from: s.fromAddress, to: s.toAddress,
    carrierName: s.carrierName ?? "Label Nova", serviceName: s.serviceName ?? "Label",
    weightOz: s.weightOz, dims: s.lengthIn && s.widthIn && s.heightIn ? { l: s.lengthIn, w: s.widthIn, h: s.heightIn } : null,
    reference: s.reference, createdAt: s.labelCreatedAt ?? s.createdAt,
  };
}
