import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Icons } from "@/components/ui/icons";

const capabilities = [
  { icon: Icons.code, title: "REST API", body: "Create labels, fetch orders and start bulk jobs from your own systems." },
  { icon: Icons.key, title: "Scoped API keys", body: "Create a key per integration, limit what it can do, revoke it instantly." },
  { icon: Icons.bolt, title: "Notifications", body: "Hear when a bulk job finishes, a payment lands or your balance runs low." },
  { icon: Icons.chart, title: "Analytics", body: "Labels, orders and spend over time, broken down by template and user." },
];

const request = `curl https://api.labelnova.com/v1/labels \\
  -H "Authorization: Bearer ln_live_••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{
    "template": "premium-shipping-4x6",
    "data": {
      "recipient_name": "Amara Okafor",
      "recipient_address": "2210 Alder Avenue",
      "recipient_zip": "78704",
      "service": "Priority 2-Day"
    }
  }'`;

const response = `{
  "id": "lbl_8Hq2mV0c",
  "order_id": "LN-26-004813",
  "status": "rendered",
  "pdf_url": "https://files.labelnova.com/…",
  "charged": { "amount": 5, "currency": "usd" }
}`;

export function Automation() {
  return (
    <section id="api" aria-labelledby="api-title" className="border-t border-line py-24 lg:py-32">
      <Container className="grid items-start gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div>
          <SectionHeader
            id="api-title"
            title="Automate it when you're ready."
            intro="Everything you can do in the dashboard, your systems can do through the API — with the same templates, prices and history."
          />
          <ul className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {capabilities.map(({ icon: Icon, title, body }) => (
              <li key={title}>
                <Icon className="text-nova" />
                <h3 className="mt-3 text-[1rem] font-semibold">{title}</h3>
                <p className="mt-1 text-[0.9375rem] text-ink-muted">{body}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="overflow-hidden rounded-panel bg-ink text-[0.8125rem] text-white/85">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <span className="font-medium text-white">Create a label</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[0.75rem]">POST /v1/labels</span>
          </div>
          <pre className="overflow-x-auto px-5 py-5 font-mono leading-relaxed"><code>{request}</code></pre>
          <div className="border-t border-white/10 px-5 py-3 text-white/60">
            Response <span className="ml-2 font-mono text-[#8ce6b4]">201 Created</span>
          </div>
          <pre className="overflow-x-auto px-5 pb-5 font-mono leading-relaxed"><code>{response}</code></pre>
        </div>
      </Container>
    </section>
  );
}
