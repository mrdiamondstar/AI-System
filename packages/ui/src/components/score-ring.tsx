import { cn } from "../lib/cn";

/**
 * Decision Score as a circular gauge (doc 07 §1) — the platform's signature
 * trust signal. The arc is drawn with the brand gradient; the value sits at
 * the center. Purely presentational and accessible (labeled).
 */
export function ScoreRing({
  value,
  size = 44,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const stroke = size < 40 ? 3 : 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (clamped / 100) * c;
  const gid = `ds-score-${size}`;

  return (
    <span
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`DStarix Decision Score: ${clamped} out of 100`}
      title={`Decision Score ${clamped}/100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--ds-brand)" />
            <stop offset="55%" stopColor="var(--ds-brand-2)" />
            <stop offset="100%" stopColor="var(--ds-brand-3)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--ds-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <span
        className="absolute font-semibold text-[var(--ds-foreground)]"
        style={{ fontSize: size < 40 ? 11 : 13 }}
      >
        {clamped}
      </span>
    </span>
  );
}
