import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryWithEntities } from "@dstarix/catalog";
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
  const data = await getCategoryWithEntities(slug, 1);
  if (!data) return {};
  return {
    title: `Best ${data.category.name} AI Tools`,
    description:
      data.category.description ??
      `Compare the best ${data.category.name} AI tools, verified by DStarix.`,
    alternates: { canonical: `${siteUrl}/categories/${data.category.slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCategoryWithEntities(slug);
  if (!data) notFound();

  const structuredData = jsonLd(
    breadcrumbList([
      { name: "Home", url: siteUrl },
      { name: "Categories", url: `${siteUrl}/categories` },
      { name: data.category.name, url: `${siteUrl}/categories/${data.category.slug}` },
    ]),
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/categories" className="hover:text-foreground">
          Categories
        </Link>{" "}
        / <span className="text-foreground">{data.category.name}</span>
      </nav>
      <h1 className="text-3xl font-semibold tracking-tight">Best {data.category.name} AI Tools</h1>
      {data.category.description ? (
        <p className="mt-2 max-w-2xl text-muted-foreground">{data.category.description}</p>
      ) : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.entities.map((entity) => (
          <EntityCard key={entity.id} entity={entity} />
        ))}
      </div>
      {data.entities.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Verified tools for this category are in editorial review and will appear shortly.
        </p>
      ) : null}
    </main>
  );
}
