"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Result = { ok: true; id?: string; message?: string } | { ok: false; error: string; fields?: Record<string, string> };

/** Wires a form to a server action: pending state, field errors, a notice, and a refresh on success. */
export function useActionForm(action: (data: Record<string, string>) => Promise<Result>, opts: { success?: string; resetOnSuccess?: boolean; onSuccess?: (r: Extract<Result, { ok: true }>) => void } = {}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setPending(true);
    setNotice(null);
    const res = await action(Object.fromEntries(new FormData(form)) as Record<string, string>);
    setPending(false);
    if (res.ok) {
      setFields({});
      setNotice({ tone: "success", text: res.message ?? opts.success ?? "Saved." });
      if (opts.resetOnSuccess) form.reset();
      opts.onSuccess?.(res);
      router.refresh();
    } else {
      setFields(res.fields ?? {});
      setNotice({ tone: "danger", text: res.error });
    }
  }
  return { pending, fields, notice, onSubmit };
}
