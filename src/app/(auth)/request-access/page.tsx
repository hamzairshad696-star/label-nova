import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeading } from "@/components/auth/auth-heading";
import { ButtonLink } from "@/components/ui/button";
import { SUPPORT_WHATSAPP_DISPLAY, whatsappLink } from "@/config/support";

export const metadata: Metadata = { title: "Request access" };

const options = [
  { topic: "account", label: "Request a customer account" },
  { topic: "partner", label: "Dealer or reseller enquiry" },
  { topic: "pricing", label: "Ask about pricing" },
] as const;

export default function RequestAccessPage() {
  return (
    <>
      <AuthHeading title="Request access">
        Label Nova accounts are created by our team, so your role, pricing and limits are set up correctly from
        the start.
      </AuthHeading>

      <div className="grid gap-3">
        {options.map((o, i) => (
          <ButtonLink
            key={o.topic}
            href={whatsappLink(o.topic)}
            target="_blank"
            rel="noopener noreferrer"
            size="lg"
            variant={i === 0 ? "primary" : "secondary"}
          >
            {o.label}
          </ButtonLink>
        ))}
      </div>

      <p className="mt-6 text-[0.875rem] text-ink-muted">
        Opens WhatsApp with {SUPPORT_WHATSAPP_DISPLAY}. Usually answered within business hours.
      </p>
      <p className="mt-8 text-[0.9375rem] text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-nova hover:text-nova-strong">
          Sign in
        </Link>
      </p>
    </>
  );
}
