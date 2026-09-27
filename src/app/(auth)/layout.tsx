import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ShippingLabel } from "@/components/label/shipping-label";
import { sampleLabel } from "@/components/label/sample-data";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,560px)]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Link href="/" aria-label="Label Nova home" className="self-start rounded-control">
          <Logo />
        </Link>
        <main id="main" className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[400px]">{children}</div>
        </main>
        <p className="text-[0.8125rem] text-ink-faint">© {new Date().getFullYear()} Label Nova</p>
      </div>

      <aside aria-hidden="true" className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-center lg:px-14">
        <div className="mx-auto w-full max-w-[300px] rotate-[-3deg]">
          <ShippingLabel data={sampleLabel} showBindings={false} />
        </div>
        <p className="mx-auto mt-14 max-w-[22rem] text-center text-lead text-white/70">
          One label or ten thousand. Checked, priced and print-ready before you commit.
        </p>
      </aside>
    </div>
  );
}
