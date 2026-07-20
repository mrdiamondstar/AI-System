import { prisma } from "@dstarix/db";
import { withDatabase } from "./availability";

/**
 * Collections (doc 07 §4 community v1): curated + user-published lists of
 * entities. Public reads show PUBLISHED collections only; editorial ones are
 * the SEO/trust asset, user ones are the habit loop.
 */

export async function listPublishedCollections(limit = 24) {
  return withDatabase([], async () =>
    prisma.collection.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ isEditorial: "desc" }, { updatedAt: "desc" }],
      take: limit,
      select: {
        slug: true,
        title: true,
        description: true,
        isEditorial: true,
        _count: { select: { items: true } },
      },
    }),
  );
}

export async function getCollectionBySlug(slug: string) {
  return withDatabase(null, async () =>
    prisma.collection.findFirst({
      where: { slug, status: "PUBLISHED" },
      select: {
        slug: true,
        title: true,
        description: true,
        isEditorial: true,
        updatedAt: true,
        items: {
          orderBy: { sortOrder: "asc" },
          select: {
            note: true,
            entity: {
              select: {
                id: true,
                slug: true,
                name: true,
                tagline: true,
                type: true,
                pricingModel: true,
                lastVerifiedAt: true,
                company: { select: { name: true, slug: true } },
                score: { select: { decisionScore: true, ratingAvg: true, ratingCount: true } },
                categories: {
                  where: { isPrimary: true },
                  select: { category: { select: { name: true, slug: true } } },
                },
              },
            },
          },
        },
      },
    }),
  );
}

export async function listPublishedCollectionSlugs(): Promise<
  Array<{ slug: string; updatedAt: Date }>
> {
  return withDatabase([] as Array<{ slug: string; updatedAt: Date }>, async () =>
    prisma.collection.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    }),
  );
}
