import { prisma } from "@dstarix/db";
import { withDatabase } from "./availability";
import { semanticEntityIds } from "./embeddings";

export interface SearchResult {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  type: string;
  pricingModel: string;
  decisionScore: number | null;
  rank: number;
}

/**
 * AI Discovery Engine search (ADR-003). Hybrid retrieval: Postgres FTS +
 * trigram (lexical) fused with pgvector semantic nearest-neighbors via
 * Reciprocal Rank Fusion, then nudged by Decision Score. Semantic is
 * best-effort — if no embeddings exist yet, it degrades cleanly to lexical.
 * The Meilisearch swap (Phase 2) stays behind this same signature.
 */
export async function searchEntities(rawQuery: string, limit = 20): Promise<SearchResult[]> {
  const query = rawQuery.trim().slice(0, 200);
  if (!query) return [];

  return withDatabase([] as SearchResult[], async () => {
    const poolSize = Math.max(limit * 3, 30);
    const [lexical, semantic] = await Promise.all([
      lexicalSearch(query, poolSize),
      semanticEntityIds(query, poolSize),
    ]);

    // Reciprocal Rank Fusion (k = 60, standard).
    const K = 60;
    const scores = new Map<string, number>();
    lexical.forEach((row, index) => {
      scores.set(row.id, (scores.get(row.id) ?? 0) + 1 / (K + index));
    });
    semantic.forEach((hit, index) => {
      scores.set(hit.id, (scores.get(hit.id) ?? 0) + 1 / (K + index));
    });

    // Hydrate any semantic-only hits so fused results carry full card data.
    const lexicalById = new Map(lexical.map((row) => [row.id, row]));
    const missingIds = [...scores.keys()].filter((id) => !lexicalById.has(id));
    const hydrated = missingIds.length > 0 ? await hydrate(missingIds) : [];
    const byId = new Map<string, SearchResult>([
      ...lexical.map((row) => [row.id, row] as const),
      ...hydrated.map((row) => [row.id, row] as const),
    ]);

    return [...scores.entries()]
      .map(([id, fused]) => {
        const row = byId.get(id);
        if (!row) return null;
        // Blend fused relevance with a small Decision Score nudge.
        const rank = fused + (row.decisionScore ?? 0) / 100 / 50;
        return { ...row, rank };
      })
      .filter((row): row is SearchResult => row !== null)
      .sort((a, b) => b.rank - a.rank)
      .slice(0, limit);
  });
}

/** Lexical primitive: FTS websearch + trigram fallback, business-ranked. */
async function lexicalSearch(query: string, limit: number): Promise<SearchResult[]> {
  return prisma.$queryRaw<SearchResult[]>`
    SELECT
      e.id, e.slug, e.name, e.tagline,
      e.type::text AS "type",
      e.pricing_model::text AS "pricingModel",
      s.decision_score AS "decisionScore",
      (
        ts_rank(
          to_tsvector('english', e.name || ' ' || coalesce(e.tagline, '') || ' ' || coalesce(e.summary, '')),
          websearch_to_tsquery('english', ${query})
        ) * 10
        + similarity(e.name, ${query}) * 5
        + coalesce(s.decision_score, 0) / 100.0
      )::float8 AS rank
    FROM entities e
    LEFT JOIN entity_scores s ON s.entity_id = e.id
    WHERE e.status = 'PUBLISHED'
      AND e.deleted_at IS NULL
      AND (
        to_tsvector('english', e.name || ' ' || coalesce(e.tagline, '') || ' ' || coalesce(e.summary, ''))
          @@ websearch_to_tsquery('english', ${query})
        OR e.name % ${query}
        OR e.name ILIKE '%' || ${query} || '%'
      )
    ORDER BY rank DESC
    LIMIT ${limit}
  `;
}

async function hydrate(ids: string[]): Promise<SearchResult[]> {
  const rows = await prisma.entity.findMany({
    where: { id: { in: ids }, status: "PUBLISHED", deletedAt: null },
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      type: true,
      pricingModel: true,
      score: { select: { decisionScore: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    type: row.type,
    pricingModel: row.pricingModel,
    decisionScore: row.score?.decisionScore ?? null,
    rank: 0,
  }));
}
