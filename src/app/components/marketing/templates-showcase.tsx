import type { CSSProperties, ReactNode } from "react";
import { Barcode } from "@/components/label/barcode";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";

interface TemplateCard {
  name: string;
  size: string;
  widthMm: number;
  heightMm: number;
  use: string;
  body: ReactNode;
}

const Line = ({ w, strong }: { w: string; strong?: boolean }) => (
  <span className={`block h-[0.35em] rounded-full ${strong ? "bg-ink" : "bg-ink/25"}`} style={{ width: w }} />
);

const templates: TemplateCard[] = [
  {
    name: "Premium Shipping",
    size: "4 × 6 in",
    widthMm: 101.6,
    heightMm: 152.4,
    use: "Parcels and e-commerce orders",
    body: (
      <div className="flex h-full flex-col gap-[6%] border-[1.5px] border-ink p-[7%]">
        <div className="flex justify-between">
          <div className="grid w-1/2 gap-[0.3em]"><Line w="80%" strong /><Line w="60%" /></div>
          <span className="flex aspect-square w-[24%] items-center justify-center bg-ink text-[0.9em] font-bold text-white">P2</span>
        </div>
        <div className="grid gap-[0.35em]"><Line w="40%" /><Line w="70%" /><Line w="55%" /></div>
        <div className="grid gap-[0.45em] border-y-[1.5px] border-ink py-[6%]"><Line w="75%" strong /><Line w="90%" strong /><Line w="65%" strong /></div>
        <Barcode value="LN48291057331602" className="mt-auto h-[18%]" />
      </div>
    ),
  },
  {
    name: "Returns",
    size: "4 × 4 in",
    widthMm: 101.6,
    heightMm: 101.6,
    use: "Prepaid returns inside the box",
    body: (
      <div className="flex h-full flex-col gap-[7%] border-[1.5px] border-ink p-[8%]">
        <span className="self-start rounded-[2px] bg-ink px-[0.5em] py-[0.15em] text-[0.8em] font-bold text-white">RETURN</span>
        <div className="grid gap-[0.4em]"><Line w="70%" strong /><Line w="85%" /><Line w="50%" /></div>
        <Barcode value="RMA-20931" className="mt-auto h-[26%]" />
      </div>
    ),
  },
  {
    name: "Warehouse Bin",
    size: "3 × 2 in",
    widthMm: 76.2,
    heightMm: 50.8,
    use: "Shelves, bins and pallets",
    body: (
      <div className="flex h-full items-center gap-[6%] p-[7%]">
        <span className="text-[2.2em] leading-none font-extrabold tracking-[-0.04em]">B-14</span>
        <div className="grid flex-1 gap-[0.4em]"><Line w="100%" strong /><Line w="70%" /></div>
      </div>
    ),
  },
  {
    name: "Address",
    size: "2.63 × 1 in",
    widthMm: 66.7,
    heightMm: 25.4,
    use: "Envelopes and mailers",
    body: (
      <div className="grid h-full content-center gap-[0.35em] px-[8%]"><Line w="60%" strong /><Line w="85%" /><Line w="70%" /></div>
    ),
  },
  {
    name: "Product",
    size: "2 × 1 in",
    widthMm: 50.8,
    heightMm: 25.4,
    use: "SKUs and shelf tags",
    body: (
      <div className="flex h-full flex-col justify-between p-[7%]">
        <Line w="70%" strong />
        <Barcode value="SKU4471" className="h-[45%]" />
      </div>
    ),
  },
];

export function TemplatesShowcase() {
  return (
    <section id="templates" aria-labelledby="templates-title" className="border-t border-line bg-surface py-24 lg:py-32">
      <Container>
        <SectionHeader
          id="templates-title"
          title="Templates for every label you print."
          intro="Shown here at true relative size. Every template is defined in millimetres, so what you see on screen is what comes out of the printer."
        />
        <ul
          className="mt-16 flex flex-wrap items-end gap-x-7 gap-y-12 [--mm:1.45px] sm:[--mm:1.8px] lg:[--mm:2.1px]"
        >
          {templates.map((t) => (
            <li key={t.name} className="group" style={{ width: `max(9.5rem, calc(var(--mm) * ${t.widthMm}))` }}>
              <div
                aria-hidden="true"
                className="rounded-paper bg-paper text-[calc(var(--mm)*4)] text-ink shadow-[0_0_0_1px_var(--line)] transition-[box-shadow,transform] duration-200 group-hover:-translate-y-1 group-hover:shadow-lift"
                style={{ width: `calc(var(--mm) * ${t.widthMm})`, aspectRatio: `${t.widthMm} / ${t.heightMm}` } as CSSProperties}
              >
                {t.body}
              </div>
              <h3 className="mt-5 text-[0.9375rem] font-semibold">{t.name}</h3>
              <p className="text-[0.8125rem] text-ink-muted">
                {t.size}
                <br />
                {t.use}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
