import type { Metadata } from "next";
import { AuthHeading } from "@/components/auth/auth-heading";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading title="Reset your password">Enter the email you use for Label Nova and we'll send you a reset link.</AuthHeading>
      <ForgotPasswordForm />
    </>
  );
}
