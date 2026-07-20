import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[var(--ds-radius-md)] border border-[var(--ds-border-strong)] bg-[var(--ds-surface)] px-3.5",
        "text-sm text-[var(--ds-foreground)] placeholder:text-[var(--ds-muted-foreground)]",
        "shadow-[var(--ds-shadow-sm)] outline-none",
        "transition-[box-shadow,border-color] duration-[var(--ds-duration-fast)]",
        "focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-[var(--ds-ring)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
