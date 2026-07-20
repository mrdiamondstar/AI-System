import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-[var(--ds-radius-md)] border border-[var(--ds-border)] bg-[var(--ds-surface)] px-3",
        "text-sm text-[var(--ds-foreground)] placeholder:text-[var(--ds-muted-foreground)]",
        "outline-none transition-shadow duration-[var(--ds-duration-fast)]",
        "focus-visible:ring-2 focus-visible:ring-[var(--ds-brand)] focus-visible:border-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
