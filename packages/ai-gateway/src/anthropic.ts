import { AppError } from "@dstarix/shared";
import type { AiProvider, CompletionRequest, CompletionResult } from "./types";

const MODEL_BY_FEATURE: Record<CompletionRequest["feature"], string> = {
  advisor: "claude-sonnet-5",
  draft: "claude-sonnet-5",
  classify: "claude-haiku-4-5-20251001",
};

/** Anthropic Messages API provider — active when ANTHROPIC_API_KEY is set. */
export class AnthropicProvider implements AiProvider {
  readonly name = "anthropic";

  constructor(private readonly apiKey: string) {}

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    const model = MODEL_BY_FEATURE[request.feature];
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: request.maxTokens ?? 1024,
        temperature: request.temperature ?? 0.2,
        system: request.system,
        messages: request.messages,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new AppError("internal", `AI provider error (${response.status})`);
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text?: string }>;
      usage: { input_tokens: number; output_tokens: number };
    };

    return {
      text: data.content.find((block) => block.type === "text")?.text ?? "",
      provider: this.name,
      model,
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
    };
  }
}
