import { prisma } from "@dstarix/db";
import { sendNewsletterConfirmation } from "@dstarix/notifications";
import { AppError } from "@dstarix/shared";
import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().email().max(254);

export type SubscribeResult = { status: "subscribed" | "already_subscribed" };

/**
 * Newsletter signup (Phase 1 KPI: newsletter growth). Double-opt-in email
 * dispatch attaches here once the notifications module ships; until then
 * subscribers are stored as PENDING with source attribution.
 */
export async function subscribeToNewsletter(
  rawEmail: string,
  source = "homepage",
): Promise<SubscribeResult> {
  const parsed = emailSchema.safeParse(rawEmail);
  if (!parsed.success) {
    throw new AppError("validation_failed", "Please enter a valid email address.");
  }

  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email: parsed.data },
    select: { id: true, status: true },
  });

  if (existing && existing.status !== "UNSUBSCRIBED") {
    return { status: "already_subscribed" };
  }

  await prisma.newsletterSubscriber.upsert({
    where: { email: parsed.data },
    update: { status: "PENDING", source },
    create: { email: parsed.data, source },
  });

  // Double opt-in confirmation (email dispatch is fire-and-forget — a mail
  // failure must not fail the subscription write).
  void sendNewsletterConfirmation(parsed.data).catch(() => undefined);

  return { status: "subscribed" };
}
