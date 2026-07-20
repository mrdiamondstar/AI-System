/** Liveness probe for uptime monitoring (doc 08 §5). */
export function GET(): Response {
  return Response.json({ status: "ok", service: "web", time: new Date().toISOString() });
}
