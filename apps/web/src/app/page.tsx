import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getNewEntities, getTopEntities, listPublishedCollections } from "@dstarix/catalog";
import { jsonLd, organization, webSite } from "@dstarix/seo";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";
import { EntityCard } from "@/components/entity-card";
import { NewsletterForm } from "@/components/newsletter-form";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const revalidate = 300;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const trendingSearches = [
  "AI for coding",
  "summarize research papers",
  "free image generator",
  "AI for legal contracts",
  "meeting notes assistant",
];

// Curated category tiles — icon + fallback so the homepage stays rich even
// before the catalog is seeded; each links to the real category route.
const categoryTiles = [
  {
    slug: "coding",
    name: "Coding & Development",
    icon: "⌘",
    blurb: "Pair programmers, review, agents",
  },
  {
    slug: "writing",
    name: "Writing & Content",
    icon: "✎",
    blurb: "Drafting, editing, copywriting",
  },
  {
    slug: "image-generation",
    name: "Image Generation",
    icon: "◨",
    blurb: "Text-to-image, editing",
  },
  { slug: "chatbots", name: "Chat & Assistants", icon: "◈", blurb: "General-purpose assistants" },
  { slug: "research", name: "Research & Analysis", icon: "∑", blurb: "Papers, data, knowledge" },
  { slug: "productivity", name: "Productivity", icon: "⚡", blurb: "Automation & workflows" },
];

const steps = [
  {
    n: "01",
    title: "Search or describe your problem",
    body: "Type a tool name, or tell the AI Advisor what you're trying to accomplish in plain language.",
  },
  {
    n: "02",
    title: "Compare with confidence",
    body: "Every tool carries a transparent Decision Score, verified pricing, pros, cons, and real reviews.",
  },
  {
    n: "03",
    title: "Decide — and know why",
    body: "Recommendations always explain their reasoning, so you adopt the right AI without second-guessing.",
  },
];

const features = [
  {
    icon: "◎",
    title: "Decision Scores, not star ratings",
    body: "A composite of editorial rigor, community signal, and data freshness — recomputed continuously, never influenced by who pays.",
  },
  {
    icon: "✦",
    title: "An advisor that explains itself",
    body: "Grounded in a verified catalog, every recommendation cites the reasons and trade-offs behind it.",
  },
  {
    icon: "⛓",
    title: "One connected knowledge graph",
    body: "Tools, alternatives, comparisons, courses, and jobs all link — so one search moves you toward a decision.",
  },
  {
    icon: "✓",
    title: "Human-verified, freshness-dated",
    body: "Editors verify what matters. Every page shows when it was last checked — trust you can see.",
  },
];

export default async function HomePage() {
  const [topEntities, newEntities, collections, t] = await Promise.all([
    getTopEntities(6),
    getNewEntities(6),
    listPublishedCollections(3),
    getTranslations("home"),
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

      <SiteHeader />

      <main id="main">
        {/* Hero -------------------------------------------------------------- */}
        <section className="relative overflow-hidden">
          <div className="ds-aurora" aria-hidden="true" />
          <div className="ds-grid" aria-hidden="true" />
          <div className="relative mx-auto max-w-3xl px-6 pb-20 pt-24 text-center sm:pt-28">
            <div className="ds-rise ds-rise-1 mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--ds-border-strong)] bg-[var(--ds-surface)]/70 px-3.5 py-1.5 text-xs font-medium text-[var(--ds-muted-foreground)] backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full [background:var(--ds-gradient-brand)]" />
              The AI Decision Platform
            </div>
            <h1 className="ds-rise ds-rise-2 text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl">
              Find the right AI in <span className="ds-gradient-text">minutes</span>, not hours.
            </h1>
            <p className="ds-rise ds-rise-3 mx-auto mt-5 max-w-xl text-pretty text-base text-[var(--ds-muted-foreground)] sm:text-lg">
              {t("heroSubtitle")}
            </p>

            <form
              action="/search"
              role="search"
              className="ds-rise ds-rise-4 mx-auto mt-9 flex max-w-xl items-center gap-2 rounded-[var(--ds-radius-xl)] border border-[var(--ds-border-strong)] bg-[var(--ds-surface)] p-2 shadow-[var(--ds-shadow-lg)]"
            >
              <label htmlFor="q" className="sr-only">
                {t("searchButton")}
              </label>
              <span aria-hidden="true" className="pl-3 text-[var(--ds-muted-foreground)]">
                <SearchIcon />
              </span>
              <input
                id="q"
                name="q"
                type="search"
                placeholder={t("searchPlaceholder")}
                className="h-11 w-full flex-1 bg-transparent px-1 text-base text-[var(--ds-foreground)] outline-none placeholder:text-[var(--ds-muted-foreground)]"
              />
              <Button size="lg" type="submit" className="shrink-0">
                {t("searchButton")}
              </Button>
            </form>

            <div className="ds-rise ds-rise-4 mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-[var(--ds-muted-foreground)]">Trending:</span>
              {trendingSearches.map((term) => (
                <Link
                  key={term}
                  href={`/search?q=${encodeURIComponent(term)}`}
                  className="rounded-full border border-[var(--ds-border)] bg-[var(--ds-surface)] px-3 py-1 text-xs text-[var(--ds-muted-foreground)] transition-colors hover:border-[var(--ds-brand)] hover:text-[var(--ds-foreground)]"
                >
                  {term}
                </Link>
              ))}
            </div>

            <p className="ds-rise ds-rise-4 mt-8 text-xs text-[var(--ds-muted-foreground)]">
              Verified catalog · Transparent Decision Scores · Recommendations that explain why
            </p>
          </div>
        </section>

        {/* Category tiles ---------------------------------------------------- */}
        <section aria-labelledby="cat-heading" className="mx-auto max-w-6xl px-6 py-14">
          <Eyebrow>Explore</Eyebrow>
          <h2 id="cat-heading" className="mt-2 text-2xl font-semibold tracking-[-0.02em]">
            Browse by category
          </h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoryTiles.map((cat) => (
              <Link key={cat.slug} href={`/categories/${cat.slug}`} className="group block">
                <Card interactive className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-[var(--ds-radius-md)] bg-[var(--ds-brand-soft)] text-lg text-[var(--ds-brand)]">
                        {cat.icon}
                      </span>
                      <CardTitle className="group-hover:text-brand">{cat.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>{cat.blurb}</CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Top tools (data) -------------------------------------------------- */}
        {topEntities.length > 0 ? (
          <Section
            id="top"
            eyebrow="Highest rated"
            title="Top-scored AI tools"
            href="/categories"
            cta="Browse all"
          >
            <Grid>
              {topEntities.map((entity) => (
                <EntityCard key={entity.id} entity={entity} />
              ))}
            </Grid>
          </Section>
        ) : null}

        {/* How it works ------------------------------------------------------ */}
        <section
          aria-labelledby="how-heading"
          className="relative overflow-hidden border-y border-[var(--ds-border)] bg-[var(--ds-surface-2)]"
        >
          <div className="mx-auto max-w-6xl px-6 py-16">
            <Eyebrow>How it works</Eyebrow>
            <h2
              id="how-heading"
              className="mt-2 max-w-2xl text-2xl font-semibold tracking-[-0.02em]"
            >
              From “which AI should I use?” to a confident decision.
            </h2>
            <div className="mt-9 grid gap-6 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.n} className="relative">
                  <span className="ds-gradient-text text-3xl font-semibold">{step.n}</span>
                  <h3 className="mt-2 text-base font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-[var(--ds-muted-foreground)]">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Newly verified (data) --------------------------------------------- */}
        {newEntities.length > 0 ? (
          <Section id="new" eyebrow="Fresh" title="Newly verified">
            <Grid>
              {newEntities.map((entity) => (
                <EntityCard key={entity.id} entity={entity} />
              ))}
            </Grid>
          </Section>
        ) : null}

        {/* Collections (data) ------------------------------------------------ */}
        {collections.length > 0 ? (
          <Section
            id="collections"
            eyebrow="Curated"
            title="Editor collections"
            href="/collections"
            cta="All collections"
          >
            <Grid>
              {collections.map((collection) => (
                <Link
                  key={collection.slug}
                  href={`/collections/${collection.slug}`}
                  className="group block"
                >
                  <Card interactive className="h-full">
                    <CardHeader>
                      <CardTitle className="group-hover:text-brand">{collection.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-2">{collection.description}</p>
                      <p className="mt-2 text-xs font-medium text-[var(--ds-brand)]">
                        {collection._count.items} tools
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </Grid>
          </Section>
        ) : null}

        {/* Why DStarix ------------------------------------------------------- */}
        <section aria-labelledby="why-heading" className="mx-auto max-w-6xl px-6 py-16">
          <Eyebrow>Why DStarix</Eyebrow>
          <h2 id="why-heading" className="mt-2 max-w-2xl text-2xl font-semibold tracking-[-0.02em]">
            Built to earn the decision you make.
          </h2>
          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <Card key={f.title} className="h-full">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--ds-radius-md)] bg-[var(--ds-brand-soft)] text-lg text-[var(--ds-brand)]">
                      {f.icon}
                    </span>
                    <div>
                      <CardTitle>{f.title}</CardTitle>
                      <p className="mt-1.5 text-sm text-[var(--ds-muted-foreground)]">{f.body}</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Advisor CTA + Newsletter ------------------------------------------ */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="relative overflow-hidden rounded-[var(--ds-radius-xl)] border border-[var(--ds-border-strong)] bg-[var(--ds-surface)] p-10 text-center shadow-[var(--ds-shadow-lg)]">
            <div className="ds-aurora" aria-hidden="true" />
            <div className="relative">
              <h2 className="text-2xl font-semibold tracking-[-0.02em]">
                Not sure what you need? Ask the Advisor.
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--ds-muted-foreground)]">
                Describe your problem in plain language and get grounded recommendations — with the
                reasoning shown.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link href="/advisor">
                  <Button size="lg">Try the AI Advisor</Button>
                </Link>
                <Link href="/categories">
                  <Button size="lg" variant="secondary">
                    Browse the catalog
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <h2 className="text-lg font-semibold tracking-[-0.01em]">
              The AI decisions newsletter
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--ds-muted-foreground)]">
              One email a week: the tools worth adopting, verified by editors — no hype.
            </p>
            <NewsletterForm />
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ds-brand)]">
      {children}
    </span>
  );
}

function Section({
  id,
  eyebrow,
  title,
  href,
  cta,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  href?: string;
  cta?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className="mx-auto max-w-6xl px-6 py-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 id={`${id}-heading`} className="mt-2 text-2xl font-semibold tracking-[-0.02em]">
            {title}
          </h2>
        </div>
        {href && cta ? (
          <Link
            href={href}
            className="shrink-0 text-sm font-medium text-[var(--ds-brand)] hover:underline"
          >
            {cta} →
          </Link>
        ) : null}
      </div>
      <div className="mt-7">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}
