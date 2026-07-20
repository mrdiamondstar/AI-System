import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 font-medium select-none",
    "rounded-[var(--ds-radius-md)] outline-none",
    "transition-[background-color,border-color,box-shadow,transform] duration-[var(--ds-duration-fast)] ease-[var(--ds-ease)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--ds-brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-background)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98]",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--ds-brand)] text-[var(--ds-brand-foreground)] hover:bg-[var(--ds-brand-hover)] shadow-[var(--ds-shadow-sm)]",
        secondary:
          "bg-[var(--ds-surface)] text-[var(--ds-foreground)] border border-[var(--ds-border)] hover:bg-[var(--ds-surface-muted)]",
        ghost: "text-[var(--ds-foreground)] hover:bg-[var(--ds-surface-muted)]",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
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
