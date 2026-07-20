import { prisma } from "@dstarix/db";
import { scopedLogger } from "@dstarix/shared";
import { syncEntitlementsForPlan } from "./entitlements";

export {
  hasEntitlement,
  grantEntitlement,
  revokeEntitlement,
  syncEntitlementsForPlan,
  type Feature,
} from "./entitlements";

const log = scopedLogger("payments");

/**
 * Payments (doc 07 §8, ADR-011). Provider-agnostic internal model. Real
 * providers (Razorpay for INR, Paddle MoR for global) attach via env-selected
 * checkout + webhook adapters; until then MockProvider issues a checkout URL
 * and a webhook helper drives the full activate→entitlement flow so the
 * premium path is exercisable end-to-end.
 */

export type PaymentProviderName = "razorpay" | "paddle" | "mock";

export function activeProvider(): PaymentProviderName {
  if (process.env.RAZORPAY_KEY_ID) return "razorpay";
  if (process.env.PADDLE_API_KEY) return "paddle";
  return "mock";
}

export interface CheckoutSession {
  provider: PaymentProviderName;
  url: string;
}

/**
 * Begin a checkout. In mock mode the URL points at an internal confirm route
 * that simulates a provider webhook. Real adapters return the hosted checkout
 * URL of the selected provider.
 */
export function createCheckout(userId: string, plan: string): CheckoutSession {
  const provider = activeProvider();
  if (provider === "mock") {
    return { provider, url: `/api/billing/mock-confirm?plan=${plan}&user=${userId}` };
  }
  // Real hosted-checkout creation lands with provider credentials.
  return { provider, url: `/pricing?provider=${provider}` };
}

/**
 * Apply a subscription state change (the webhook path — the source of truth).
 * Idempotent on providerSubId; drives entitlement sync.
 */
export async function applySubscriptionState(input: {
  userId: string;
  provider: PaymentProviderName;
  providerSubId: string;
  plan: string;
  status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED";
  currentPeriodEnd: Date | null;
}): Promise<void> {
  await prisma.subscription.upsert({
    where: { providerSubId: input.providerSubId },
    update: {
      status: input.status,
      plan: input.plan,
      currentPeriodEnd: input.currentPeriodEnd,
    },
    create: {
      userId: input.userId,
      provider: input.provider,
      providerSubId: input.providerSubId,
      plan: input.plan,
      status: input.status,
      currentPeriodEnd: input.currentPeriodEnd,
    },
  });

  const active = input.status === "ACTIVE" || input.status === "TRIALING";
  await syncEntitlementsForPlan(input.userId, input.plan, active, input.currentPeriodEnd);
  log.info(
    { userId: input.userId, plan: input.plan, status: input.status, provider: input.provider },
    "subscription state applied",
  );
}

export async function getActiveSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: { userId, status: { in: ["ACTIVE", "TRIALING"] } },
    orderBy: { createdAt: "desc" },
    select: { plan: true, status: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
  });
}
