"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type CSSProperties } from "react";
import { LogoMark, Wordmark } from "@/components/brand/logo";

const FIRST_MS = 2600;
const QUICK_MS = 850;
const REDUCED_MS = 250;

export function Welcome({ destination, first, title, line }: { destination: string; first: boolean; title: string; line: string }) {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    router.prefetch(destination);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ms = reduced ? REDUCED_MS : first ? FIRST_MS : QUICK_MS;
    const t = window.setTimeout(go, ms);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, first]);

  function go() {
    if (done.current) return;
    done.current = true;
    router.replace(destination);
  }

  const style = { "--ln-out": first ? `${FIRST_MS - 250}ms` : `${QUICK_MS - 250}ms` } as CSSProperties;

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-midnight px-6 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgb(75_63_234/0.22),transparent_60%)]"
      />
      <div className="ln-welcome relative flex flex-col items-center" data-mode={first ? "full" : "quick"} style={style}>
        <div className="flex items-center gap-3.5">
          <span data-step="mark">
            <LogoMark className="size-12" orbitClassName={first ? "ln-intro__orbit" : undefined} />
          </span>
          <Wordmark className="ln-sweep text-[1.25rem]" data-step="word" />
        </div>

        <h1 data-step="title" className="mt-12 text-[clamp(2rem,1.3rem+3vw,3.25rem)] leading-[1.05] font-semibold tracking-[-0.03em] text-white">
          {title}
        </h1>
        <p data-step="line" role="status" className="mt-4 max-w-[28rem] text-lead text-midnight-muted">
          {line}
        </p>

        {first ? (
          <div data-step="route" aria-hidden="true" className="relative mt-12 h-[2px] w-[320px] max-w-[80vw] rounded-full bg-white/10">
            <div className="ln-welcome__trail absolute inset-0 rounded-full bg-nova-glow" />
            <span className="ln-welcome__parcel absolute top-[-5px] left-0 block size-3 rounded-full bg-beacon shadow-[0_0_16px_4px_rgb(255_177_59/0.55)]" />
          </div>
        ) : null}
      </div>

      {first ? (
        <button type="button" onClick={go} className="absolute right-6 bottom-6 rounded-control px-3 py-2 text-[0.875rem] text-midnight-muted hover:text-white">
          Skip
        </button>
      ) : null}
      <noscript>
        <a href={destination} className="mt-10 text-white underline">
          Continue
        </a>
      </noscript>
    </div>
  );
}
