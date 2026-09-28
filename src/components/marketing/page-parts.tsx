import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { capabilities, type CapabilityKey, type CapabilityStatus } from "@/config/capabilities";
import { supportMessages, whatsappLink, type SupportTopic } from "@/config/support";
import { cn } from "@/lib/cn";
import { StatusTag } from "./status-tag";

/** Midnight band that continues from the header at the top of every inner page. */
export function PageIntro({ title, children, status }: { title: string; children: ReactNode; status?: CapabilityStatus }) {
  return (
    <section className="bg-midnight text-midnight-ink">
      <Container className="pt-16 pb-16 md:pt-24 md:pb-20">
        {status ? <StatusTag status={status} dark className="mb-6" /> : null}
        <h1 className="max-w-[20ch] text-[clamp(2.25rem,1.3rem+3.4vw,3.75rem)] leading-[1.05] font-semibold tracking-[-0.03em] text-balance text-white">
          {title}
        </h1>
        <div className="mt-6 max-w-[38rem] text-lead text-midnight-muted text-pretty">{children}</div>
      </Container>
    </section>
  );
}

export function Section({ title, intro, children, tone = "paper", id }: { title?: string; intro?: ReactNode; children: ReactNode; tone?: "paper" | "surface"; id?: string }) {
  return (
    <section id={id} className={cn("py-20 lg:py-28", tone === "surface" && "border-y border-line bg-surface")}>
      <Container>
        {title ? (
          <div className="mb-12 grid gap-4 lg:grid-cols-2 lg:items-end">
            <h2 className="text-h2 font-semibold text-balance">{title}</h2>
            {intro ? <p className="max-w-[32rem] text-lead text-ink-muted">{intro}</p> : null}
          </div>
        ) : null}
        {children}
      </Container>
    </section>
  );
}

export function CapabilityList({ keys }: { keys: CapabilityKey[] }) {
  return (
    <ul className="grid border-t border-line md:grid-cols-2">
      {keys.map((k) => {
        const c = capabilities[k];
        return (
          <li key={k} className="border-b border-line py-6 md:odd:pr-10 md:even:pl-10 md:even:border-l">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-[1.0625rem] font-semibold">{c.title}</h3>
              <StatusTag status={c.status} />
            </div>
            <p className="mt-2 text-ink-muted">{c.summary}</p>
          </li>
        );
      })}
    </ul>
  );
}

/** A genuine sequence: numbered because order matters. */
export function Steps({ steps }: { steps: { title: string; body: ReactNode }[] }) {
  return (
    <ol className="grid gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.title} className="bg-surface p-6">
          <span className="font-mono text-[0.8125rem] text-nova" aria-hidden="true">
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3 className="mt-3 font-semibold">{s.title}</h3>
          <p className="mt-1.5 text-[0.9375rem] text-ink-muted">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

/** Marks sample content on marketing pages so it is never mistaken for real data. */
export function ExampleFrame({ children, caption }: { children: ReactNode; caption: string }) {
  return (
    <figure className="rounded-panel border border-line bg-surface p-5 sm:p-7">
      <figcaption className="mb-5 flex items-center justify-between gap-3 text-[0.8125rem] text-ink-muted">
        <span>{caption}</span>
        <span className="rounded-full bg-sunken px-2.5 py-0.5 font-medium">Example</span>
      </figcaption>
      {children}
    </figure>
  );
}

const topicLabels: Record<SupportTopic, string> = {
  account: "Request an account",
  partner: "Dealer or reseller account",
  pricing: "Pricing question",
  technical: "Technical issue",
  general: "Anything else",
};

export function WhatsAppTopics({ topics = ["account", "partner", "pricing", "technical", "general"] }: { topics?: SupportTopic[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {topics.map((t) => (
        <li key={t}>
          <a
            href={whatsappLink(t)}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-menu border border-line bg-surface p-5 transition-colors hover:border-nova"
          >
            <span className="font-semibold">{topicLabels[t]}</span>
            <span className="mt-1 block text-[0.875rem] text-ink-muted">&ldquo;{supportMessages[t]}&rdquo;</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function CtaBand({ title, topic = "account" }: { title: string; topic?: SupportTopic }) {
  return (
    <section className="bg-midnight py-20 text-midnight-ink">
      <Container className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <h2 className="max-w-[20ch] text-h2 font-semibold text-balance text-white">{title}</h2>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/request-access" size="lg" variant="accent">
            Request access
          </ButtonLink>
          <ButtonLink href={whatsappLink(topic)} target="_blank" rel="noopener noreferrer" size="lg" variant="outlineDark">
            Chat on WhatsApp
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
