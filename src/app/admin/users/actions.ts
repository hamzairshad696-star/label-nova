"use server";

import { runAction, type ActionResult } from "@/server/actions/run";
import { changeAccountRole, createAccount, resetAccountPassword, setAccountStatus } from "@/server/services/accounts";
import { adminWalletEntry } from "@/server/services/wallet";

export type { ActionResult };

export async function createAccountAction(input: Record<string, string>): Promise<ActionResult> {
  return runAction(async (actor, meta) => (await createAccount(actor, input as never, meta)).id, ["/admin"]);
}

export async function setStatusAction(userId: string, status: "active" | "disabled"): Promise<ActionResult> {
  return runAction((actor, meta) => setAccountStatus(actor, { userId, status }, meta), ["/admin"]);
}

export async function changeRoleAction(userId: string, role: string): Promise<ActionResult> {
  return runAction((actor, meta) => changeAccountRole(actor, { userId, role: role as never }, meta), ["/admin"]);
}

export async function resetPasswordAction(userId: string, password: string): Promise<ActionResult> {
  return runAction((actor, meta) => resetAccountPassword(actor, { userId, password }, meta), ["/admin"]);
}

export async function walletEntryAction(input: Record<string, string>): Promise<ActionResult> {
  return runAction(async (actor, meta) => {
    const r = await adminWalletEntry(actor, input as never, meta);
    return { id: r.id, message: r.duplicate ? "This entry was already recorded. Nothing was added twice." : "Entry recorded." };
  }, ["/admin", "/app"]);
}
