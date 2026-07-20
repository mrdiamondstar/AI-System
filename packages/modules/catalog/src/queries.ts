import { prisma, type Prisma, type EntityStatus } from "@dstarix/db";
import { withDatabase } from "./availability";

/**
 * Catalog read layer (doc 07 §1). All reads are status-scoped to PUBLISHED —
 * draft/archived entities are invisible outside the admin surface.
 */

const PUBLISHED: EntityStatus = "PUBLISHED";

const entityCardSelect = {
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
} satisfies Prisma.EntitySelect;

export type EntityCard = Prisma.EntityGetPayload<{ select: typeof entityCardSelect }>;

export async function getEntityBySlug(slug: string) {
  return withDatabase(null, async () => {
    return prisma.entity.findFirst({
      where: { slug, status: PUBLISHED, deletedAt: null },
      include: {
        company: true,
        score: true,
        pricingPlans: { orderBy: { sortOrder: "asc" } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        reviews: {
          where: { status: "APPROVED", deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { user: { select: { name: true, handle: true } } },
        },
      },
    });
  });
}

/** Alternatives: best-scored published entities sharing the primary category. */
export async function getAlternatives(entityId: string, limit = 6): Promise<EntityCard[]> {
  return withDatabase([] as EntityCard[], async () => {
    const primary = await prisma.entityCategory.findFirst({
      where: { entityId, isPrimary: true },
      select: { categoryId: true },
    });
    if (!primary) return [];
    return prisma.entity.findMany({
      where: {
        id: { not: entityId },
        status: PUBLISHED,
        deletedAt: null,
        categories: { some: { categoryId: primary.categoryId } },
      },
      select: entityCardSelect,
      orderBy: { score: { decisionScore: "desc" } },
      take: limit,
    });
  });
}

export async function listCategories() {
  return withDatabase([], async () =>
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
      select: {
        slug: true,
        name: true,
        description: true,
        _count: { select: { entities: true } },
      },
    }),
  );
}

export async function getCategoryWithEntities(slug: string, limit = 24) {
  return withDatabase(null, async () => {
    const category = await prisma.category.findUnique({
      where: { slug },
      select: { id: true, slug: true, name: true, description: true },
    });
    if (!category) return null;
    const entities = await prisma.entity.findMany({
      where: {
        status: PUBLISHED,
        deletedAt: null,
        categories: { some: { categoryId: category.id } },
      },
      select: entityCardSelect,
      orderBy: { score: { decisionScore: "desc" } },
      take: limit,
    });
    return { category, entities };
  });
}

export async function getTopEntities(limit = 8): Promise<EntityCard[]> {
  return withDatabase([] as EntityCard[], async () =>
    prisma.entity.findMany({
      where: { status: PUBLISHED, deletedAt: null },
      select: entityCardSelect,
      orderBy: { score: { decisionScore: "desc" } },
      take: limit,
    }),
  );
}

export async function getNewEntities(limit = 8): Promise<EntityCard[]> {
  return withDatabase([] as EntityCard[], async () =>
    prisma.entity.findMany({
      where: { status: PUBLISHED, deletedAt: null },
      select: entityCardSelect,
      orderBy: { publishedAt: "desc" },
      take: limit,
    }),
  );
}

export async function listPublishedSlugs(): Promise<Array<{ slug: string; updatedAt: Date }>> {
  return withDatabase([] as Array<{ slug: string; updatedAt: Date }>, async () =>
    prisma.entity.findMany({
      where: { status: PUBLISHED, deletedAt: null },
      select: { slug: true, updatedAt: true },
    }),
  );
}

/** Slug 301 lookup (doc 03 §4). */
export async function resolveSlugRedirect(kind: string, fromSlug: string) {
  return withDatabase(null, async () =>
    prisma.slugRedirect.findUnique({
      where: { entityKind_fromSlug: { entityKind: kind, fromSlug } },
      select: { toSlug: true },
    }),
  );
}
