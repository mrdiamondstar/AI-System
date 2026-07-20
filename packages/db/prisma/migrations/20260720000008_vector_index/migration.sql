-- pgvector HNSW index for fast approximate nearest-neighbor semantic search
-- (doc 05 §3). Cosine distance matches the L2-normalized embeddings we store.
CREATE INDEX IF NOT EXISTS "embeddings_vector_hnsw_idx"
  ON "embeddings" USING hnsw ("vector" vector_cosine_ops);
