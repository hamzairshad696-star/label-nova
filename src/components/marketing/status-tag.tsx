import { statusLabel, type CapabilityStatus } from "@/config/capabilities";
import { cn } from "@/lib/cn";

const tone: Record<CapabilityStatus, string> = {
  available: "text-success bg-success-soft",
  building: "text-ink-muted bg-sunken",
  partner: "text-warning bg-warning-soft",
};
const toneDark: Record<CapabilityStatus, string> = {
  available: "text-[#7ee2b0] bg-[#7ee2b0]/10",
  building: "text-midnight-muted bg-white/[0.06]",
  partner: "text-beacon bg-beacon/10",
};

export function StatusTag({ status, dark, className }: { status: CapabilityStatus; dark?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[0.75rem] font-medium whitespace-nowrap",
        (dark ? toneDark : tone)[status],
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full bg-current", status !== "available" && "opacity-60")} />
      {statusLabel[status]}
    </span>
  );
}
