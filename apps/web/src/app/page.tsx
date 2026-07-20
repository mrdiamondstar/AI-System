import Link from "next/link";
import {
  getNewEntities,
  getTopEntities,
  listCategories,
  listPublishedCollections,
} from "@dstarix/catalog";
import { jsonLd, organization, webSite } from "@dstarix/seo";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@dstarix/ui";
import { EntityCard } from "@/components/entity-card";
import { NewsletterForm } from "@/components/newsletter-form";

export const revalidate = 300;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function HomePage() {
  const [topEntities, newEntities, categories, collections] = await Promise.all([
    getTopEntities(6),
    getNewEntities(6),
    listCategories(),
    listPublishedCollections(3),
  ]);

  const structuredData = jsonLd(organization(siteUrl), webSite(siteUrl));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <header className="border-b border-border">
        <nav
          aria-label="Main"
          className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6"
        >
          <Link href="/" className="text-lg font-semibold tracking-tight">
            DStarix
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/categories" className="text-muted-foreground hover:text-foreground">
              Categories
            </Link>
            <Link href="/collections" className="text-muted-foreground hover:text-foreground">
              Collections
            </Link>
            <Link href="/advisor" className="text-muted-foreground hover:text-foreground">
              AI Advisor
            </Link>
            <Link href="/learn" className="text-muted-foreground hover:text-foreground">
              Learn
            </Link>
            <Link href="/careers" className="text-muted-foreground hover:text-foreground">
              Careers
            </Link>
            <Link href="/marketplace" className="text-muted-foreground hover:text-foreground">
              Marketplace
            </Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link href="/login" className="font-medium hover:text-brand">
              Sign in
            </Link>
          </div>
        </nav>
      </header>

      <main id="main">
        {/* Hero — discovery-first (Knowledge_02 §Homepage Strategy) */}
        <section className="mx-auto max-w-3xl px-6 pb-16 pt-24 text-center">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Find the right AI tool in minutes — not hours.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
            DStarix is the AI Decision Platform: verified data, transparent Decision Scores, and
            recommendations that explain <em>why</em>.
          </p>
          <form action="/search" role="search" className="mx-auto mt-10 flex max-w-xl gap-2">
            <label htmlFor="q" className="sr-only">
              Search AI tools
            </label>
            <Input
              id="q"
              name="q"
              type="search"
              placeholder="Search AI tools or describe what you want to accomplish…"
              className="h-12 text-base"
            />
            <Button size="lg" type="submit">
              Search
            </Button>
          </form>
        </section>

        {/* Top tools by Decision Score */}
        {topEntities.length > 0 ? (
          <section aria-labelledby="top-heading" className="mx-auto max-w-6xl px-6 py-10">
            <div className="flex items-baseline justify-between">
              <h2 id="top-heading" className="text-xl font-semibold tracking-tight">
                Top-scored AI tools
              </h2>
              <Link href="/categories" className="text-sm font-medium text-brand">
                Browse all →
              </Link>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topEntities.map((entity) => (
                <EntityCard key={entity.id} entity={entity} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Newly added */}
        {newEntities.length > 0 ? (
          <section aria-labelledby="new-heading" className="mx-auto max-w-6xl px-6 py-10">
            <h2 id="new-heading" className="text-xl font-semibold tracking-tight">
              Newly verified
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {newEntities.map((entity) => (
                <EntityCard key={entity.id} entity={entity} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Editorial collections */}
        {collections.length > 0 ? (
          <section aria-labelledby="collections-heading" className="mx-auto max-w-6xl px-6 py-10">
            <div className="flex items-baseline justify-between">
              <h2 id="collections-heading" className="text-xl font-semibold tracking-tight">
                Editor collections
              </h2>
              <Link href="/collections" className="text-sm font-medium text-brand">
                All collections →
              </Link>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection) => (
                <Link
                  key={collection.slug}
                  href={`/collections/${collection.slug}`}
                  className="group block"
                >
                  <Card className="h-full group-hover:shadow-[var(--ds-shadow-md)]">
                    <CardHeader>
                      <CardTitle className="group-hover:text-brand">{collection.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-2">{collection.description}</p>
                      <p className="mt-2 text-xs">{collection._count.items} tools</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Categories */}
        <section aria-labelledby="categories-heading" className="mx-auto max-w-6xl px-6 py-10">
          <h2 id="categories-heading" className="text-xl font-semibold tracking-tight">
            Browse by category
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="group block"
              >
                <Card className="h-full group-hover:shadow-[var(--ds-shadow-md)]">
                  <CardHeader>
                    <CardTitle className="group-hover:text-brand">{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2">{category.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          {categories.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              The verified catalog is being seeded — check back shortly.
            </p>
          ) : null}
        </section>

        {/* Newsletter */}
        <section aria-labelledby="newsletter-heading" className="border-t border-border">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center">
            <h2 id="newsletter-heading" className="text-xl font-semibold tracking-tight">
              The AI decisions newsletter
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              One email a week: the tools worth adopting, verified by editors — no hype.
            </p>
            <NewsletterForm />
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} DStarix Techno Pvt Ltd</span>
          <span>The world&apos;s most trusted AI Decision Platform</span>
        </div>
      </footer>
    </>
  );
}
