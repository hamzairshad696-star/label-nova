import type { ReactNode } from "react";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

type Tone = "danger" | "success" | "info" | "warning";

const tones: Record<Tone, string> = {
  danger: "bg-danger-soft text-danger",
  success: "bg-success-soft text-success",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
};

/** Inline message. Errors are announced immediately (role=alert); others politely. */
export function Alert({ tone = "info", title, children, className }: { tone?: Tone; title?: string; children?: ReactNode; className?: string }) {
  const Icon = tone === "success" ? Icons.check : Icons.alert;
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-menu px-4 py-3 text-[0.875rem] leading-snug", tones[tone], className)}
    >
      <Icon className="mt-px shrink-0" />
      <div className="text-ink">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={title ? "mt-0.5 text-ink-muted" : ""}>{children}</div> : null}
      </div>
    </div>
  );
}
