import type { Metadata } from "next";
import Link from "next/link";
import { listCategories } from "@dstarix/catalog";
import { Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "AI Tool Categories",
  description:
    "Browse verified AI tools by category — writing, coding, image generation, productivity, research, and more.",
};

export default async function CategoriesPage() {
  const categories = await listCategories();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Categories</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Every category is curated and verified by DStarix editors.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link key={category.slug} href={`/categories/${category.slug}`} className="group block">
            <Card className="h-full group-hover:shadow-[var(--ds-shadow-md)]">
              <CardHeader>
                <CardTitle className="group-hover:text-brand">{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2">{category.description}</p>
                <p className="mt-2 text-xs">
                  {category._count.entities} tool{category._count.entities === 1 ? "" : "s"}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {categories.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          The catalog is being seeded — categories appear as soon as the database is connected.
        </p>
      ) : null}
    </main>
  );
}
