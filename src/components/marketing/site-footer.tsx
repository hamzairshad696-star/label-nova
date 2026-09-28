import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { footerNav } from "@/config/site";
import { SUPPORT_WHATSAPP_DISPLAY, whatsappLink } from "@/config/support";

export function SiteFooter() {
  return (
    <footer className="border-t border-midnight-line bg-midnight text-midnight-muted">
      <Container className="grid gap-12 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo tone="dark" />
          <p className="mt-4 max-w-[30ch] text-[0.9375rem]">One platform for the whole shipping journey, from order to doorstep.</p>
          <a
            href={whatsappLink("general")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block text-[0.9375rem] text-midnight-ink underline-offset-4 hover:underline"
          >
            WhatsApp {SUPPORT_WHATSAPP_DISPLAY}
          </a>
        </div>
        {footerNav.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-[0.875rem] font-semibold text-midnight-ink">{col.title}</h2>
            <ul className="mt-4 grid gap-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[0.9375rem] transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      <Container className="border-t border-midnight-line py-6 text-[0.8125rem]">
        © {new Date().getFullYear()} Label Nova
      </Container>
    </footer>
  );
}
