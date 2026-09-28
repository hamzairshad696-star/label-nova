const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Integer cents → "$1,234.56". Never do money maths in floating point; only format with this. */
export function formatCents(cents: number, currency = "USD"): string {
  if (currency !== "USD") return `${(cents / 100).toFixed(2)} ${currency}`;
  return usd.format(cents / 100);
}
