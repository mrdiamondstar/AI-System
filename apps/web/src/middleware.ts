import { NextResponse, type NextRequest } from "next/server";

/**
 * Request-id propagation (doc 08 §5–6): every request gets a stable id, echoed
 * on the response and available to logs/traces so a user-reported issue can be
 * correlated end-to-end. Reuses an inbound id (e.g. from Cloudflare) when
 * present. Static assets are skipped by the matcher.
 */
export function middleware(request: NextRequest): NextResponse {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
