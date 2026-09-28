import type { Metadata } from "next";
import { CtaBand, ExampleFrame, PageIntro, Section } from "@/components/marketing/page-parts";
import { capabilities } from "@/config/capabilities";

export const metadata: Metadata = { title: "Tracking", description: "One timeline per shipment, built from real carrier scans." };

const events = [
  { status: "Order created", detail: "Order received in Label Nova", done: true },
  { status: "Label created", detail: "Postage bought, label ready to print", done: true },
  { status: "Accepted", detail: "First carrier scan at origin facility", done: true },
  { status: "In transit", detail: "Moving through the carrier network", done: true },
  { status: "Out for delivery", detail: "On the vehicle for final delivery", done: false },
  { status: "Delivered", detail: "Left at the recipient's address", done: false },
];

export default function TrackingPage() {
  return (
    <>
      <PageIntro title="Know where every parcel is." status={capabilities.tracking.status}>
        Each shipment gets one timeline, filled from the carrier&rsquo;s own scan events. If the carrier hasn&rsquo;t scanned
        it, Label Nova doesn&rsquo;t claim it.
      </PageIntro>
      <Section title="One timeline per shipment" intro="The same view for you, your dealer and your customer, each seeing only what they're allowed to.">
        <div className="max-w-[40rem]">
          <ExampleFrame caption="Shipment timeline">
            <ol className="relative">
              {events.map((e, i) => (
                <li key={e.status} className="relative grid grid-cols-[1.5rem_1fr] gap-4 pb-6 last:pb-0">
                  {i < events.length - 1 ? (
                    <span aria-hidden="true" className={`absolute top-4 left-[0.6875rem] h-full w-px ${e.done ? "bg-nova" : "bg-line-strong"}`} />
                  ) : null}
                  <span
                    aria-hidden="true"
                    className={`relative mt-1 size-3.5 justify-self-center rounded-full border-2 ${e.done ? "border-nova bg-nova" : "border-line-strong bg-surface"}`}
                  />
                  <div>
                    <p className={`font-semibold ${e.done ? "" : "text-ink-muted"}`}>
                      {e.status}
                      <span className="sr-only">{e.done ? " (complete)" : " (upcoming)"}</span>
                    </p>
                    <p className="text-[0.9375rem] text-ink-muted">{e.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </ExampleFrame>
        </div>
      </Section>
      <CtaBand title="Put every shipment on one screen." />
    </>
  );
}
