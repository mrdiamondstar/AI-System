import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 font-medium select-none whitespace-nowrap",
    "rounded-[var(--ds-radius-md)] outline-none",
    "transition-[transform,box-shadow,background-color,border-color,opacity] duration-[var(--ds-duration-fast)] ease-[var(--ds-ease)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--ds-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-background)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.97]",
  ],
  {
    variants: {
      variant: {
        primary: [
          "text-[var(--ds-brand-foreground)] [background:var(--ds-gradient-brand)]",
          "shadow-[var(--ds-shadow-sm)] hover:shadow-[var(--ds-glow)] hover:-translate-y-0.5",
        ],
        secondary:
          "bg-[var(--ds-surface)] text-[var(--ds-foreground)] border border-[var(--ds-border-strong)] hover:bg-[var(--ds-surface-muted)] hover:-translate-y-0.5 shadow-[var(--ds-shadow-sm)]",
        ghost: "text-[var(--ds-foreground)] hover:bg-[var(--ds-surface-muted)]",
        outline:
          "border border-[var(--ds-border-strong)] text-[var(--ds-foreground)] hover:border-[var(--ds-brand)] hover:text-[var(--ds-brand)]",
      },
      size: {
        sm: "h-9 px-3.5 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-[3.25rem] px-7 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
