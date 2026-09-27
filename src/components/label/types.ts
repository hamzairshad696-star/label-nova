export interface Address {
  name: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface LabelData {
  brand: string;
  service: string;
  serviceCode: string;
  sender: Address;
  recipient: Address;
  weight: string;
  dimensions: string;
  shipDate: string;
  trackingNumber: string;
  reference: string;
}

/** Regions of the label that can be highlighted and are bound to template fields. */
export type LabelRegion = "logo" | "service" | "sender" | "recipient" | "package" | "barcode" | "reference";

/** The template placeholder each region is bound to — shown on hover to explain data binding. */
export const regionBindings: Record<LabelRegion, string> = {
  logo: "{{brand_logo}}",
  service: "{{service}}",
  sender: "{{sender_address}}",
  recipient: "{{recipient_address}}",
  package: "{{weight}} · {{dimensions}}",
  barcode: "{{tracking_number}}",
  reference: "{{order_id}}",
};
