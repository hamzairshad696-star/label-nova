"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SelectField } from "@/components/ui/select";
import { generatePassword } from "@/lib/generate-password";
import { changeRoleAction, resetPasswordAction, setStatusAction, type ActionResult } from "../actions";

type Notice = { tone: "success" | "danger"; text: string } | null;

export function ManageAccount({ userId, status, role, isSelf }: { userId: string; status: string; role: string; isSelf: boolean }) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [nextRole, setNextRole] = useState(role);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState<string | undefined>();

  async function run(key: string, fn: () => Promise<ActionResult>, success: string) {
    setBusy(key);
    setNotice(null);
    const res = await fn();
    setBusy(null);
    if (res.ok) {
      setNotice({ tone: "success", text: success });
      router.refresh();
    } else {
      setNotice({ tone: "danger", text: res.error });
    }
    return res;
  }

  if (isSelf) {
    return <p className="text-ink-muted">You can't change your own role, status or password from here.</p>;
  }
  if (role === "ADMIN") {
    return <p className="text-ink-muted">Admin accounts can't be changed from the console.</p>;
  }

  const disabling = status === "active";

  return (
    <div className="grid gap-8">
      <div aria-live="polite">{notice ? <Alert tone={notice.tone}>{notice.text}</Alert> : null}</div>

      <section aria-labelledby="status-h">
        <h3 id="status-h" className="font-semibold">Access</h3>
        <p className="mt-1 text-[0.9375rem] text-ink-muted">
          {disabling ? "Disabling signs this person out everywhere and blocks sign-in until you enable them again." : "This account can't sign in right now."}
        </p>
        <Button
          className="mt-4"
          variant={disabling ? "secondary" : "accent"}
          disabled={busy !== null}
          onClick={() => {
            if (disabling && !window.confirm("Disable this account? They will be signed out immediately.")) return;
            void run("status", () => setStatusAction(userId, disabling ? "disabled" : "active"), disabling ? "Account disabled." : "Account enabled.");
          }}
        >
          {busy === "status" ? "Saving…" : disabling ? "Disable account" : "Enable account"}
        </Button>
      </section>

      <section aria-labelledby="role-h" className="border-t border-line pt-8">
        <h3 id="role-h" className="font-semibold">Role</h3>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <SelectField label="New role" value={nextRole} onChange={(e) => setNextRole(e.target.value)} className="sm:w-64">
            <option value="CLIENT">Customer</option>
            <option value="DEALER">Dealer</option>
            <option value="RESELLER">Reseller</option>
          </SelectField>
          <Button
            variant="secondary"
            disabled={busy !== null || nextRole === role}
            onClick={() => void run("role", () => changeRoleAction(userId, nextRole), "Role updated.")}
          >
            {busy === "role" ? "Saving…" : "Change role"}
          </Button>
        </div>
        {nextRole !== "CLIENT" && role === "CLIENT" ? (
          <p className="mt-2 text-[0.875rem] text-ink-muted">Dealers and resellers report directly to the admin, so this account will leave its current network.</p>
        ) : null}
      </section>

      <section aria-labelledby="pw-h" className="border-t border-line pt-8">
        <h3 id="pw-h" className="font-semibold">Set a new password</h3>
        <p className="mt-1 text-[0.9375rem] text-ink-muted">Use this if the person can't reset it by email. They'll be signed out everywhere.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
          <Field
            label="New password"
            type="text"
            autoComplete="new-password"
            spellCheck={false}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={pwError}
            className="flex-1"
            inputClassName="font-mono"
          />
          <Button variant="secondary" className="sm:mt-[1.85rem]" onClick={() => setPassword(generatePassword())}>
            Generate
          </Button>
          <Button
            variant="secondary"
            className="sm:mt-[1.85rem]"
            disabled={busy !== null || password.length === 0}
            onClick={async () => {
              const res = await run("pw", () => resetPasswordAction(userId, password), "Password updated. Share it with the person privately.");
              setPwError(res.ok ? undefined : res.fields?.password);
            }}
          >
            {busy === "pw" ? "Saving…" : "Set password"}
          </Button>
        </div>
      </section>
    </div>
  );
}
