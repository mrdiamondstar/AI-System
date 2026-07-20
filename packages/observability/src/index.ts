import { scopedLogger } from "@dstarix/shared";

/**
 * Observability seam (doc 08 §5–6). Error/message capture routes through the
 * structured logger today (which ships to the log sink in production) and is
 * ready for a Sentry adapter: when SENTRY_DSN is configured, `captureException`
 * additionally forwards there. The rest of the app depends only on this
 * interface, so wiring the real SDK is an isolated, env-gated change (the same
 * provider-abstraction pattern as ai-gateway and payments).
 */

const log = scopedLogger("observability");

export interface ErrorContext {
  requestId?: string;
  userId?: string;
  route?: string;
  [key: string]: unknown;
}

let sentryForward: ((error: unknown, context?: ErrorContext) => void) | undefined;

/**
 * Register a Sentry (or other APM) forwarder. Called from instrumentation when
 * SENTRY_DSN is present; a no-op otherwise. Kept as a hook so the heavy SDK is
 * only imported where the runtime supports it.
 */
export function registerErrorForwarder(
  forwarder: (error: unknown, context?: ErrorContext) => void,
): void {
  sentryForward = forwarder;
  log.info("error forwarder registered");
}

export function captureException(error: unknown, context: ErrorContext = {}): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  log.error({ ...context, err: { message, stack } }, "captured exception");
  sentryForward?.(error, context);
}

export function captureMessage(message: string, context: ErrorContext = {}): void {
  log.warn({ ...context }, message);
}

export function observabilityEnabled(): boolean {
  return Boolean(process.env.SENTRY_DSN);
}
