import { prisma, type Prisma } from "@dstarix/db";
import { withDatabase } from "./availability";

/**
 * Programmatic comparison pages (doc 03 §4). Quality gates: both entities
 * published AND sharing at least one category — otherwise the page 404s
 * rather than rendering thin content. Canonical URL uses alphabetical slug
 * order; callers redirect non-canonical order.
 */

const comparisonSelect = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  summary: true,
  pricingModel: true,
  websiteUrl: true,
  lastVerifiedAt: true,
  company: { select: { name: true } },
  score: true,
  pricingPlans: { orderBy: { sortOrder: "asc" as const } },
  categories: { select: { categoryId: true, category: { select: { name: true, slug: true } } } },
} satisfies Prisma.EntitySelect;

export type ComparisonEntity = Prisma.EntityGetPayload<{ select: typeof comparisonSelect }>;

export async function getComparisonPair(
  slugA: string,
  slugB: string,
): Promise<{ a: ComparisonEntity; b: ComparisonEntity } | null> {
  if (slugA === slugB) return null;
  return withDatabase(null, async () => {
    const entities = await prisma.entity.findMany({
      where: { slug: { in: [slugA, slugB] }, status: "PUBLISHED", deletedAt: null },
      select: comparisonSelect,
    });
    const a = entities.find((entity) => entity.slug === slugA);
    const b = entities.find((entity) => entity.slug === slugB);
    if (!a || !b) return null;

    const shared = a.categories.some((ca) =>
      b.categories.some((cb) => cb.categoryId === ca.categoryId),
    );
    if (!shared) return null;

    return { a, b };
  });
}

/** Meaningful pairs for sitemap: top-4 by score per category, pairwise. */
export async function listComparisonPairs(): Promise<Array<{ a: string; b: string }>> {
  return withDatabase([] as Array<{ a: string; b: string }>, async () => {
    const categories = await prisma.category.findMany({
      select: {
        entities: {
          where: { isPrimary: true, entity: { status: "PUBLISHED", deletedAt: null } },
          select: {
            entity: { select: { slug: true, score: { select: { decisionScore: true } } } },
          },
        },
      },
    });

    const pairs = new Set<string>();
    for (const category of categories) {
      const top = category.entities
        .map((row) => row.entity)
        .sort((x, y) => (y.score?.decisionScore ?? 0) - (x.score?.decisionScore ?? 0))
        .slice(0, 4)
        .map((entity) => entity.slug);
      for (let i = 0; i < top.length; i += 1) {
        for (let j = i + 1; j < top.length; j += 1) {
          const [a, b] = [top[i], top[j]].sort() as [string, string];
          pairs.add(`${a}|${b}`);
        }
      }
    }
    return [...pairs].map((key) => {
      const [a, b] = key.split("|") as [string, string];
      return { a, b };
    });
  });
}
