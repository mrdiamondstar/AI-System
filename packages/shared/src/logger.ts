import pino from "pino";

/**
 * Structured JSON logger (doc 08 §6). Levels are used honestly:
 * error = pages someone · warn = actionable · info = state changes · debug = dev only.
 * Redaction guards against accidental secret/PII logging.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  redact: {
    paths: ["*.password", "*.token", "*.secret", "*.authorization", "*.cookie", "req.headers"],
    censor: "[redacted]",
  },
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});

export type Logger = typeof logger;

/** Child logger scoped to a module or request; always carry a scope name. */
export function scopedLogger(scope: string, bindings: Record<string, unknown> = {}): Logger {
  return logger.child({ scope, ...bindings });
}
