import "server-only";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { parseMoney } from "@/lib/validation/pricing";
import { assertPermission, PermissionError, type Actor } from "@/server/auth/permissions";
import { db } from "@/server/db/client";
import { auditLogs, roles, userRoles, walletLedger } from "@/server/db/schema";
import { AccountError, isInNetwork } from "./accounts";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const ledgerKindLabel = {
  top_up: "Wallet top-up",
  label_charge: "Label charge",
  refund: "Refund",
  adjustment: "Adjustment",
} as const;

/** Your own wallet; others' wallets need `wallet.read` at network (your network only) or all scope. */
async function ownWalletOnly(actor: Actor, userId: string) {
  const scope = assertPermission(actor, "wallet.read");
  if (userId === actor.id) return;
  if (scope === "all") return;
  if (scope === "network" && (await isInNetwork(db, actor.id, userId))) return;
  throw new PermissionError("wallet.read");
}

/** Balance is always derived from the ledger. */
export async function walletBalance(actor: Actor, userId = actor.id): Promise<number> {
  await ownWalletOnly(actor, userId);
  const [row] = await db
    .select({ sum: sql<string>`coalesce(sum(${walletLedger.amountCents}), 0)` })
    .from(walletLedger)
    .where(eq(walletLedger.userId, userId));
  return Number(row?.sum ?? 0);
}

/** Net spending on labels since the start of the current calendar month (UTC): charges minus refunds. */
export async function monthSpend(actor: Actor, userId = actor.id, now = new Date()): Promise<number> {
  await ownWalletOnly(actor, userId);
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [row] = await db
    .select({ sum: sql<string>`coalesce(sum(-${walletLedger.amountCents}) filter (where ${walletLedger.kind} in ('label_charge','refund')), 0)` })
    .from(walletLedger)
    .where(and(eq(walletLedger.userId, userId), gte(walletLedger.createdAt, start)));
  return Number(row?.sum ?? 0);
}

export async function listLedger(actor: Actor, { userId = actor.id, limit = 50 }: { userId?: string; limit?: number } = {}) {
  await ownWalletOnly(actor, userId);
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

// ---------- Writes ----------

/** Serialises every balance-changing write for one wallet, so concurrent charges can't overspend. */
async function lockWallet(tx: Tx, userId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"wallet:" + userId}))`);
}

async function balanceIn(tx: Tx, userId: string): Promise<number> {
  const [row] = await tx.select({ sum: sql<string>`coalesce(sum(${walletLedger.amountCents}), 0)` }).from(walletLedger).where(eq(walletLedger.userId, userId));
  return Number(row?.sum ?? 0);
}

export class InsufficientFundsError extends Error {
  constructor(readonly balanceCents: number, readonly neededCents: number) {
    super("Insufficient wallet balance.");
    this.name = "InsufficientFundsError";
  }
}

export const creditSchema = z.object({
  userId: z.uuid(),
  type: z.enum(["top_up", "adjustment_credit", "adjustment_debit"], { error: "Choose the type of entry." }),
  amount: z.union([z.string(), z.number()]).transform((v, ctx): number => {
    const c = parseMoney(v);
    if (c === null || c === 0) {
      ctx.addIssue({ code: "custom", message: "Enter an amount like 25.00, more than $0.00." });
      return z.NEVER;
    }
    if (c > 5_000_000) {
      ctx.addIssue({ code: "custom", message: "Amounts above $50,000.00 must be split or confirmed with engineering." });
      return z.NEVER;
    }
    return c;
  }),
  note: z.string().trim().min(3, "Add a short note explaining this entry.").max(200, "Keep the note under 200 characters."),
  reference: z.string().trim().max(100).optional().transform((v) => v || null),
  idempotencyKey: z.uuid("This form expired. Reload the page and try again."),
});

/**
 * Admin (manual) credit or adjustment. The idempotency key makes retries and double-clicks safe:
 * the same key always returns the first entry instead of creating another.
 * `provider` is "manual" here; a payment provider integration writes the same table with its own provider/ref.
 */
export async function adminWalletEntry(actor: Actor, raw: z.input<typeof creditSchema>, meta: { ip?: string | null; userAgent?: string | null } = {}) {
  assertPermission(actor, "wallet.adjust", "all");
  const input = creditSchema.parse(raw);
  const idemKey = `manual:${input.idempotencyKey}`;
  return db.transaction(async (tx) => {
    const [role] = await tx.select({ key: roles.key }).from(userRoles).innerJoin(roles, eq(roles.id, userRoles.roleId)).where(eq(userRoles.userId, input.userId));
    if (!role) throw new AccountError("That account doesn't exist.");
    if (role.key === "ADMIN") throw new AccountError("Admin accounts don't have a wallet.");
    await lockWallet(tx, input.userId);

    const existing = await tx.query.walletLedger.findFirst({ where: eq(walletLedger.idempotencyKey, idemKey) });
    if (existing) {
      if (existing.userId !== input.userId) throw new AccountError("This form was already used for another account. Reload and try again.");
      return { id: existing.id, duplicate: true as const };
    }

    const signed = input.type === "adjustment_debit" ? -input.amount : input.amount;
    if (signed < 0) {
      const balance = await balanceIn(tx, input.userId);
      if (balance + signed < 0) throw new AccountError(`This would take the balance below $0.00 (current balance ${(balance / 100).toFixed(2)}).`, "amount");
    }
    const [entry] = await tx
      .insert(walletLedger)
      .values({
        userId: input.userId,
        kind: input.type === "top_up" ? "top_up" : "adjustment",
        amountCents: signed,
        note: input.note,
        provider: "manual",
        providerRef: input.reference,
        createdByUserId: actor.id,
        idempotencyKey: idemKey,
      })
      .returning({ id: walletLedger.id });
    await tx.insert(auditLogs).values({
      actorUserId: actor.id, action: "wallet.entry_created", targetType: "user", targetId: input.userId,
      metadata: { entryId: entry!.id, type: input.type, amountCents: signed, note: input.note }, ip: meta.ip ?? null, userAgent: meta.userAgent ?? null,
    });
    return { id: entry!.id, duplicate: false as const };
  });
}

/**
 * Charge a label inside the caller's transaction. Locks the wallet, checks the balance, writes one
 * label_charge entry tied to the shipment. Throws InsufficientFundsError without writing anything.
 */
export async function chargeLabelInTx(tx: Tx, p: { userId: string; amountCents: number; shipmentId: string; note: string; idempotencyKey: string }) {
  if (!Number.isInteger(p.amountCents) || p.amountCents <= 0) throw new Error("Label charge must be a positive whole number of cents.");
  await lockWallet(tx, p.userId);
  const balance = await balanceIn(tx, p.userId);
  if (balance < p.amountCents) throw new InsufficientFundsError(balance, p.amountCents);
  const [entry] = await tx
    .insert(walletLedger)
    .values({ userId: p.userId, kind: "label_charge", amountCents: -p.amountCents, shipmentId: p.shipmentId, note: p.note, provider: "label_nova", idempotencyKey: p.idempotencyKey })
    .returning({ id: walletLedger.id });
  return { entryId: entry!.id, balanceAfter: balance - p.amountCents };
}
