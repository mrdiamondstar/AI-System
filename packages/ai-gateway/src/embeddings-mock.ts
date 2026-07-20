import { createHash } from "node:crypto";
import { EMBEDDING_DIMENSIONS, type EmbeddingProvider } from "./types";

/**
 * Deterministic feature-hashing embedder — the "test credential" embeddings.
 * Active whenever no real embedding key is configured. Unlike a random hash,
 * feature hashing (the hashing-vectorizer trick) maps each token to a few
 * dimensions, so documents that share vocabulary land near each other under
 * cosine distance. That makes pgvector semantic search genuinely useful in
 * dev/CI and mirrors the real pipeline exactly; swapping to a model embedder
 * is an env-gated change (ADR-007).
 */
export class MockEmbeddingProvider implements EmbeddingProvider {
  readonly name = "mock";
  readonly dimensions = EMBEDDING_DIMENSIONS;

  embed(texts: string[]): Promise<number[][]> {
    return Promise.resolve(texts.map((text) => this.embedOne(text)));
  }

  private embedOne(text: string): number[] {
    const vector = new Array<number>(this.dimensions).fill(0);
    const tokens = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 1);

    for (const token of tokens) {
      // Two hashed slots per token with a sign — standard feature hashing.
      const digest = createHash("md5").update(token).digest();
      for (let k = 0; k < 2; k += 1) {
        const slot = digest.readUInt32BE(k * 4) % this.dimensions;
        const sign = (digest[8 + k] ?? 0) % 2 === 0 ? 1 : -1;
        vector[slot] = (vector[slot] ?? 0) + sign;
      }
    }

    // L2-normalize so cosine distance is meaningful (unit vectors).
    const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
    return vector.map((value) => value / norm);
  }
}
