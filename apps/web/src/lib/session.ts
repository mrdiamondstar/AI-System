import "server-only";
import { headers } from "next/headers";
import { auth } from "@dstarix/identity";

/** Server-side session accessor for RSC pages and server actions. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export type AppRole = "USER" | "PRO" | "VENDOR" | "EDITOR" | "MODERATOR" | "ADMIN" | "SUPERADMIN";

/**
 * Authorization gate (doc 04 §5): returns the session only if the user holds
 * one of the allowed roles; authorization always happens server-side.
 */
export async function requireRole(allowed: AppRole[]) {
  const session = await getSession();
  if (!session) return null;
  const role = (session.user as { role?: string }).role ?? "USER";
  return allowed.includes(role as AppRole) ? session : null;
}
