import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app/shell";
import { ShipmentsTable } from "@/components/app/shipments-table";
import { cn } from "@/lib/cn";
import { requireActor } from "@/server/auth/session";
import { listShipments, shipmentStatusValues, statusLabel, type ShipmentStatus } from "@/server/services/shipments";

export const metadata: Metadata = { title: "Shipments", robots: { index: false } };

export default async function ShipmentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const actor = await requireActor("/app/shipments");
  const { status: raw } = await searchParams;
  const status = shipmentStatusValues.find((s) => s === raw) as ShipmentStatus | undefined;
  const rows = await listShipments(actor, { status, limit: 200 });
  const filters: (ShipmentStatus | undefined)[] = [undefined, "label_created", "in_transit", "delivered", "exception"];

  return (
    <>
      <PageHeader title="Shipments" description="Every parcel on your account, newest first." />
      <div className="px-5 py-8 sm:px-8 lg:px-10">
        <nav aria-label="Filter by status" className="mb-5 flex flex-wrap gap-2">
          {filters.map((f) => (
            <Link
              key={f ?? "all"}
              href={f ? `/app/shipments?status=${f}` : "/app/shipments"}
              aria-current={f === status ? "page" : undefined}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[0.875rem]",
                f === status ? "border-ink bg-ink text-white" : "border-line-strong bg-surface text-ink-muted hover:text-ink",
              )}
            >
              {f ? statusLabel[f] : "All"}
            </Link>
          ))}
        </nav>
        <div className="overflow-hidden rounded-panel border border-line bg-surface">
          {rows.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="font-medium">{status ? `No shipments are ${statusLabel[status].toLowerCase()}.` : "No shipments yet."}</p>
              <p className="mx-auto mt-1 max-w-[28rem] text-[0.9375rem] text-ink-muted">
                Each label you create appears here with its recipient, service, label number and cost.
              </p>
            </div>
          ) : (
            <ShipmentsTable rows={rows} />
          )}
        </div>
      </div>
    </>
  );
}
