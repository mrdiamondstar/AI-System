import type { Metadata } from "next";
import Link from "next/link";
import { searchEntities } from "@dstarix/catalog";
import { Badge, Card, CardContent, CardHeader, CardTitle, Input, Button } from "@dstarix/ui";
import { DecisionScore } from "@/components/entity-card";

export const metadata: Metadata = {
  title: "Search AI Tools",
  robots: { index: false },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const results = q ? await searchEntities(q) : [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">
        {q ? `Results for “${q}”` : "Search AI tools"}
      </h1>

      <form action="/search" role="search" className="mt-6 flex gap-2">
        <label htmlFor="q" className="sr-only">
          Search AI tools
        </label>
        <Input
          id="q"
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder="Search AI tools or describe what you want to accomplish…"
        />
        <Button type="submit">Search</Button>
      </form>

      {q ? (
        results.length > 0 ? (
          <ul className="mt-8 space-y-4">
            {results.map((result) => (
              <li key={result.id}>
                <Link href={`/tools/${result.slug}`} className="group block">
                  <Card className="group-hover:shadow-[var(--ds-shadow-md)]">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="group-hover:text-brand">{result.name}</CardTitle>
                        {result.decisionScore !== null ? (
                          <DecisionScore value={result.decisionScore} />
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between gap-4">
                      <p className="line-clamp-2">{result.tagline}</p>
                      <Badge>{result.pricingModel === "FREE" ? "Free" : result.pricingModel}</Badge>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          // Zero-result recovery (doc 06 §3): never a dead end.
          <div className="mt-8 rounded-[var(--ds-radius-lg)] border border-border p-6 text-sm text-muted-foreground">
            <p>No tools matched “{q}”.</p>
            <p className="mt-2">
              Try a broader term, or{" "}
              <Link href="/categories" className="font-medium text-brand">
                browse categories
              </Link>{" "}
              — the AI Advisor (coming in Phase 3) will handle problem descriptions like this one.
            </p>
          </div>
        )
      ) : null}
    </main>
  );
}
