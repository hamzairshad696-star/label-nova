"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { ZodError } from "zod";
import { fieldErrors } from "@/lib/validation/auth";
import { requestMeta } from "@/server/auth/request-meta";
import { getActor, PermissionError } from "@/server/auth/session";
import { AccountError, changeAccountRole, createAccount, resetAccountPassword, setAccountStatus } from "@/server/services/accounts";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string; fields?: Record<string, string> };

/** Runs a service call as the signed-in actor and turns every known failure into a message the form can show. */
async function run(fn: (actor: NonNullable<Awaited<ReturnType<typeof getActor>>>, meta: ReturnType<typeof requestMeta>) => Promise<string | void>): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Your session has ended. Sign in again." };
  try {
    const id = await fn(actor, requestMeta(await headers()));
    revalidatePath("/admin", "layout");
    return { ok: true, id: id ?? undefined };
  } catch (err) {
    if (err instanceof ZodError) return { ok: false, error: "Check the highlighted fields.", fields: fieldErrors(err) };
    if (err instanceof AccountError) return { ok: false, error: err.message, fields: err.field ? { [err.field]: err.message } : undefined };
    if (err instanceof PermissionError) return { ok: false, error: "You don't have permission to do this." };
    console.error("[admin/users] action failed", err);
    return { ok: false, error: "Something went wrong on our side. Nothing was changed. Try again." };
  }
}

export async function createAccountAction(input: Record<string, string>): Promise<ActionResult> {
  return run(async (actor, meta) => (await createAccount(actor, input as never, meta)).id);
}

export async function setStatusAction(userId: string, status: "active" | "disabled"): Promise<ActionResult> {
  return run((actor, meta) => setAccountStatus(actor, { userId, status }, meta));
}

export async function changeRoleAction(userId: string, role: string): Promise<ActionResult> {
  return run((actor, meta) => changeAccountRole(actor, { userId, role: role as never }, meta));
}

export async function resetPasswordAction(userId: string, password: string): Promise<ActionResult> {
  return run((actor, meta) => resetAccountPassword(actor, { userId, password }, meta));
}
