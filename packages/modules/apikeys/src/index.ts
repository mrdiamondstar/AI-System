import { createHash, randomBytes } from "node:crypto";
import { prisma, type ApiPlan } from "@dstarix/db";
import { AppError } from "@dstarix/shared";

/**
 * Public API key management (doc 04 §3). Keys are shown once at creation and
 * stored only as a SHA-256 hash — a DB compromise never leaks usable keys.
 * The prefix is a public identifier for the dashboard and logs.
 */

const DAILY_QUOTA: Record<ApiPlan, number> = {
  FREE: 1000,
  PRO: 100_000,
  ENTERPRISE: 5_000_000,
};

function hashKey(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

export interface CreatedKey {
  id: string;
  name: string;
  /** Full secret — returned ONCE, never retrievable again. */
  secret: string;
  prefix: string;
}

export async function createApiKey(userId: string, name: string): Promise<CreatedKey> {
  const trimmed = name.trim().slice(0, 60) || "Default";
  const random = randomBytes(24).toString("base64url");
  const prefix = `dsk_live_${randomBytes(4).toString("hex")}`;
  const secret = `${prefix}.${random}`;

  const key = await prisma.apiKey.create({
    data: { userId, name: trimmed, prefix, keyHash: hashKey(secret) },
    select: { id: true, name: true, prefix: true },
  });

  return { id: key.id, name: key.name, secret, prefix: key.prefix };
}

export async function listApiKeys(userId: string) {
  return prisma.apiKey.findMany({
    where: { userId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, prefix: true, plan: true, lastUsedAt: true, createdAt: true },
  });
}

export async function revokeApiKey(userId: string, keyId: string): Promise<void> {
  const result = await prisma.apiKey.updateMany({
    where: { id: keyId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (result.count === 0) throw AppError.notFound("API key", keyId);
}

export interface VerifiedKey {
  keyId: string;
  userId: string;
  plan: ApiPlan;
}

/**
 * Verify a presented key and meter one request against the daily quota.
 * Returns the caller identity, or throws unauthorized/rate_limited.
 */
export async function verifyAndMeter(presented: string): Promise<VerifiedKey> {
  const prefix = presented.split(".")[0];
  if (!prefix) throw new AppError("unauthorized", "Malformed API key.");

  const key = await prisma.apiKey.findUnique({
    where: { prefix },
    select: { id: true, userId: true, plan: true, keyHash: true, revokedAt: true },
  });
  if (!key || key.revokedAt || key.keyHash !== hashKey(presented)) {
    throw new AppError("unauthorized", "Invalid API key.");
  }

  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);

  const usage = await prisma.apiUsageDay.upsert({
    where: { apiKeyId_day: { apiKeyId: key.id, day } },
    update: { count: { increment: 1 } },
    create: { apiKeyId: key.id, day, count: 1 },
    select: { count: true },
  });

  if (usage.count > DAILY_QUOTA[key.plan]) {
    throw new AppError("rate_limited", "Daily API quota exceeded for your plan.");
  }

  // Fire-and-forget last-used stamp (not on the hot path).
  void prisma.apiKey
    .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
    .catch(() => undefined);

  return { keyId: key.id, userId: key.userId, plan: key.plan };
}

export function quotaFor(plan: ApiPlan): number {
  return DAILY_QUOTA[plan];
}
