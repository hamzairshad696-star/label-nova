import { ShippingLabel } from "@/components/label/shipping-label";
import { sampleLabel } from "@/components/label/sample-data";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const facts = [
  { value: "Vector PDF", detail: "sharp on any thermal or laser printer" },
  { value: "25,000 rows", detail: "per bulk upload, validated before you pay" },
  { value: "Any size", detail: "4×6, 4×4, 2×1 or your own millimetres" },
];

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <Container className="grid items-center gap-12 pt-10 pb-20 md:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pt-20 lg:pb-28">
        <div className="max-w-[36rem]">
          <h1 id="hero-title" className="text-display font-semibold text-balance">
            Labels, Reimagined.
          </h1>
          <p className="mt-6 max-w-[30rem] text-lead text-ink-muted text-pretty">
            Create, customize, manage and generate professional labels from one powerful platform — one label
            or ten thousand, ready to print in seconds.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/request-access" size="lg">
              Request access
            </ButtonLink>
            <ButtonLink href="#platform" size="lg" variant="secondary">
              Explore platform
            </ButtonLink>
          </div>

          <dl className="mt-14 hidden gap-5 border-t border-line pt-8 sm:grid sm:grid-cols-3">
            {facts.map((f) => (
              <div key={f.value}>
                <dt className="text-[0.9375rem] font-semibold">{f.value}</dt>
                <dd className="mt-1 text-[0.875rem] leading-snug text-ink-muted">{f.detail}</dd>
              </div>
            ))}
          </dl>
        </div>

        <PrinterStage />
      </Container>
    </section>
  );
}

/** The label feeds out of a printer slot, then its fields ink in. Hover a field to see its template binding. */
function PrinterStage() {
  return (
    <div className="relative mx-auto w-full max-w-[380px] lg:mr-[4%] lg:ml-auto">
      <div
        aria-hidden="true"
        className="relative z-10 mx-0 flex h-12 sm:mx-[-6%] items-end rounded-t-[14px] rounded-b-[6px] bg-ink px-5 pb-2.5 shadow-[0_10px_24px_-10px_rgb(21_23_28/0.5)]"
      >
        <span className="size-1.5 rounded-full bg-[#5ee0a0]" />
        <span className="ml-2 text-[0.6875rem] font-medium text-white/60">Printing 1 of 1</span>
        <span className="absolute inset-x-5 bottom-0 h-[3px] translate-y-1/2 rounded-full bg-black" />
      </div>
      <div className="relative -mt-px px-3 pb-10 [clip-path:inset(0_-80px_-80px_-80px)]">
        <div className="animate-feed">
          <ShippingLabel data={sampleLabel} printing />
        </div>
      </div>
      <p className="-mt-4 text-center text-[0.8125rem] text-ink-faint">Hover a field to see what fills it</p>
    </div>
  );
}
