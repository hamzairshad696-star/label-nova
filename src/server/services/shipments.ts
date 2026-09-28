import "server-only";
import { and, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { assertPermission, type Actor } from "@/server/auth/permissions";
import { db } from "@/server/db/client";
import { shipments, shipmentStatus } from "@/server/db/schema";

export type ShipmentStatus = (typeof shipmentStatus.enumValues)[number];
export const shipmentStatusValues = shipmentStatus.enumValues;
export const PENDING_STATUSES: ShipmentStatus[] = ["draft", "label_created"];

export const statusLabel: Record<ShipmentStatus, string> = {
  draft: "Draft",
  label_created: "Label created",
  in_transit: "In transit",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  exception: "Needs attention",
  cancelled: "Cancelled",
};

/** Which owners' shipments the actor may read, from their `orders.read` grant. */
export function shipmentScope(actor: Actor): SQL {
  const scope = assertPermission(actor, "orders.read");
  if (scope === "all") return sql`true`;
  if (scope === "network") {
    return sql`(${shipments.ownerUserId} = ${actor.id} or ${shipments.ownerUserId} in (
      with recursive tree as (
        select id from users where parent_user_id = ${actor.id}
        union select u.id from users u inner join tree t on u.parent_user_id = t.id
      ) select id from tree))`;
  }
  return eq(shipments.ownerUserId, actor.id);
}

export async function listShipments(actor: Actor, { status, limit = 50 }: { status?: ShipmentStatus; limit?: number } = {}) {
  const where = status ? and(shipmentScope(actor), eq(shipments.status, status)) : shipmentScope(actor);
  return db
    .select({
      id: shipments.id,
      reference: shipments.reference,
      status: shipments.status,
      toName: sql<string | null>`${shipments.toAddress}->>'name'`,
      toCity: sql<string | null>`${shipments.toAddress}->>'city'`,
      carrier: shipments.carrier,
      service: shipments.service,
      trackingNumber: shipments.trackingNumber,
      priceCents: shipments.priceCents,
      currency: shipments.currency,
      createdAt: shipments.createdAt,
    })
    .from(shipments)
    .where(where)
    .orderBy(desc(shipments.createdAt))
    .limit(Math.min(Math.max(limit, 1), 200));
}

export async function shipmentCounts(actor: Actor) {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      pending: sql<number>`count(*) filter (where ${inArray(shipments.status, PENDING_STATUSES)})::int`,
      inTransit: sql<number>`count(*) filter (where ${inArray(shipments.status, ["in_transit", "out_for_delivery"])})::int`,
    })
    .from(shipments)
    .where(shipmentScope(actor));
  return row ?? { total: 0, pending: 0, inTransit: 0 };
}
