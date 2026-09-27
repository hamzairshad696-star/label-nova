import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-[0.875rem] text-ink-muted">404</p>
      <h1 className="mt-3 text-h2 font-semibold">This page doesn't exist.</h1>
      <p className="mt-3 max-w-[28rem] text-ink-muted">The link may be old, or the address may have a typo.</p>
      <ButtonLink href="/" className="mt-8">
        Back to Label Nova
      </ButtonLink>
    </main>
  );
}
