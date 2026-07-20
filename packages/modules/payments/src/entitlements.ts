import { prisma } from "@dstarix/db";

/**
 * Entitlements service (doc 04 §5). The single source of truth for "can user
 * X use feature Y". Fed by subscription state; checked server-side at every
 * feature gate. Roles are never checked for premium features — entitlements
 * are, so billing state and access can't drift.
 */

export type Feature = "advisor_unlimited" | "premium_content";

export async function hasEntitlement(userId: string, feature: Feature): Promise<boolean> {
  const row = await prisma.entitlement.findUnique({
    where: { userId_feature: { userId, feature } },
    select: { expiresAt: true },
  });
  if (!row) return false;
  return row.expiresAt === null || row.expiresAt > new Date();
}

export async function grantEntitlement(
  userId: string,
  feature: Feature,
  expiresAt: Date | null,
): Promise<void> {
  await prisma.entitlement.upsert({
    where: { userId_feature: { userId, feature } },
    update: { expiresAt },
    create: { userId, feature, expiresAt },
  });
}

export async function revokeEntitlement(userId: string, feature: Feature): Promise<void> {
  await prisma.entitlement
    .delete({ where: { userId_feature: { userId, feature } } })
    .catch(() => undefined);
}

const PLAN_FEATURES: Record<string, Feature[]> = {
  pro: ["advisor_unlimited", "premium_content"],
  team: ["advisor_unlimited", "premium_content"],
};

/** Sync entitlements to match a subscription's active state (idempotent). */
export async function syncEntitlementsForPlan(
  userId: string,
  plan: string,
  active: boolean,
  periodEnd: Date | null,
): Promise<void> {
  const features = PLAN_FEATURES[plan] ?? [];
  for (const feature of features) {
    if (active) await grantEntitlement(userId, feature, periodEnd);
    else await revokeEntitlement(userId, feature);
  }
}
