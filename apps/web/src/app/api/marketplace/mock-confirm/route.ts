import { settleOrder } from "@dstarix/marketplace";
import { getSession } from "@/lib/session";

/**
 * Mock order confirmation — simulates the payment provider webhook in
 * test-credential mode. Real settlement flows exclusively through signed
 * provider webhooks once credentials are configured.
 */
export async function GET(request: Request): Promise<Response> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const session = await getSession();
  if (!session) return Response.redirect(new URL("/login", siteUrl), 302);

  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return Response.redirect(new URL("/marketplace", siteUrl), 302);

  try {
    await settleOrder({
      buyerId: session.user.id,
      slug,
      provider: "mock",
      providerRef: `mock-${session.user.id}-${slug}`,
    });
  } catch {
    return Response.redirect(new URL(`/marketplace/${slug}`, siteUrl), 302);
  }

  return Response.redirect(new URL("/account/purchases", siteUrl), 302);
}
