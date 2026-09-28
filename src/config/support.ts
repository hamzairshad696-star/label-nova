/**
 * Support contact details. Phase 13 moves the number into Admin → Settings → Support
 * (database-backed); until then this file is the single place to change it.
 */
export const SUPPORT_WHATSAPP_NUMBER = "18382131490";
export const SUPPORT_WHATSAPP_DISPLAY = "+1 (838) 213-1490";

export const supportMessages = {
  general: "Hello, I need help with Label Nova.",
  account: "Hello, I would like to request a Label Nova account.",
  technical: "Hello, I'm experiencing a technical issue with Label Nova.",
  pricing: "Hello, I have a question about Label Nova pricing.",
  partner: "Hello, I would like to discuss a Label Nova Dealer/Reseller account.",
} as const;

export type SupportTopic = keyof typeof supportMessages;

export function whatsappLink(topic: SupportTopic = "general"): string {
  return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(supportMessages[topic])}`;
}
