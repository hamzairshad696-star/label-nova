import { bigint, check, index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";
import { shipments } from "./shipping";

export const ledgerKind = pgEnum("ledger_kind", ["top_up", "label_charge", "refund", "adjustment"]);

/**
 * Append-only wallet ledger. A balance is always SUM(amount_cents) of an account's entries; it is never
 * stored or edited directly. Rows cannot be updated or deleted (enforced by a database trigger).
 *
 * `provider` records where money came from: "manual" for admin credits today; a payment provider
 * (e.g. "stripe") later, with its payment id in `provider_ref`. No schema change is needed to add one.
 */
export const walletLedger = pgTable(
  "wallet_ledger",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    kind: ledgerKind().notNull(),
    amountCents: bigint({ mode: "number" }).notNull(), // + credit, − debit
    currency: text().notNull().default("USD"),
    shipmentId: uuid().references(() => shipments.id, { onDelete: "restrict" }),
    provider: text().notNull().default("manual"),
    providerRef: text(),
    note: text(),
    createdByUserId: uuid().references(() => users.id, { onDelete: "restrict" }),
    idempotencyKey: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("wallet_ledger_user_created_idx").on(t.userId, t.createdAt.desc()),
    uniqueIndex("wallet_ledger_idempotency_idx").on(t.idempotencyKey),
    check("wallet_ledger_amount_nonzero", sql`${t.amountCents} <> 0`),
    check(
      "wallet_ledger_sign_matches_kind",
      sql`(${t.kind} = 'top_up' and ${t.amountCents} > 0) or (${t.kind} = 'label_charge' and ${t.amountCents} < 0) or (${t.kind} = 'refund' and ${t.amountCents} > 0) or ${t.kind} = 'adjustment'`,
    ),
  ],
);
