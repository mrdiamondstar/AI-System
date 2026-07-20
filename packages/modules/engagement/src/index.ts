import { recordEvent } from "@dstarix/analytics";
import { prisma } from "@dstarix/db";

export { submitReview, listPendingReviews, moderateReview, type ReviewInput } from "./reviews";

/**
 * Engagement module: bookmarks (Phase 2 habit loop). Collections and reviews
 * join this module next. Score aggregates (bookmark_count) are recomputed
 * here inline for now; the event-consumer recompute takes over when the
 * worker consumers ship.
 */

export async function toggleBookmark(
  userId: string,
  entityId: string,
): Promise<{ bookmarked: boolean }> {
  const existing = await prisma.bookmark.findUnique({
    where: { userId_entityId: { userId, entityId } },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { userId_entityId: { userId, entityId } } });
    await syncBookmarkCount(entityId);
    recordEvent({ name: "bookmark_removed", entityId, userId });
    return { bookmarked: false };
  }

  await prisma.bookmark.create({ data: { userId, entityId } });
  await syncBookmarkCount(entityId);
  recordEvent({ name: "bookmark_added", entityId, userId });
  return { bookmarked: true };
}

export async function isBookmarked(userId: string, entityId: string): Promise<boolean> {
  const found = await prisma.bookmark.findUnique({
    where: { userId_entityId: { userId, entityId } },
    select: { userId: true },
  });
  return Boolean(found);
}

export async function listBookmarks(userId: string) {
  return prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      entity: {
        select: {
          slug: true,
          name: true,
          tagline: true,
          score: { select: { decisionScore: true } },
        },
      },
    },
  });
}

async function syncBookmarkCount(entityId: string): Promise<void> {
  const count = await prisma.bookmark.count({ where: { entityId } });
  await prisma.entityScore.upsert({
    where: { entityId },
    update: { bookmarkCount: count },
    create: { entityId, bookmarkCount: count },
  });
}
