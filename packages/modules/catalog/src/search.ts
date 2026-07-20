import { prisma } from "@dstarix/db";
import { withDatabase } from "./availability";

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
 * Search v1 (ADR-003 Phase 1): Postgres FTS with websearch syntax + trigram
 * fallback for short/typo queries, business-ranked by text rank blended with
 * Decision Score. Behind this function signature so the Meilisearch swap
 * (Phase 2) changes nothing for callers.
 */
export async function searchEntities(rawQuery: string, limit = 20): Promise<SearchResult[]> {
  const query = rawQuery.trim().slice(0, 200);
  if (!query) return [];

  return withDatabase([] as SearchResult[], async () => {
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
  });
}
