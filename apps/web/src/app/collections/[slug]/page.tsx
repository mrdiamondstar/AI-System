import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCollectionBySlug } from "@dstarix/catalog";
import { breadcrumbList, jsonLd } from "@dstarix/seo";
import { Badge } from "@dstarix/ui";
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
  const collection = await getCollectionBySlug(slug);
  if (!collection) return {};
  return {
    title: collection.title,
    description:
      collection.description ??
      `A curated DStarix collection of ${collection.items.length} AI tools.`,
    alternates: { canonical: `${siteUrl}/collections/${collection.slug}` },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const structuredData = jsonLd(
    breadcrumbList([
      { name: "Home", url: siteUrl },
      { name: "Collections", url: `${siteUrl}/collections` },
      { name: collection.title, url: `${siteUrl}/collections/${collection.slug}` },
    ]),
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/collections" className="hover:text-foreground">
          Collections
        </Link>{" "}
        / <span className="text-foreground">{collection.title}</span>
      </nav>
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{collection.title}</h1>
        {collection.isEditorial ? <Badge variant="brand">Editor&apos;s pick</Badge> : null}
      </div>
      {collection.description ? (
        <p className="mt-2 max-w-2xl text-muted-foreground">{collection.description}</p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collection.items.map((item) => (
          <div key={item.entity.id}>
            <EntityCard entity={item.entity} />
            {item.note ? (
              <p className="mt-2 px-1 text-sm text-muted-foreground">{item.note}</p>
            ) : null}
          </div>
        ))}
      </div>
    </main>
  );
}
