import { Badge, type BadgeTone } from "@/components/ui/badge";
import { statusLabel, type ShipmentStatus } from "@/server/services/shipments";

const tone: Record<ShipmentStatus, BadgeTone> = {
  draft: "neutral",
  label_created: "info",
  in_transit: "accent",
  out_for_delivery: "accent",
  delivered: "success",
  exception: "danger",
  cancelled: "neutral",
};

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  return <Badge tone={tone[status]}>{statusLabel[status]}</Badge>;
}
