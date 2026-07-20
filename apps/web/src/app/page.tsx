import Link from "next/link";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@dstarix/ui";

const categories = [
  { slug: "writing", name: "Writing & Content" },
  { slug: "coding", name: "Coding & Development" },
  { slug: "image-generation", name: "Image Generation" },
  { slug: "productivity", name: "Productivity" },
  { slug: "research", name: "Research & Analysis" },
];

export default function HomePage() {
  return (
    <>
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
          <div className="flex items-center gap-2">
            <Badge variant="brand">Building in public — Phase 1</Badge>
          </div>
        </nav>
      </header>

      <main id="main">
        {/* Hero — discovery-first (Knowledge_02 §Homepage Strategy) */}
        <section className="mx-auto max-w-3xl px-6 pb-20 pt-24 text-center">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Find the right AI tool in minutes — not hours.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
            DStarix is the AI Decision Platform: verified data, transparent scores, and
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

        {/* Categories */}
        <section aria-labelledby="categories-heading" className="mx-auto max-w-6xl px-6 pb-24">
          <h2 id="categories-heading" className="text-sm font-medium text-muted-foreground">
            Browse by category
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.slug} className="hover:shadow-[var(--ds-shadow-md)]">
                <CardHeader>
                  <CardTitle>{category.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  Curated, verified {category.name.toLowerCase()} tools — coming with the Phase 1
                  catalog.
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} DStarix Techno Pvt Ltd</span>
          <span>The world&apos;s most trusted AI Decision Platform</span>
        </div>
      </footer>
    </>
  );
}
