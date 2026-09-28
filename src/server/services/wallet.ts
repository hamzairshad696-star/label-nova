import "server-only";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { assertPermission, PermissionError, type Actor } from "@/server/auth/permissions";
import { db } from "@/server/db/client";
import { walletLedger } from "@/server/db/schema";

export const ledgerKindLabel = {
  top_up: "Wallet top-up",
  label_charge: "Label charge",
  refund: "Refund",
  adjustment: "Adjustment",
} as const;

/** Only the account itself for now; network/all views of other wallets arrive with Phase 8/9. */
function ownWalletOnly(actor: Actor, userId: string) {
  assertPermission(actor, "wallet.read");
  if (userId !== actor.id) throw new PermissionError("wallet.read");
}

/** Balance is always derived from the ledger. */
export async function walletBalance(actor: Actor, userId = actor.id): Promise<number> {
  ownWalletOnly(actor, userId);
  const [row] = await db
    .select({ sum: sql<string>`coalesce(sum(${walletLedger.amountCents}), 0)` })
    .from(walletLedger)
    .where(eq(walletLedger.userId, userId));
  return Number(row?.sum ?? 0);
}

/** Net spending on labels since the start of the current calendar month (UTC): charges minus refunds. */
export async function monthSpend(actor: Actor, userId = actor.id, now = new Date()): Promise<number> {
  ownWalletOnly(actor, userId);
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [row] = await db
    .select({ sum: sql<string>`coalesce(sum(-${walletLedger.amountCents}) filter (where ${walletLedger.kind} in ('label_charge','refund')), 0)` })
    .from(walletLedger)
    .where(and(eq(walletLedger.userId, userId), gte(walletLedger.createdAt, start)));
  return Number(row?.sum ?? 0);
}

export async function listLedger(actor: Actor, { userId = actor.id, limit = 50 }: { userId?: string; limit?: number } = {}) {
  ownWalletOnly(actor, userId);
  return db
    .select({
      id: walletLedger.id,
      kind: walletLedger.kind,
      amountCents: walletLedger.amountCents,
      currency: walletLedger.currency,
      note: walletLedger.note,
      provider: walletLedger.provider,
      shipmentId: walletLedger.shipmentId,
      createdAt: walletLedger.createdAt,
      // Running balance after each entry, computed from the ledger itself.
      balanceAfter: sql<string>`sum(${walletLedger.amountCents}) over (partition by ${walletLedger.userId} order by ${walletLedger.createdAt}, ${walletLedger.id})`,
    })
    .from(walletLedger)
    .where(eq(walletLedger.userId, userId))
    .orderBy(desc(walletLedger.createdAt), desc(walletLedger.id))
    .limit(Math.min(Math.max(limit, 1), 500));
}
