import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

/** Loading placeholder; size it to match final content to avoid CLS (doc 03 §7). */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-[var(--ds-radius-md)] bg-[var(--ds-surface-muted)]",
        className,
      )}
      {...props}
    />
  );
}
