import type { Metadata } from "next";
import { Welcome } from "@/components/auth/welcome";
import type { RoleKey } from "@/server/auth/catalog";
import { requireActor } from "@/server/auth/session";
import { destinationFor, isFirstSignIn } from "@/server/services/welcome";

export const metadata: Metadata = { title: "Welcome", robots: { index: false } };
export const dynamic = "force-dynamic";

const readyLine: Record<RoleKey, string> = {
  ADMIN: "Your control center is ready.",
  DEALER: "Your dealer network is ready.",
  RESELLER: "Your reseller workspace is ready.",
  CLIENT: "Your shipping command center is ready.",
};

export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const actor = await requireActor("/welcome");
  const { next } = await searchParams;
  const destination = destinationFor(actor, next);
  const first = await isFirstSignIn(actor);
  const firstName = actor.name.trim().split(/\s+/)[0] || actor.name;

  return (
    <Welcome
      destination={destination}
      first={first}
      title={first ? "Welcome to Label Nova" : `Welcome back, ${firstName}`}
      line={readyLine[actor.role.key]}
    />
  );
}
