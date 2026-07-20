import { verifyAndMeter } from "@dstarix/apikeys";
import { isAppError } from "@dstarix/shared";

/**
 * Public API v1 helpers. Bearer-token auth + metering, RFC 9457 problem+json
 * errors, and a stable request-id header on every response.
 */

export interface ApiContext {
  userId: string;
  keyId: string;
  plan: string;
}

function requestId(): string {
  return crypto.randomUUID();
}

export function problem(status: number, code: string, detail: string): Response {
  return Response.json(
    { type: `https://dstarix.com/errors/${code}`, title: code, status, detail },
    {
      status,
      headers: {
        "content-type": "application/problem+json",
        "x-request-id": requestId(),
      },
    },
  );
}

export function ok(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, {
    ...init,
    headers: {
      "cache-control": "public, max-age=60",
      "x-request-id": requestId(),
      ...(init?.headers ?? {}),
    },
  });
}

/** Authenticate a request via `Authorization: Bearer <key>`; meters usage. */
export async function authenticate(request: Request): Promise<ApiContext | Response> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    return problem(401, "unauthorized", "Provide an API key as 'Authorization: Bearer <key>'.");
  }
  try {
    const verified = await verifyAndMeter(token);
    return { userId: verified.userId, keyId: verified.keyId, plan: verified.plan };
  } catch (error) {
    if (isAppError(error)) return problem(error.status, error.code, error.message);
    return problem(500, "internal", "Authentication failed.");
  }
}
