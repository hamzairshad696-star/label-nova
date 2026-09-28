import "server-only";
import { sql } from "drizzle-orm";
import { assertPermission, type Actor } from "@/server/auth/permissions";
import { db } from "@/server/db/client";

export interface ActivityItem {
  id: string;
  kind: "shipment" | "wallet";
  title: string;
  detail: string | null;
  amountCents: number | null;
  at: Date;
  shipmentId: string | null;
}

/** The actor's own recent shipment events and wallet entries, newest first. */
export async function recentActivity(actor: Actor, limit = 8): Promise<ActivityItem[]> {
  assertPermission(actor, "orders.read");
  assertPermission(actor, "wallet.read");
  const rows = await db.execute<{ id: string; kind: "shipment" | "wallet"; title: string; detail: string | null; amount_cents: string | null; at: Date; shipment_id: string | null }>(sql`
    (select e.id::text, 'shipment' as kind, e.description as title, s.reference as detail, null::bigint as amount_cents, e.occurred_at as at, s.id::text as shipment_id
       from shipment_events e join shipments s on s.id = e.shipment_id
      where s.owner_user_id = ${actor.id})
    union all
    (select l.id::text, 'wallet', l.kind::text, l.note, l.amount_cents, l.created_at, l.shipment_id::text
       from wallet_ledger l where l.user_id = ${actor.id})
    order by at desc limit ${Math.min(Math.max(limit, 1), 50)}`);
  return rows.rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    detail: r.detail,
    amountCents: r.amount_cents === null ? null : Number(r.amount_cents),
    at: new Date(r.at),
    shipmentId: r.shipment_id,
  }));
}
