import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthHeading } from "@/components/auth/auth-heading";
import { RegisterForm } from "@/components/auth/register-form";
import { getActor } from "@/server/auth/session";

export const metadata: Metadata = { title: "Create your account", robots: { index: false } };

export default async function RegisterPage() {
  if (await getActor()) redirect("/app");
  return (
    <>
      <AuthHeading title="Create your account">
        Already have one?{" "}
        <Link href="/login" className="font-medium text-nova hover:text-nova-strong">
          Log in
        </Link>
      </AuthHeading>
      <RegisterForm />
    </>
  );
}
