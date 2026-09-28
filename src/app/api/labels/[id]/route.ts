import { NextResponse } from "next/server";
import { getActor } from "@/server/auth/session";
import { isLabelFormat, renderLabelPdf } from "@/server/labels/render";
import { getShipment, labelDataFor } from "@/server/services/labels";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const dynamic = "force-dynamic";

/** GET /api/labels/:id?format=4x6 — the label PDF, rendered from the stored shipment. Owner (or scoped reader) only. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Sign in to download labels." }, { status: 401 });
  const { id } = await params;
  const format = new URL(req.url).searchParams.get("format") ?? "4x6";
  if (!UUID.test(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!isLabelFormat(format)) return NextResponse.json({ error: "Unknown label format." }, { status: 400 });
  // Same response for "doesn't exist" and "not yours", so ids can't be probed.
  const shipment = await getShipment(actor, id).catch(() => null);
  const data = shipment ? labelDataFor(shipment) : null;
  if (!shipment || !data) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const pdf = await renderLabelPdf(data, format);
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="label-${data.labelNumber}-${format}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
