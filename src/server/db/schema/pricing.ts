import { sql } from "drizzle-orm";
import { bigint, boolean, check, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * carrier_postage: real carrier postage — only purchasable once a carrier partner integration exists.
 * label_only:      a Label Nova label (shipping / warehouse / return) with no postage attached.
 */
export const serviceKind = pgEnum("service_kind", ["carrier_postage", "label_only"]);

export const carriers = pgTable("carriers", {
  id: uuid().primaryKey().defaultRandom(),
  key: text().notNull().unique(), // "usps", "label_nova"
  name: text().notNull(),
  active: boolean().notNull().default(true),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const carrierServices = pgTable(
  "carrier_services",
  {
    id: uuid().primaryKey().defaultRandom(),
    carrierId: uuid()
      .notNull()
      .references(() => carriers.id, { onDelete: "restrict" }),
    key: text().notNull(),
    name: text().notNull(),
    kind: serviceKind().notNull(),
    transitMinDays: integer(),
    transitMaxDays: integer(),
    active: boolean().notNull().default(true),
    sortOrder: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("carrier_services_carrier_key_idx").on(t.carrierId, t.key),
    check("carrier_services_transit_valid", sql`${t.transitMinDays} is null or ${t.transitMaxDays} is null or ${t.transitMaxDays} >= ${t.transitMinDays}`),
  ],
);

/**
 * One price band: a service, an inclusive weight range in ounces, and optionally a zone (null = any zone).
 * Rules are never deleted — they are deactivated. Every change is recorded in pricing_rule_changes, and every
 * label stores a snapshot of the rule it was charged under, so editing a rule never rewrites history.
 */
export const pricingRules = pgTable(
  "pricing_rules",
  {
    id: uuid().primaryKey().defaultRandom(),
    serviceId: uuid()
      .notNull()
      .references(() => carrierServices.id, { onDelete: "restrict" }),
    weightMinOz: integer().notNull(),
    weightMaxOz: integer().notNull(),
    zone: integer(),
    costCents: bigint({ mode: "number" }), // what it costs Label Nova (admin-only)
    customerCents: bigint({ mode: "number" }).notNull(),
    dealerCents: bigint({ mode: "number" }).notNull(),
    resellerCents: bigint({ mode: "number" }).notNull(),
    active: boolean().notNull().default(true),
    createdByUserId: uuid().references(() => users.id, { onDelete: "restrict" }),
    updatedByUserId: uuid().references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("pricing_rules_lookup_idx").on(t.serviceId, t.active, t.weightMinOz),
    check("pricing_rules_weight_valid", sql`${t.weightMinOz} >= 1 and ${t.weightMaxOz} >= ${t.weightMinOz} and ${t.weightMaxOz} <= 2400`),
    check("pricing_rules_zone_valid", sql`${t.zone} is null or ${t.zone} between 1 and 9`),
    check("pricing_rules_prices_positive", sql`${t.customerCents} > 0 and ${t.dealerCents} > 0 and ${t.resellerCents} > 0 and (${t.costCents} is null or ${t.costCents} >= 0)`),
  ],
);

/** Append-only audit trail of pricing changes (trigger-enforced). */
export const pricingRuleChanges = pgTable(
  "pricing_rule_changes",
  {
    id: uuid().primaryKey().defaultRandom(),
    ruleId: uuid()
      .notNull()
      .references(() => pricingRules.id, { onDelete: "restrict" }),
    actorUserId: uuid().references(() => users.id, { onDelete: "restrict" }),
    action: text().notNull(), // created | updated | activated | deactivated
    before: jsonb().$type<Record<string, unknown>>(),
    after: jsonb().$type<Record<string, unknown>>(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("pricing_rule_changes_rule_idx").on(t.ruleId, t.createdAt.desc()), index("pricing_rule_changes_created_idx").on(t.createdAt.desc())],
);
