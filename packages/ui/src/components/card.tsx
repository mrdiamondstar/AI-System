import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Interactive cards lift and glow on hover. */
  interactive?: boolean;
}

export function Card({ className, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--ds-radius-lg)] border border-[var(--ds-border)] bg-[var(--ds-surface)]",
        "shadow-[var(--ds-shadow-sm)] transition-[transform,box-shadow,border-color] duration-[var(--ds-duration-base)] ease-[var(--ds-ease)]",
        interactive &&
          "hover:-translate-y-1 hover:border-[var(--ds-border-strong)] hover:shadow-[var(--ds-shadow-lg)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-base font-semibold leading-tight tracking-[-0.01em] text-[var(--ds-foreground)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("p-6 pt-0 text-sm text-[var(--ds-muted-foreground)]", className)}
      {...props}
    />
  );
}
