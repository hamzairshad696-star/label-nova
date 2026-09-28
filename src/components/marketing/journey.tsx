import { Container } from "@/components/ui/container";
import { capabilities, type CapabilityKey } from "@/config/capabilities";
import { StatusTag } from "./status-tag";

export const journey: { step: string; title: string; body: string; capability: CapabilityKey }[] = [
  { step: "Order", title: "One record from the start", body: "Each shipment begins as an order that carries the recipient, package and reference all the way through.", capability: "orders" },
  { step: "Rate", title: "Compare before you commit", body: "See services side by side at your account's price, with delivery time and the best value marked.", capability: "rates" },
  { step: "Label", title: "Print-ready, first time", body: "Vector PDF labels with scannable Code 128 barcodes, sized for thermal or sheet printers.", capability: "labels" },
  { step: "Carrier", title: "Postage bought properly", body: "Carrier labels are purchased through an authorised partner, so they scan cleanly in the carrier's network.", capability: "carriers" },
  { step: "Tracking", title: "Status from real scans", body: "Every shipment shows the carrier's own scan events on one timeline. Nothing is guessed.", capability: "tracking" },
  { step: "Delivered", title: "Closed and accounted for", body: "The shipment closes with its final cost recorded against your wallet ledger.", capability: "wallet" },
];

export function Journey() {
  return (
    <section aria-labelledby="journey-title" className="py-24 lg:py-32">
      <Container className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 id="journey-title" className="text-h2 font-semibold text-balance">
            Six steps. One continuous record.
          </h2>
          <p className="mt-4 max-w-[28rem] text-lead text-ink-muted">
            Most shipping tools stop at the label. Label Nova follows the parcel until it arrives, and tells you honestly
            which steps are live today.
          </p>
        </div>
        <ol className="border-t border-line">
          {journey.map((j, i) => (
            <li key={j.step} className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-b border-line py-7 sm:grid-cols-[3rem_1fr_auto]">
              <span className="pt-0.5 font-mono text-[0.875rem] text-ink-faint" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-[0.875rem] font-medium text-nova">{j.step}</p>
                <h3 className="mt-1 text-h3 font-semibold">{j.title}</h3>
                <p className="mt-2 max-w-[34rem] text-ink-muted">{j.body}</p>
              </div>
              <StatusTag status={capabilities[j.capability].status} className="col-start-2 mt-4 justify-self-start sm:col-start-3 sm:mt-1" />
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
