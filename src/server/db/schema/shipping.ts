import { bigint, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

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
    carrier: text(),
    service: text(),
    trackingNumber: text(),
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
