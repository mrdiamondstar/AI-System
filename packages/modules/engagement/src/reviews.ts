import { recordEvent } from "@dstarix/analytics";
import { prisma } from "@dstarix/db";
import { AppError } from "@dstarix/shared";
import { z } from "zod";

/**
 * Reviews (doc 07 §4 v1): the trust backbone. Every submission enters
 * moderation (PENDING); only APPROVED reviews are publicly visible; rating
 * aggregates recompute on every moderation decision. Every moderation action
 * is audit-logged.
 */

const reviewInput = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(30, "Please write at least 30 characters.").max(5000),
});

export type ReviewInput = z.infer<typeof reviewInput>;

export async function submitReview(userId: string, entityId: string, input: ReviewInput) {
  const parsed = reviewInput.safeParse(input);
  if (!parsed.success) {
    throw new AppError("validation_failed", parsed.error.issues[0]?.message ?? "Invalid review.");
  }

  const entity = await prisma.entity.findFirst({
    where: { id: entityId, status: "PUBLISHED", deletedAt: null },
    select: { id: true },
  });
  if (!entity) throw AppError.notFound("Tool");

  // One review per user per entity; resubmitting returns it to moderation.
  const review = await prisma.review.upsert({
    where: { entityId_userId: { entityId, userId } },
    update: { ...parsed.data, status: "PENDING", moderatedBy: null, moderatedAt: null },
    create: { entityId, userId, ...parsed.data },
  });

  recordEvent({ name: "decision_completed", entityId, userId, meta: { via: "review" } });
  return review;
}

export async function listPendingReviews(limit = 50) {
  return prisma.review.findMany({
    where: { status: "PENDING", deletedAt: null },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: {
      entity: { select: { name: true, slug: true } },
      user: { select: { name: true, email: true } },
    },
  });
}

export async function moderateReview(
  moderatorId: string,
  reviewId: string,
  decision: "APPROVED" | "REJECTED",
): Promise<void> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, entityId: true, status: true },
  });
  if (!review) throw AppError.notFound("Review", reviewId);

  await prisma.$transaction([
    prisma.review.update({
      where: { id: reviewId },
      data: { status: decision, moderatedBy: moderatorId, moderatedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: {
        actorId: moderatorId,
        action: `review.${decision.toLowerCase()}`,
        resource: "review",
        resourceId: reviewId,
        before: { status: review.status },
        after: { status: decision },
      },
    }),
  ]);

  await syncRatingAggregates(review.entityId);
}

async function syncRatingAggregates(entityId: string): Promise<void> {
  const aggregate = await prisma.review.aggregate({
    where: { entityId, status: "APPROVED", deletedAt: null },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.entityScore.upsert({
    where: { entityId },
    update: { ratingAvg: aggregate._avg.rating ?? 0, ratingCount: aggregate._count },
    create: { entityId, ratingAvg: aggregate._avg.rating ?? 0, ratingCount: aggregate._count },
  });
}
