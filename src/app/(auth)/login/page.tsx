import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthHeading } from "@/components/auth/auth-heading";
import { LoginForm } from "@/components/auth/login-form";
import { whatsappLink } from "@/config/support";
import { safeNextPath } from "@/lib/safe-redirect";
import { getActor } from "@/server/auth/session";
import { destinationFor } from "@/server/services/welcome";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const actor = await getActor();
  if (actor) redirect(destinationFor(actor, params.next));
  const next = params.next ? safeNextPath(params.next, "") : "";

  return (
    <>
      <AuthHeading title="Welcome back" />
      <LoginForm next={next} notice={params.reset ? "Password updated. Sign in with your new password." : null} />
      <div className="mt-7 border-t border-line pt-6 text-[0.9375rem] text-ink-muted">
        Need access?{" "}
        <Link href="/request-access" className="font-medium text-nova hover:text-nova-strong">
          Request an account
        </Link>{" "}
        or{" "}
        <a href={whatsappLink("account")} target="_blank" rel="noopener noreferrer" className="font-medium text-nova hover:text-nova-strong">
          contact support
        </a>
        .
      </div>
    </>
  );
}
