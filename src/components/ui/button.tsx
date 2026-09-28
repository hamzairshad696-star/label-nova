import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "outlineDark";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none rounded-control " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out " +
  "disabled:pointer-events-none disabled:opacity-50 active:translate-y-px";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-surface hover:bg-[#2a2d35] shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]",
  secondary: "bg-surface text-ink border border-line-strong hover:border-ink/40 hover:bg-paper",
  ghost: "text-ink hover:bg-sunken",
  accent: "bg-nova text-white hover:bg-nova-strong shadow-[inset_0_1px_0_rgb(255_255_255/0.14)]",
  outlineDark: "border border-white/20 text-white hover:bg-white/10 hover:border-white/35",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[0.8125rem]",
  md: "h-10 px-4 text-[0.9375rem]",
  lg: "h-12 px-5 text-base",
};

interface StyleProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

export function buttonStyles({ variant = "primary", size = "md", className }: StyleProps) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = StyleProps & ComponentProps<"button"> & { children: ReactNode };
export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />;
}

type ButtonLinkProps = StyleProps & ComponentProps<typeof Link> & { children: ReactNode };
export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonStyles({ variant, size, className })} {...props} />;
}
