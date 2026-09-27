import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";

const steps = [
  { title: "Choose a template", body: "Start from a shipping, returns, product or warehouse layout at the size your printer uses." },
  { title: "Add your data", body: "Type it in, pick a saved customer, or upload a spreadsheet with thousands of rows." },
  { title: "Check the preview", body: "See the exact label before anything is charged. Problems are flagged by row and field." },
  { title: "Generate and print", body: "Download a print-ready PDF. The order and every label are saved to your history." },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="border-t border-line py-24 lg:py-32">
      <Container>
        <SectionHeader id="how-title" title="From data to printed label in four steps." />
        <ol className="mt-14 grid gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="bg-paper p-7">
              <span className="font-mono text-[0.8125rem] text-nova" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-8 text-h3 font-semibold">{s.title}</h3>
              <p className="mt-2 text-[0.9375rem] text-ink-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
