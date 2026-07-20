import { scopedLogger } from "@dstarix/shared";
import { AnthropicProvider } from "./anthropic";
import { MockProvider } from "./mock";
import type { AiProvider, CompletionRequest, CompletionResult } from "./types";

export type { ChatMessage, CompletionRequest, CompletionResult } from "./types";

const log = scopedLogger("ai-gateway");

let provider: AiProvider | undefined;

function resolveProvider(): AiProvider {
  if (!provider) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    provider = apiKey ? new AnthropicProvider(apiKey) : new MockProvider();
    log.info({ provider: provider.name }, "ai provider resolved");
  }
  return provider;
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
