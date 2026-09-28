import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthHeading } from "@/components/auth/auth-heading";
import { LoginForm } from "@/components/auth/login-form";
import { safeNextPath } from "@/lib/safe-redirect";
import { getActor } from "@/server/auth/session";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  if (await getActor()) redirect(next);

  return (
    <>
      <AuthHeading title="Welcome back">
        Need access?{" "}
        <Link href="/request-access" className="font-medium text-nova hover:text-nova-strong">
          Request an account
        </Link>
      </AuthHeading>
      <LoginForm next={next} notice={params.reset ? "Password updated. Log in with your new password." : null} />
    </>
  );
}
