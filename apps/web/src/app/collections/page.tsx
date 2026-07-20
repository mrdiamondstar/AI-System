import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedCollections } from "@dstarix/catalog";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "AI Tool Collections",
  description:
    "Curated collections of the best AI tools for specific jobs — hand-picked and verified by DStarix editors.",
};

export default async function CollectionsPage() {
  const collections = await listPublishedCollections();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Collections</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Hand-picked sets of AI tools for specific jobs — a faster path to a confident decision.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <Link
            key={collection.slug}
            href={`/collections/${collection.slug}`}
            className="group block"
          >
            <Card className="h-full group-hover:shadow-[var(--ds-shadow-md)]">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="group-hover:text-brand">{collection.title}</CardTitle>
                  {collection.isEditorial ? <Badge variant="brand">Editor</Badge> : null}
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2">{collection.description}</p>
                <p className="mt-2 text-xs">{collection._count.items} tools</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {collections.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Editorial collections are being curated and will appear here shortly.
        </p>
      ) : null}
    </main>
  );
}
