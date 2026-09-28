import { bigint, index, integer, jsonb, pgEnum, pgSequence, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { carrierServices, pricingRules } from "./pricing";

/** Source of Label Nova label numbers (see src/server/labels/numbering.ts). */
export const labelNumberSeq = pgSequence("label_number_seq", { startWith: 1, increment: 1 });

export const shipmentStatus = pgEnum("shipment_status", [
  "draft", // being prepared, nothing bought
  "label_created", // postage/label issued, not yet scanned
  "in_transit",
  "out_for_delivery",
  "delivered",
  "exception", // carrier reported a problem
  "cancelled",
]);

export interface Address {
  name: string;
  company?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string | null;
}

/**
 * One parcel, from draft to delivery. Owned by a single account (the customer who ships it).
 * Money is in integer cents. Carrier fields stay null until a real carrier/partner response fills them.
 */
export const shipments = pgTable(
  "shipments",
  {
    id: uuid().primaryKey().defaultRandom(),
    ownerUserId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    reference: text(), // customer's own order number
    status: shipmentStatus().notNull().default("draft"),
    fromAddress: jsonb().$type<Address>(),
    toAddress: jsonb().$type<Address>(),
    weightOz: integer(),
    lengthIn: integer(),
    widthIn: integer(),
    heightIn: integer(),
    /** Carrier fields: only ever filled from a real carrier/partner response. Null for label-only labels. */
    carrier: text(),
    service: text(),
    trackingNumber: text(),
    /** What was bought, and the exact rule and prices it was charged under (immune to later rule edits). */
    serviceId: uuid().references(() => carrierServices.id, { onDelete: "restrict" }),
    pricingRuleId: uuid().references(() => pricingRules.id, { onDelete: "restrict" }),
    priceSnapshot: jsonb().$type<Record<string, unknown>>(),
    /** Label Nova's own label number (not a carrier tracking number). */
    labelNumber: text(),
    /** Makes "create label" safe to retry: the same key returns the same shipment and charge. */
    idempotencyKey: text(),
    priceCents: bigint({ mode: "number" }), // what the owner was charged
    currency: text().notNull().default("USD"),
    labelCreatedAt: timestamp({ withTimezone: true }),
    deliveredAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("shipments_owner_created_idx").on(t.ownerUserId, t.createdAt.desc()),
    index("shipments_owner_status_idx").on(t.ownerUserId, t.status),
    index("shipments_tracking_idx").on(t.trackingNumber),
    uniqueIndex("shipments_label_number_idx").on(t.labelNumber),
    uniqueIndex("shipments_idempotency_idx").on(t.idempotencyKey),
  ],
);

/** Tracking timeline. Only ever appended from our own actions or real carrier data. */
export const shipmentEvents = pgTable(
  "shipment_events",
  {
    id: uuid().primaryKey().defaultRandom(),
    shipmentId: uuid()
      .notNull()
      .references(() => shipments.id, { onDelete: "cascade" }),
    status: shipmentStatus().notNull(),
    description: text().notNull(),
    location: text(),
    source: text().notNull(), // "label_nova" or the carrier/provider name
    occurredAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("shipment_events_shipment_idx").on(t.shipmentId, t.occurredAt.desc())],
);
