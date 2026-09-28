import "server-only";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { ZodError } from "zod";
import { fieldErrors } from "@/lib/validation/auth";
import { requestMeta } from "@/server/auth/request-meta";
import { getActor, PermissionError, type Actor } from "@/server/auth/session";
import { AccountError } from "@/server/services/accounts";

export type ActionResult = { ok: true; id?: string; message?: string } | { ok: false; error: string; fields?: Record<string, string> };

/**
 * Every server action goes through here: server actions are public HTTP endpoints, so the session is
 * re-read on every call and all authorisation happens in the service the callback invokes.
 */
export async function runAction(
  fn: (actor: Actor, meta: ReturnType<typeof requestMeta>) => Promise<{ id?: string; message?: string } | string | void>,
  revalidate: string[] = [],
): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Your session has ended. Sign in again." };
  try {
    const out = await fn(actor, requestMeta(await headers()));
    revalidate.forEach((p) => revalidatePath(p, "layout"));
    if (typeof out === "string") return { ok: true, id: out };
    return { ok: true, ...(out ?? {}) };
  } catch (err) {
    if (err instanceof ZodError) return { ok: false, error: "Check the highlighted fields.", fields: fieldErrors(err) };
    if (err instanceof AccountError) return { ok: false, error: err.message, fields: err.field ? { [err.field]: err.message } : undefined };
    if (err instanceof PermissionError) return { ok: false, error: "You don't have permission to do this." };
    console.error("[action] failed", err);
    return { ok: false, error: "Something went wrong on our side. Nothing was changed. Try again." };
  }
}
