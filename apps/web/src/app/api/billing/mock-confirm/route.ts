import { applySubscriptionState, activeProvider } from "@dstarix/payments";
import { getSession } from "@/lib/session";

/**
 * Mock checkout confirmation — simulates a provider webhook in test-credential
 * mode only. Disabled the moment a real payment provider is configured; real
 * activation then flows exclusively through signed provider webhooks.
 */
export async function GET(request: Request): Promise<Response> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (activeProvider() !== "mock") {
    return Response.redirect(new URL("/pricing", siteUrl), 302);
  }

  const session = await getSession();
  if (!session) return Response.redirect(new URL("/login", siteUrl), 302);

  const url = new URL(request.url);
  const plan = url.searchParams.get("plan") ?? "pro";
  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await applySubscriptionState({
    userId: session.user.id,
    provider: "mock",
    providerSubId: `mock-${session.user.id}-${plan}`,
    plan,
    status: "ACTIVE",
    currentPeriodEnd: periodEnd,
  });

  return Response.redirect(new URL("/account?upgraded=1", siteUrl), 302);
}
