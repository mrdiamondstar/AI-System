import type { Metadata } from "next";
import Link from "next/link";
import { adviseTools } from "@dstarix/advisor";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";
import { DecisionScore } from "@/components/entity-card";

export const metadata: Metadata = {
  title: "AI Advisor — describe your problem, get the right tool",
  description:
    "Tell the DStarix AI Advisor what you're trying to accomplish and get grounded recommendations from our verified catalog — with the reasoning explained.",
};

export default async function AdvisorPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const result = q && q.trim().length >= 10 ? await adviseTools(q) : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">AI Advisor</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">
        Describe what you&apos;re trying to accomplish. The Advisor recommends only verified tools
        from our catalog — and always explains why.
      </p>

      <form action="/advisor" className="mt-8 flex flex-col gap-3">
        <label htmlFor="advisor-q" className="sr-only">
          Describe your problem
        </label>
        <textarea
          id="advisor-q"
          name="q"
          required
          minLength={10}
          maxLength={1000}
          rows={3}
          defaultValue={q ?? ""}
          placeholder="e.g. I need an AI that helps my small legal team summarize long contracts…"
          className="w-full rounded-[var(--ds-radius-md)] border border-border bg-surface p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-brand)]"
        />
        <Button type="submit" className="self-start">
          Get recommendations
        </Button>
      </form>

      {result ? (
        result.recommendations.length > 0 ? (
          <section aria-labelledby="recs-heading" className="mt-10">
            <h2 id="recs-heading" className="text-lg font-semibold">
              Recommended for you
            </h2>
            <ol className="mt-4 space-y-4">
              {result.recommendations.map((recommendation, index) => (
                <li key={recommendation.slug}>
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle>
                          <span className="mr-2 text-muted-foreground">#{index + 1}</span>
                          <Link href={`/tools/${recommendation.slug}`} className="hover:text-brand">
                            {recommendation.name}
                          </Link>
                        </CardTitle>
                        {recommendation.decisionScore !== null ? (
                          <DecisionScore value={recommendation.decisionScore} />
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Why this pick
                        </h3>
                        <ul className="mt-1 list-inside list-disc space-y-1">
                          {recommendation.reasons.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                      {recommendation.tradeoffs.length > 0 ? (
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Trade-offs
                          </h3>
                          <ul className="mt-1 list-inside list-disc space-y-1">
                            {recommendation.tradeoffs.map((tradeoff) => (
                              <li key={tradeoff}>{tradeoff}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ol>
          </section>
        ) : (
          <p className="mt-10 rounded-[var(--ds-radius-lg)] border border-border p-6 text-sm text-muted-foreground">
            No verified tools match that problem yet — try rephrasing, or{" "}
            <Link href="/categories" className="font-medium text-brand">
              browse categories
            </Link>
            .
          </p>
        )
      ) : null}
    </main>
  );
}
