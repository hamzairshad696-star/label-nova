import type { Metadata } from "next";
import { PageHeader } from "@/components/app/shell";
import { ROLE_LABEL } from "@/server/auth/catalog";
import { requireActor } from "@/server/auth/session";
import { PasswordForm, ProfileForm } from "./settings-forms";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default async function SettingsPage() {
  const actor = await requireActor("/app/settings");
  return (
    <>
      <PageHeader title="Settings" description="Your profile and sign-in details." />
      <div className="grid max-w-[1000px] gap-6 px-5 py-8 sm:px-8 lg:grid-cols-2 lg:px-10">
        <section aria-labelledby="profile-h" className="rounded-panel border border-line bg-surface p-6 sm:p-7">
          <h2 id="profile-h" className="mb-1 font-semibold">Profile</h2>
          <p className="mb-5 text-[0.9375rem] text-ink-muted">
            Signed in as {actor.email} · {ROLE_LABEL[actor.role.key]}. To change your email or role, contact support.
          </p>
          <ProfileForm name={actor.name} company={actor.company} />
        </section>
        <section aria-labelledby="pw-h" className="rounded-panel border border-line bg-surface p-6 sm:p-7">
          <h2 id="pw-h" className="mb-5 font-semibold">Password</h2>
          <PasswordForm />
        </section>
      </div>
    </>
  );
}
