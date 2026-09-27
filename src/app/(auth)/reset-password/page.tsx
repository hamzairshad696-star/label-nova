import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeading } from "@/components/auth/auth-heading";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { token, error } = await searchParams;
  const validToken = typeof token === "string" && token.length > 0 && !error;

  return (
    <>
      <AuthHeading title="Choose a new password">You'll be signed out on other devices once it's saved.</AuthHeading>
      {validToken ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="grid gap-6">
          <Alert tone="danger" title="This reset link doesn't work">
            It may have expired, been used already, or been copied incompletely.
          </Alert>
          <Link href="/forgot-password" className="text-[0.9375rem] font-medium text-nova hover:text-nova-strong">
            Request a new link
          </Link>
        </div>
      )}
    </>
  );
}
