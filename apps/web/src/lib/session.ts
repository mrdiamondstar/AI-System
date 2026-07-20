import "server-only";
import { headers } from "next/headers";
import { auth } from "@dstarix/identity";

/** Server-side session accessor for RSC pages and server actions. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
