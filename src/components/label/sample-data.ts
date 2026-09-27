import type { LabelData } from "./types";

/**
 * Demo content for marketing surfaces. Tracking numbers use Label Nova's own
 * "LN" format so they can't be mistaken for a real carrier's numbers.
 */
export const sampleLabel: LabelData = {
  brand: "Harbor & Pine",
  service: "Priority 2-Day",
  serviceCode: "P2",
  sender: {
    name: "Harbor & Pine Roasters",
    line1: "418 Wharf Street, Unit 3",
    city: "Portland",
    state: "ME",
    postalCode: "04101",
    country: "US",
  },
  recipient: {
    name: "Amara Okafor",
    company: "Studio Okafor",
    line1: "2210 Alder Avenue, Apt 5B",
    city: "Austin",
    state: "TX",
    postalCode: "78704",
    country: "US",
  },
  weight: "2.4 lb",
  dimensions: "12 × 9 × 4 in",
  shipDate: "2026-09-28",
  trackingNumber: "LN 4829 1057 3316 02",
  reference: "HP-20931",
};
