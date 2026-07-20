import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAlternatives, getEntityBySlug } from "@dstarix/catalog";
import { breadcrumbList, jsonLd } from "@dstarix/seo";
import { EntityCard } from "@/components/entity-card";

export const revalidate = 600;
export const dynamicParams = true;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entity = await getEntityBySlug(slug);
  if (!entity) return {};
  return {
    title: `Best ${entity.name} Alternatives`,
    description: `Top alternatives to ${entity.name}, ranked by DStarix Decision Score with verified pricing and reviews.`,
    alternates: { canonical: `${siteUrl}/tools/${slug}/alternatives` },
  };
}

export default async function AlternativesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entity = await getEntityBySlug(slug);
  if (!entity) notFound();

  const alternatives = await getAlternatives(entity.id, 12);
  // Quality gate: no thin pages — require real content (doc 03 §4).
  if (alternatives.length < 2) notFound();

  const structuredData = jsonLd(
    breadcrumbList([
      { name: "Home", url: siteUrl },
      { name: entity.name, url: `${siteUrl}/tools/${entity.slug}` },
      { name: "Alternatives", url: `${siteUrl}/tools/${entity.slug}/alternatives` },
    ]),
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href={`/tools/${entity.slug}`} className="hover:text-foreground">
          {entity.name}
        </Link>{" "}
        / <span className="text-foreground">Alternatives</span>
      </nav>
      <h1 className="text-3xl font-semibold tracking-tight">Best {entity.name} alternatives</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Ranked by Decision Score across the same categories as {entity.name}. Every listing is
        verified by DStarix editors.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {alternatives.map((alternative) => (
          <EntityCard key={alternative.id} entity={alternative} />
        ))}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        Compare head-to-head:{" "}
        {alternatives.slice(0, 3).map((alternative, index) => {
          const [a, b] = [entity.slug, alternative.slug].sort();
          return (
            <span key={alternative.id}>
              {index > 0 ? " · " : ""}
              <Link href={`/compare/${a}-vs-${b}`} className="font-medium text-brand">
                {entity.name} vs {alternative.name}
              </Link>
            </span>
          );
        })}
      </p>
    </main>
  );
}
