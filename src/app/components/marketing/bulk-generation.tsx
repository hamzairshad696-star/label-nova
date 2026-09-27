import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Icons } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";

const mapping = [
  { column: "customer_name", field: "Recipient name" },
  { column: "street", field: "Street address" },
  { column: "zip", field: "ZIP code" },
  { column: "tracking", field: "Tracking number" },
];

const errors = [
  { row: 231, field: "ZIP code", message: "ZIP code is missing. Add a 5-digit ZIP in the zip column." },
  { row: 784, field: "Tracking number", message: "Tracking number has 9 characters; this template expects 16." },
];

const points = [
  "Columns are matched to template fields automatically, and you can change any match.",
  "Every row is checked before generation. Errors name the row, the field and the fix.",
  "Preview the first 5 or 10 labels, then generate the rest into one merged PDF.",
  "Download a CSV of only the failed rows, fix them, and upload just those.",
];

export function BulkGeneration() {
  return (
    <section aria-labelledby="bulk-title" className="border-t border-line py-24 lg:py-32">
      <Container className="grid items-start gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <SectionHeader
            id="bulk-title"
            title="A thousand labels, checked before you spend a cent."
            intro="Upload a CSV or Excel file and Label Nova tells you exactly what will print, what won't, and what it will cost."
          />
          <ul className="mt-10 grid gap-4">
            {points.map((p) => (
              <li key={p} className="flex gap-3 text-[0.9375rem]">
                <Icons.check className="mt-0.5 shrink-0 text-nova" />
                <span className="text-ink-muted">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <figure className="overflow-hidden rounded-panel border border-line bg-surface shadow-menu">
          <figcaption className="sr-only">Example validation report for a bulk upload of 1,000 rows</figcaption>
          <div aria-hidden="true">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-control bg-success-soft text-success">
                  <Icons.table />
                </span>
                <div>
                  <p className="text-[0.9375rem] font-semibold">september-orders.xlsx</p>
                  <p className="text-[0.8125rem] text-ink-muted">Premium Shipping, 4 × 6 in</p>
                </div>
              </div>
              <Badge tone="warning">Needs review</Badge>
            </div>

            <dl className="grid grid-cols-2 border-b border-line sm:grid-cols-4">
              {[
                ["Total rows", "1,000"],
                ["Valid", "998"],
                ["Errors", "2"],
                ["Estimated cost", "$49.90"],
              ].map(([k, v], i) => (
                <div key={k} className={`px-5 py-4 ${i > 0 ? "sm:border-l sm:border-line" : ""} ${i % 2 ? "border-l border-line" : ""}`}>
                  <dt className="text-[0.75rem] text-ink-muted">{k}</dt>
                  <dd className={`mt-1 text-xl font-semibold tracking-[-0.02em] ${k === "Errors" ? "text-danger" : ""}`}>{v}</dd>
                </div>
              ))}
            </dl>

            <div className="border-b border-line px-5 py-4">
              <p className="mb-3 text-[0.8125rem] font-medium">Column mapping</p>
              <div className="grid gap-2">
                {mapping.map((m) => (
                  <div key={m.column} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-[0.8125rem]">
                    <span className="truncate rounded-control bg-sunken px-2.5 py-1.5 font-mono">{m.column}</span>
                    <svg viewBox="0 0 16 8" className="w-4 text-ink-faint"><path d="M0 4h14M11 1l3 3-3 3" stroke="currentColor" fill="none" strokeWidth="1.3" /></svg>
                    <span className="truncate rounded-control border border-line px-2.5 py-1.5">{m.field}</span>
                  </div>
                ))}
              </div>
            </div>

            <ul className="divide-y divide-line">
              {errors.map((e) => (
                <li key={e.row} className="flex gap-3 px-5 py-3.5">
                  <Icons.alert className="mt-0.5 shrink-0 text-danger" />
                  <div className="text-[0.875rem]">
                    <p className="font-semibold">
                      Row {e.row} <span className="font-normal text-ink-muted">in {e.field}</span>
                    </p>
                    <p className="text-ink-muted">{e.message}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-2 border-t border-line bg-paper px-5 py-4">
              <span className="rounded-control border border-line-strong bg-surface px-3 py-1.5 text-[0.8125rem] font-medium">Preview first 5</span>
              <span className="rounded-control border border-line-strong bg-surface px-3 py-1.5 text-[0.8125rem] font-medium">Preview first 10</span>
              <span className="ml-auto rounded-control bg-ink px-3 py-1.5 text-[0.8125rem] font-medium text-white">Generate 998 labels</span>
            </div>
          </div>
        </figure>
      </Container>
    </section>
  );
}
