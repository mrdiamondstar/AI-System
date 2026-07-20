import { scopedLogger } from "@dstarix/shared";
import { AnthropicProvider } from "./anthropic";
import { MockProvider } from "./mock";
import { MockEmbeddingProvider } from "./embeddings-mock";
import { OpenAIEmbeddingProvider } from "./embeddings-openai";
import {
  EMBEDDING_DIMENSIONS,
  type AiProvider,
  type CompletionRequest,
  type CompletionResult,
  type EmbeddingProvider,
} from "./types";

export type { ChatMessage, CompletionRequest, CompletionResult } from "./types";
export { EMBEDDING_DIMENSIONS } from "./types";

const log = scopedLogger("ai-gateway");

let provider: AiProvider | undefined;
let embeddingProvider: EmbeddingProvider | undefined;

function resolveProvider(): AiProvider {
  if (!provider) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    provider = apiKey ? new AnthropicProvider(apiKey) : new MockProvider();
    log.info({ provider: provider.name }, "ai provider resolved");
  }
  return provider;
}

function resolveEmbeddingProvider(): EmbeddingProvider {
  if (!embeddingProvider) {
    const apiKey = process.env.OPENAI_API_KEY;
    embeddingProvider = apiKey ? new OpenAIEmbeddingProvider(apiKey) : new MockEmbeddingProvider();
    log.info({ provider: embeddingProvider.name }, "embedding provider resolved");
  }
  return embeddingProvider;
}

/** Embed one text to a unit vector of EMBEDDING_DIMENSIONS (ADR-007). */
export async function embed(text: string): Promise<number[]> {
  const [vector] = await resolveEmbeddingProvider().embed([text]);
  return vector ?? new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
}

/** Batch embed (indexing path). */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  return resolveEmbeddingProvider().embed(texts);
}

/**
 * Single entry point for all model calls (ADR-007). No module imports a
 * provider SDK directly; cost accounting and provider fallback live here.
 */
export async function complete(request: CompletionRequest): Promise<CompletionResult> {
  const started = Date.now();
  const result = await resolveProvider().complete(request);
  log.info(
    {
      feature: request.feature,
      provider: result.provider,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      durationMs: Date.now() - started,
    },
    "completion",
  );
  return result;
}
