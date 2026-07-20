import { AppError } from "@dstarix/shared";
import { EMBEDDING_DIMENSIONS, type EmbeddingProvider } from "./types";

/**
 * OpenAI embeddings provider — active when OPENAI_API_KEY is set. Uses
 * text-embedding-3-small with the dimensions parameter to match our
 * vector(1024) column exactly, so switching from mock to real needs no schema
 * or query change.
 */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly name = "openai";
  readonly dimensions = EMBEDDING_DIMENSIONS;

  constructor(private readonly apiKey: string) {}

  async embed(texts: string[]): Promise<number[][]> {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        dimensions: this.dimensions,
        input: texts,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      throw new AppError("internal", `Embedding provider error (${response.status})`);
    }
    const data = (await response.json()) as { data: Array<{ embedding: number[] }> };
    return data.data.map((row) => row.embedding);
  }
}
