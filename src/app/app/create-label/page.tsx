import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { Forbidden } from "@/components/app/forbidden";
import { PageHeader } from "@/components/app/shell";
import { hasPermission } from "@/server/auth/permissions";
import { requireActor } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { shipments } from "@/server/db/schema";
import { tierFor } from "@/server/services/pricing";
import { walletBalance } from "@/server/services/wallet";
import { CreateLabelWizard } from "./wizard";

export const metadata: Metadata = { title: "Create label", robots: { index: false } };

export default async function CreateLabelPage() {
  const actor = await requireActor("/app/create-label");
  if (!hasPermission(actor, "labels.create") || !tierFor(actor.role.key)) return <Forbidden message="Label creation is for customer, dealer and reseller accounts." />;
  // Pre-fill "Ship from" with the sender used last time (real data, the actor's own).
  const [last] = await db.select({ from: shipments.fromAddress }).from(shipments).where(eq(shipments.ownerUserId, actor.id)).orderBy(desc(shipments.createdAt)).limit(1);
  const f = last?.from;
  const initialFrom = f
    ? { name: f.name, company: f.company ?? "", line1: f.line1, line2: f.line2 ?? "", city: f.city, state: f.state, postalCode: f.postalCode, country: f.country, phone: f.phone ?? "" }
    : null;
  return (
    <>
      <PageHeader title="Create label" description="Prices come from your account's rates and are charged to your wallet." />
      <div className="max-w-[920px] px-5 py-8 sm:px-8 lg:px-10">
        <CreateLabelWizard initialFrom={initialFrom} initialBalance={await walletBalance(actor)} />
      </div>
    </>
  );
}
