import "server-only";
import { and, asc, desc, eq, gte, isNull, lte, ne, or, sql } from "drizzle-orm";
import type { z } from "zod";
import { carrierSchema, ruleSchema, serviceSchema } from "@/lib/validation/pricing";
import { assertPermission, type Actor } from "@/server/auth/permissions";
import type { RoleKey } from "@/server/auth/catalog";
import { db } from "@/server/db/client";
import { carrierServices, carriers, pricingRuleChanges, pricingRules, users } from "@/server/db/schema";
import { AccountError } from "./accounts";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Rule = typeof pricingRules.$inferSelect;

/** The fields that matter for history, in a stable shape. */
function ruleSnapshot(r: Rule) {
  return {
    serviceId: r.serviceId, weightMinOz: r.weightMinOz, weightMaxOz: r.weightMaxOz, zone: r.zone,
    costCents: r.costCents, customerCents: r.customerCents, dealerCents: r.dealerCents, resellerCents: r.resellerCents, active: r.active,
  };
}

async function lockService(tx: Tx, serviceId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"pricing:" + serviceId}))`);
}

/** Active rules for the same service and zone may not have overlapping weight ranges. */
async function assertNoOverlap(tx: Tx, r: { serviceId: string; weightMinOz: number; weightMaxOz: number; zone: number | null }, excludeId?: string) {
  const clash = await tx
    .select({ id: pricingRules.id, min: pricingRules.weightMinOz, max: pricingRules.weightMaxOz })
    .from(pricingRules)
    .where(
      and(
        eq(pricingRules.serviceId, r.serviceId),
        eq(pricingRules.active, true),
        r.zone === null ? isNull(pricingRules.zone) : eq(pricingRules.zone, r.zone),
        lte(pricingRules.weightMinOz, r.weightMaxOz),
        gte(pricingRules.weightMaxOz, r.weightMinOz),
        excludeId ? ne(pricingRules.id, excludeId) : undefined,
      ),
    )
    .limit(1);
  if (clash[0]) {
    throw new AccountError(
      `This overlaps an active rule for ${clash[0].min}–${clash[0].max} oz${r.zone ? ` in zone ${r.zone}` : ""}. Adjust the weights or deactivate that rule first.`,
      "weightMinOz",
    );
  }
}

// ---------- Catalog management (admin) ----------

export async function createCarrier(actor: Actor, raw: z.input<typeof carrierSchema>) {
  assertPermission(actor, "pricing.write", "all");
  const input = carrierSchema.parse(raw);
  const taken = await db.query.carriers.findFirst({ where: eq(carriers.key, input.key) });
  if (taken) throw new AccountError("A carrier with this key already exists.", "key");
  const [row] = await db.insert(carriers).values(input).returning({ id: carriers.id });
  return row!;
}

export async function createService(actor: Actor, raw: z.input<typeof serviceSchema>) {
  assertPermission(actor, "pricing.write", "all");
  const input = serviceSchema.parse(raw);
  const carrier = await db.query.carriers.findFirst({ where: eq(carriers.id, input.carrierId) });
  if (!carrier) throw new AccountError("Choose a carrier.", "carrierId");
  const taken = await db.query.carrierServices.findFirst({ where: and(eq(carrierServices.carrierId, input.carrierId), eq(carrierServices.key, input.key)) });
  if (taken) throw new AccountError("This carrier already has a service with that key.", "key");
  const [row] = await db.insert(carrierServices).values(input).returning({ id: carrierServices.id });
  return row!;
}

export async function setServiceActive(actor: Actor, serviceId: string, active: boolean) {
  assertPermission(actor, "pricing.write", "all");
  await db.update(carrierServices).set({ active }).where(eq(carrierServices.id, serviceId));
}

export async function createRule(actor: Actor, raw: z.input<typeof ruleSchema>) {
  assertPermission(actor, "pricing.write", "all");
  const input = ruleSchema.parse(raw);
  return db.transaction(async (tx) => {
    const svc = await tx.query.carrierServices.findFirst({ where: eq(carrierServices.id, input.serviceId) });
    if (!svc) throw new AccountError("Choose a service.", "serviceId");
    await lockService(tx, input.serviceId);
    await assertNoOverlap(tx, input);
    const [rule] = await tx
      .insert(pricingRules)
      .values({
        serviceId: input.serviceId, weightMinOz: input.weightMinOz, weightMaxOz: input.weightMaxOz, zone: input.zone,
        costCents: input.cost, customerCents: input.customer, dealerCents: input.dealer, resellerCents: input.reseller,
        createdByUserId: actor.id, updatedByUserId: actor.id,
      })
      .returning();
    await tx.insert(pricingRuleChanges).values({ ruleId: rule!.id, actorUserId: actor.id, action: "created", before: null, after: ruleSnapshot(rule!) });
    return { id: rule!.id };
  });
}

export async function updateRule(actor: Actor, ruleId: string, raw: z.input<typeof ruleSchema>) {
  assertPermission(actor, "pricing.write", "all");
  const input = ruleSchema.parse(raw);
  return db.transaction(async (tx) => {
    const [current] = await tx.select().from(pricingRules).where(eq(pricingRules.id, ruleId)).for("update");
    if (!current) throw new AccountError("That rule no longer exists.");
    if (input.serviceId !== current.serviceId) throw new AccountError("A rule can't move to another service. Create a new rule instead.", "serviceId");
    await lockService(tx, current.serviceId);
    if (current.active) await assertNoOverlap(tx, input, ruleId);
    const [next] = await tx
      .update(pricingRules)
      .set({
        weightMinOz: input.weightMinOz, weightMaxOz: input.weightMaxOz, zone: input.zone, costCents: input.cost,
        customerCents: input.customer, dealerCents: input.dealer, resellerCents: input.reseller, updatedByUserId: actor.id,
      })
      .where(eq(pricingRules.id, ruleId))
      .returning();
    const before = ruleSnapshot(current), after = ruleSnapshot(next!);
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      await tx.insert(pricingRuleChanges).values({ ruleId, actorUserId: actor.id, action: "updated", before, after });
    }
    return { id: ruleId };
  });
}

export async function setRuleActive(actor: Actor, ruleId: string, active: boolean) {
  assertPermission(actor, "pricing.write", "all");
  await db.transaction(async (tx) => {
    const [current] = await tx.select().from(pricingRules).where(eq(pricingRules.id, ruleId)).for("update");
    if (!current) throw new AccountError("That rule no longer exists.");
    if (current.active === active) return;
    await lockService(tx, current.serviceId);
    if (active) await assertNoOverlap(tx, current, ruleId);
    const [next] = await tx.update(pricingRules).set({ active, updatedByUserId: actor.id }).where(eq(pricingRules.id, ruleId)).returning();
    await tx.insert(pricingRuleChanges).values({ ruleId, actorUserId: actor.id, action: active ? "activated" : "deactivated", before: ruleSnapshot(current), after: ruleSnapshot(next!) });
  });
}

export async function getCatalog(actor: Actor) {
  assertPermission(actor, "pricing.write", "all");
  const [carrierRows, serviceRows, ruleRows] = await Promise.all([
    db.select().from(carriers).orderBy(asc(carriers.name)),
    db.select().from(carrierServices).orderBy(asc(carrierServices.sortOrder), asc(carrierServices.name)),
    db.select().from(pricingRules).orderBy(asc(pricingRules.weightMinOz), asc(pricingRules.zone)),
  ]);
  return carrierRows.map((c) => ({
    ...c,
    services: serviceRows.filter((s) => s.carrierId === c.id).map((s) => ({ ...s, rules: ruleRows.filter((r) => r.serviceId === s.id) })),
  }));
}

export async function getRule(actor: Actor, ruleId: string) {
  assertPermission(actor, "pricing.write", "all");
  const rule = await db.query.pricingRules.findFirst({ where: eq(pricingRules.id, ruleId) });
  if (!rule) return null;
  const service = await db.query.carrierServices.findFirst({ where: eq(carrierServices.id, rule.serviceId) });
  return { rule, service: service! };
}

export async function listPricingChanges(actor: Actor, { ruleId, limit = 100 }: { ruleId?: string; limit?: number } = {}) {
  assertPermission(actor, "pricing.write", "all");
  return db
    .select({
      id: pricingRuleChanges.id, ruleId: pricingRuleChanges.ruleId, action: pricingRuleChanges.action,
      before: pricingRuleChanges.before, after: pricingRuleChanges.after, createdAt: pricingRuleChanges.createdAt,
      actorName: users.name, serviceName: carrierServices.name, carrierName: carriers.name,
    })
    .from(pricingRuleChanges)
    .leftJoin(users, eq(users.id, pricingRuleChanges.actorUserId))
    .innerJoin(pricingRules, eq(pricingRules.id, pricingRuleChanges.ruleId))
    .innerJoin(carrierServices, eq(carrierServices.id, pricingRules.serviceId))
    .innerJoin(carriers, eq(carriers.id, carrierServices.carrierId))
    .where(ruleId ? eq(pricingRuleChanges.ruleId, ruleId) : undefined)
    .orderBy(desc(pricingRuleChanges.createdAt))
    .limit(Math.min(Math.max(limit, 1), 500));
}

// ---------- Price lookup (used when buying a label) ----------

export type PriceTier = "customer" | "dealer" | "reseller";

export function tierFor(role: RoleKey): PriceTier | null {
  return role === "CLIENT" ? "customer" : role === "DEALER" ? "dealer" : role === "RESELLER" ? "reseller" : null;
}

export interface Quote {
  serviceId: string;
  serviceName: string;
  serviceKey: string;
  carrierName: string;
  carrierKey: string;
  kind: "carrier_postage" | "label_only";
  transitMinDays: number | null;
  transitMaxDays: number | null;
  /** Null when there's no active rule for this weight/zone, or the service can't be bought yet. */
  priceCents: number | null;
  ruleId: string | null;
  available: boolean;
  unavailableReason: string | null;
  snapshot: Record<string, unknown> | null;
}

/**
 * Every active service with the price this buyer would pay for `weightOz` (and `zone`, if known).
 * A zone-specific rule beats an "any zone" rule. Prices come only from pricing_rules — never defaults.
 */
export async function quotesFor(exec: Tx | typeof db, role: RoleKey, weightOz: number, zone: number | null = null): Promise<Quote[]> {
  const tier = tierFor(role);
  const rows = await exec
    .select({
      serviceId: carrierServices.id, serviceName: carrierServices.name, serviceKey: carrierServices.key, kind: carrierServices.kind,
      transitMinDays: carrierServices.transitMinDays, transitMaxDays: carrierServices.transitMaxDays, sortOrder: carrierServices.sortOrder,
      carrierName: carriers.name, carrierKey: carriers.key,
    })
    .from(carrierServices)
    .innerJoin(carriers, eq(carriers.id, carrierServices.carrierId))
    .where(and(eq(carrierServices.active, true), eq(carriers.active, true)))
    .orderBy(asc(carrierServices.sortOrder), asc(carrierServices.name));

  const out: Quote[] = [];
  for (const s of rows) {
    const [rule] = await exec
      .select()
      .from(pricingRules)
      .where(
        and(
          eq(pricingRules.serviceId, s.serviceId),
          eq(pricingRules.active, true),
          lte(pricingRules.weightMinOz, weightOz),
          gte(pricingRules.weightMaxOz, weightOz),
          zone === null ? isNull(pricingRules.zone) : or(eq(pricingRules.zone, zone), isNull(pricingRules.zone)),
        ),
      )
      .orderBy(sql`${pricingRules.zone} is null`) // specific zone first
      .limit(1);
    const price = rule && tier ? (tier === "customer" ? rule.customerCents : tier === "dealer" ? rule.dealerCents : rule.resellerCents) : null;
    let reason: string | null = null;
    if (!tier) reason = "This account type can't buy labels.";
    else if (s.kind === "carrier_postage") reason = "Needs a carrier partner connection.";
    else if (!rule) reason = "No price is set for this weight.";
    out.push({
      serviceId: s.serviceId, serviceName: s.serviceName, serviceKey: s.serviceKey, carrierName: s.carrierName, carrierKey: s.carrierKey,
      kind: s.kind, transitMinDays: s.transitMinDays, transitMaxDays: s.transitMaxDays,
      priceCents: price, ruleId: rule?.id ?? null, available: reason === null, unavailableReason: reason,
      snapshot: rule && tier ? { ruleId: rule.id, tier, weightOz, requestedZone: zone, ...ruleSnapshot(rule) } : null,
    });
  }
  return out;
}
