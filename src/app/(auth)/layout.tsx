import Link from "next/link";
import { AuthBackdrop } from "@/components/auth/auth-backdrop";
import { Logo } from "@/components/brand/logo";
import { whatsappLink } from "@/config/support";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-midnight">
      <AuthBackdrop />
      <header className="relative flex justify-center px-5 pt-10 sm:pt-14">
        <Link href="/" aria-label="Label Nova home" className="rounded-control">
          <Logo tone="dark" />
        </Link>
      </header>
      <main id="main" className="relative flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-[420px] rounded-panel bg-surface p-7 shadow-[0_24px_64px_-24px_rgb(0_0_0/0.6)] sm:p-9">{children}</div>
      </main>
      <footer className="relative flex flex-wrap justify-center gap-x-5 gap-y-1 px-5 pb-8 text-[0.8125rem] text-midnight-muted">
        <span>© {new Date().getFullYear()} Label Nova</span>
        <a href={whatsappLink("technical")} target="_blank" rel="noopener noreferrer" className="hover:text-white">
          Trouble signing in? WhatsApp support
        </a>
      </footer>
    </div>
  );
}
