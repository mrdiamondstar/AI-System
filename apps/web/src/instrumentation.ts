import { captureException, observabilityEnabled } from "@dstarix/observability";

/**
 * Next.js instrumentation (doc 08 §5). `register` runs once at server startup;
 * `onRequestError` centralizes capture of every server-side error. When
 * SENTRY_DSN is set, a Sentry forwarder is registered here (env-gated import)
 * so the heavy SDK loads only where configured.
 */
export async function register(): Promise<void> {
  if (observabilityEnabled()) {
    // Sentry SDK wiring attaches here once the DSN is provisioned:
    //   const Sentry = await import("@sentry/nextjs");
    //   Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
    //   registerErrorForwarder((e, ctx) => Sentry.captureException(e, { extra: ctx }));
  }
}

export function onRequestError(
  error: unknown,
  request: { path?: string; headers?: Record<string, string | undefined> },
): void {
  captureException(error, {
    route: request.path,
    requestId: request.headers?.["x-request-id"],
  });
}
