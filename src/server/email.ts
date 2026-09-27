import "server-only";

interface Email {
  to: string;
  subject: string;
  text: string;
}

/**
 * Sends through Resend when RESEND_API_KEY is set. Otherwise (or when EMAIL_TRANSPORT=console)
 * the message is printed to the server log — fine for development, never for production.
 */
export async function sendEmail({ to, subject, text }: Email): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const forceConsole = process.env.EMAIL_TRANSPORT === "console";

  if (!apiKey || forceConsole) {
    if (process.env.NODE_ENV === "production" && !forceConsole) {
      console.warn(`[email] RESEND_API_KEY is not set; "${subject}" to ${to} was not sent.`);
      return;
    }
    console.log(`\n[email] To: ${to}\n[email] Subject: ${subject}\n${text}\n`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Label Nova <onboarding@resend.dev>",
      to: [to],
      subject,
      text,
    }),
  });
  if (!res.ok) console.error(`[email] Resend responded ${res.status}: ${await res.text().catch(() => "")}`);
}
