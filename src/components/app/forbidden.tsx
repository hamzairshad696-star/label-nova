import { ButtonLink } from "@/components/ui/button";

export function Forbidden({ message = "This area is for administrators." }: { message?: string }) {
  return (
    <main id="main" className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-[0.875rem] text-ink-muted">403</p>
      <h1 className="mt-3 text-h2 font-semibold">You don't have access to this page.</h1>
      <p className="mt-3 max-w-[28rem] text-ink-muted">{message} If you think you should, ask your account manager to update your role.</p>
      <ButtonLink href="/app" className="mt-8">
        Go to your workspace
      </ButtonLink>
    </main>
  );
}
