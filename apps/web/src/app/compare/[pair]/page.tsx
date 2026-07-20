import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getComparisonPair, type ComparisonEntity } from "@dstarix/catalog";
import { breadcrumbList, jsonLd } from "@dstarix/seo";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";
import { DecisionScore } from "@/components/entity-card";

export const revalidate = 600;
export const dynamicParams = true;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function parsePair(pair: string): { slugA: string; slugB: string } | null {
  const parts = pair.split("-vs-");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { slugA: parts[0], slugB: parts[1] };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string }>;
}): Promise<Metadata> {
  const { pair } = await params;
  const parsed = parsePair(pair);
  if (!parsed) return {};
  const data = await getComparisonPair(parsed.slugA, parsed.slugB);
  if (!data) return {};
  return {
    title: `${data.a.name} vs ${data.b.name} — Which is better?`,
    description: `Side-by-side comparison of ${data.a.name} and ${data.b.name}: Decision Scores, pricing, and a clear verdict from DStarix.`,
    alternates: { canonical: `${siteUrl}/compare/${pair}` },
  };
}

const pricingLabels: Record<string, string> = {
  FREE: "Free",
  FREEMIUM: "Freemium",
  PAID: "Paid",
  OPEN_SOURCE: "Open source",
  CONTACT: "Custom pricing",
};

function ComparisonColumn({ entity }: { entity: ComparisonEntity }) {
  const factors = (entity.score?.factors ?? {}) as Record<string, number>;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg">
            <Link href={`/tools/${entity.slug}`} className="hover:text-brand">
              {entity.name}
            </Link>
          </CardTitle>
          {entity.score ? <DecisionScore value={entity.score.decisionScore} /> : null}
        </div>
        {entity.company ? (
          <p className="text-xs text-muted-foreground">by {entity.company.name}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <p>{entity.tagline}</p>
        <div className="flex flex-wrap gap-2">
          <Badge>{pricingLabels[entity.pricingModel] ?? entity.pricingModel}</Badge>
          {entity.categories.slice(0, 3).map(({ category }) => (
            <Badge key={category.slug} variant="brand">
              {category.name}
            </Badge>
          ))}
        </div>
        {Object.keys(factors).length > 0 ? (
          <dl className="space-y-1 text-sm">
            {Object.entries(factors).map(([factor, value]) => (
              <div key={factor} className="flex items-center justify-between">
                <dt className="capitalize text-muted-foreground">{factor}</dt>
                <dd className="font-medium">{value}/100</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <Link
          href={`/tools/${entity.slug}`}
          className="inline-block text-sm font-medium text-brand"
        >
          Full review →
        </Link>
      </CardContent>
    </Card>
  );
}

export default async function ComparePage({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const parsed = parsePair(pair);
  if (!parsed) notFound();

  // Canonical order is alphabetical — 301 the reversed form (doc 03 §4).
  const [first, second] = [parsed.slugA, parsed.slugB].sort() as [string, string];
  if (first !== parsed.slugA) permanentRedirect(`/compare/${first}-vs-${second}`);

  const data = await getComparisonPair(first, second);
  if (!data) notFound();

  const scoreA = data.a.score?.decisionScore ?? 0;
  const scoreB = data.b.score?.decisionScore ?? 0;
  const winner = scoreA === scoreB ? null : scoreA > scoreB ? data.a : data.b;
  const loser = winner === null ? null : winner.id === data.a.id ? data.b : data.a;

  const structuredData = jsonLd(
    breadcrumbList([
      { name: "Home", url: siteUrl },
      { name: `${data.a.name} vs ${data.b.name}`, url: `${siteUrl}/compare/${pair}` },
    ]),
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      <h1 className="text-3xl font-semibold tracking-tight">
        {data.a.name} vs {data.b.name}
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Side-by-side comparison based on verified data and DStarix Decision Scores.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <ComparisonColumn entity={data.a} />
        <ComparisonColumn entity={data.b} />
      </div>

      {/* Verdict — always explains WHY (trust requirement, doc 01) */}
      <section aria-labelledby="verdict-heading" className="mt-10">
        <h2 id="verdict-heading" className="text-lg font-semibold">
          The DStarix verdict
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
          {winner && loser ? (
            <>
              <strong className="text-foreground">{winner.name}</strong> currently scores higher (
              {Math.max(scoreA, scoreB)} vs {Math.min(scoreA, scoreB)}) on our editorial, community,
              and data-freshness factors. {loser.name} remains a strong choice
              {loser.pricingModel === "FREE" || loser.pricingModel === "FREEMIUM"
                ? ", particularly if you want to start free"
                : ""}
              . Scores update as verified data and community reviews change.
            </>
          ) : (
            <>
              These tools currently score identically on our factors — the right choice depends on
              your workflow. Open the full reviews to compare pricing and capabilities in depth.
            </>
          )}
        </p>
      </section>
    </main>
  );
}
