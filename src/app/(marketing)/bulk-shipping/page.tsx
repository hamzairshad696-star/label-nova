import type { Metadata } from "next";
import { CtaBand, ExampleFrame, PageIntro, Section, Steps } from "@/components/marketing/page-parts";
import { capabilities } from "@/config/capabilities";

export const metadata: Metadata = { title: "Bulk shipping", description: "Upload a CSV or Excel file and ship hundreds of parcels at once." };

const summary = [
  { label: "Shipments found", value: 487, tone: "text-ink" },
  { label: "Ready", value: 472, tone: "text-success" },
  { label: "Need review", value: 11, tone: "text-warning" },
  { label: "Invalid", value: 4, tone: "text-danger" },
];

const rows = [
  { row: 18, issue: "ZIP code 9021 is too short", field: "Postal code", tone: "text-danger" },
  { row: 142, issue: "Weight is empty", field: "Weight", tone: "text-danger" },
  { row: 305, issue: "Street may be missing a unit number", field: "Address line 1", tone: "text-warning" },
];

export default function BulkShippingPage() {
  return (
    <>
      <PageIntro title="Hundreds of parcels. One upload." status={capabilities.bulk.status}>
        Upload your order file, and Label Nova shows exactly what will ship, what needs attention and what it will cost,
        before anything is charged.
      </PageIntro>
      <Section title="How a bulk run works">
        <Steps
          steps={[
            { title: "Upload", body: "Drop in a CSV or Excel file from your store or spreadsheet." },
            { title: "Map columns", body: "Columns are detected automatically. Confirm or change any match." },
            { title: "Fix problems in place", body: "Bad rows are flagged by field. Edit them without re-uploading." },
            { title: "Generate", body: "Download every label as one print-ready PDF, or a ZIP of files." },
          ]}
        />
      </Section>
      <Section title="Know before you pay" intro="Validation runs on every row before a single label is bought." tone="surface">
        <ExampleFrame caption="Validation summary for an uploaded file">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-menu border border-line bg-line sm:grid-cols-4">
            {summary.map((s) => (
              <div key={s.label} className="bg-surface p-4">
                <dt className="text-[0.8125rem] text-ink-muted">{s.label}</dt>
                <dd className={`mt-1 text-[1.75rem] font-semibold tabular-nums ${s.tone}`}>{s.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[0.875rem]">
              <thead className="text-ink-muted">
                <tr>
                  <th scope="col" className="py-2 pr-4 font-medium">Row</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Field</th>
                  <th scope="col" className="py-2 font-medium">Problem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line border-t border-line">
                {rows.map((r) => (
                  <tr key={r.row}>
                    <td className="py-3 pr-4 font-mono">{r.row}</td>
                    <td className="py-3 pr-4">{r.field}</td>
                    <td className={`py-3 ${r.tone}`}>{r.issue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ExampleFrame>
      </Section>
      <CtaBand title="Ship your whole order file at once." />
    </>
  );
}
