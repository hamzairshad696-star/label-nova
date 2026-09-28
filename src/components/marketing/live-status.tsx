import Link from "next/link";
import { Container } from "@/components/ui/container";
import { capabilities } from "@/config/capabilities";
import { StatusTag } from "./status-tag";

/** Public, honest view of what is live. Reads the same registry as every other page. */
export function LiveStatus() {
  const items = Object.values(capabilities);
  return (
    <section aria-labelledby="status-title" className="bg-midnight py-24 text-midnight-ink lg:py-32">
      <Container>
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
          <h2 id="status-title" className="text-h2 font-semibold text-balance text-white">
            What works today, and what&rsquo;s next.
          </h2>
          <p className="max-w-[32rem] text-lead text-midnight-muted">
            We publish the real state of the platform. Carrier features switch on once a carrier partner is connected, so
            you never print postage that won&rsquo;t scan.{" "}
            <Link href="/carriers" className="text-white underline underline-offset-4">
              Why this matters
            </Link>
          </p>
        </div>
        <ul className="mt-14 grid border-t border-midnight-line sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <li key={c.title} className="border-b border-midnight-line py-6 sm:pr-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold text-white">{c.title}</h3>
                <StatusTag status={c.status} dark />
              </div>
              <p className="mt-2 text-[0.9375rem] text-midnight-muted">{c.summary}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
