-- Search v1 indexes (ADR-003 Phase 1): FTS expression index + trigram index
-- matching the exact expressions used in @dstarix/catalog search.ts.

CREATE INDEX IF NOT EXISTS "entities_fts_idx" ON "entities" USING GIN (
  to_tsvector('english', name || ' ' || coalesce(tagline, '') || ' ' || coalesce(summary, ''))
);

CREATE INDEX IF NOT EXISTS "entities_name_trgm_idx" ON "entities" USING GIN (name gin_trgm_ops);
