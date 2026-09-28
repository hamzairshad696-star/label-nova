import { writeFileSync } from "node:fs";
import { renderLabelPdf, type LabelFormat } from "../src/server/labels/render";
import { formatLabelNumber } from "../src/server/labels/numbering";
(async () => {
  const base = {
    labelNumber: formatLabelNumber(17),
    from: { name: "Harbor & Pine Roasters", company: null, line1: "418 Wharf Street, Unit 3", line2: null, city: "Portland", state: "ME", postalCode: "04101", country: "US" },
    carrierName: "Label Nova", serviceName: "Standard label", weightOz: 38, dims: { l: 12, w: 9, h: 4 }, reference: "ORD-1001", createdAt: new Date("2026-09-28T12:00:00Z"),
  };
  const long = { ...base, to: { name: "José Müller-Łukasiewicz", company: "Studio Okafor & Partners International Holdings", line1: "2210 Alder Avenue", line2: "Apt 5B", city: "Austin", state: "TX", postalCode: "78704", country: "US" } };
  const short = { ...base, dims: null, reference: null, to: { name: "Ada Lee", company: null, line1: "1 Main St", line2: null, city: "Reno", state: "NV", postalCode: "89501", country: "US" } };
  for (const f of ["4x6", "4x4", "2x1", "letter"] as LabelFormat[]) writeFileSync(`/tmp/label-${f}.pdf`, await renderLabelPdf(long, f));
  writeFileSync(`/tmp/label-4x4-short.pdf`, await renderLabelPdf(short, "4x4"));
  console.log("rendered");
})();
