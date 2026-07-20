import type { AiProvider, CompletionRequest, CompletionResult } from "./types";

/**
 * Deterministic mock provider — the "test credential" mode. Active whenever
 * ANTHROPIC_API_KEY is absent (local dev, CI). It understands the advisor
 * contract well enough to produce schema-valid, grounded output from the
 * candidate list embedded in the prompt, so the full advisor pipeline is
 * exercised end-to-end without a real model. Swapping in the real provider
 * is purely an environment change (ADR-007).
 */
export class MockProvider implements AiProvider {
  readonly name = "mock";

  complete(request: CompletionRequest): Promise<CompletionResult> {
    const prompt = request.messages.map((message) => message.content).join("\n");
    const text =
      request.feature === "advisor"
        ? advisorMock(prompt)
        : `[mock:${request.feature}] ${prompt.slice(0, 120)}`;
    return Promise.resolve({
      text,
      provider: this.name,
      model: "mock-deterministic-v1",
      inputTokens: Math.ceil(prompt.length / 4),
      outputTokens: Math.ceil(text.length / 4),
    });
  }
}

function advisorMock(prompt: string): string {
  // Candidates are embedded in the prompt as lines: `- slug | name | tagline`
  const candidates = [...prompt.matchAll(/^- ([a-z0-9-]+) \| ([^|]+) \| (.*)$/gm)].map((match) => ({
    slug: match[1] as string,
    name: (match[2] as string).trim(),
    tagline: (match[3] as string).trim(),
  }));

  const picks = candidates.slice(0, 3).map((candidate, index) => ({
    slug: candidate.slug,
    reasons: [
      `${candidate.name} matches your described task: ${candidate.tagline.toLowerCase()}.`,
      index === 0
        ? "Highest relevance among verified candidates for this problem."
        : "Strong verified alternative worth evaluating side by side.",
    ],
    tradeoffs: ["Confirm pricing fits your budget on the tool page."],
  }));

  return JSON.stringify({ recommendations: picks });
}
