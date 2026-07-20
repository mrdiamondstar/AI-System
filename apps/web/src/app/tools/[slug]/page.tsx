import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  databaseConfigured,
  getAlternatives,
  getEntityBySlug,
  listPublishedSlugs,
  resolveSlugRedirect,
} from "@dstarix/catalog";
import { breadcrumbList, jsonLd, softwareApplication } from "@dstarix/seo";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";
import { BookmarkButton } from "@/components/bookmark-button";
import { ReviewForm } from "@/components/review-form";
import { EntityCard, DecisionScore } from "@/components/entity-card";

// ISR (doc 03 §2): pages regenerate every 5 min; event-driven on-demand
// revalidation replaces the interval once the revalidate webhook ships.
export const revalidate = 300;
export const dynamicParams = true;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateStaticParams() {
  if (!databaseConfigured()) return [];
  const slugs = await listPublishedSlugs();
  return slugs.slice(0, 500).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entity = await getEntityBySlug(slug);
  if (!entity) return {};
  const description =
    entity.summary ?? entity.tagline ?? `${entity.name} — reviewed and verified on DStarix.`;
  return {
    title: `${entity.name} — Review, Pricing & Alternatives`,
    description: description.slice(0, 160),
    alternates: { canonical: `${siteUrl}/tools/${entity.slug}` },
    openGraph: { title: entity.name, description: description.slice(0, 200) },
  };
}

const pricingLabels: Record<string, string> = {
  FREE: "Free",
  FREEMIUM: "Freemium",
  PAID: "Paid",
  OPEN_SOURCE: "Open source",
  CONTACT: "Custom pricing",
};

function formatPrice(priceMinor: number | null, currency: string): string {
  if (priceMinor === null) return "Custom";
  if (priceMinor === 0) return "Free";
  const amount = priceMinor / 100;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entity = await getEntityBySlug(slug);

  if (!entity) {
    const redirect = await resolveSlugRedirect("entities", slug);
    if (redirect) permanentRedirect(`/tools/${redirect.toSlug}`);
    notFound();
  }

  const alternatives = await getAlternatives(entity.id);
  const primaryCategory = entity.categories.find((c) => c.isPrimary)?.category;
  const ratingAvg = entity.score ? Number(entity.score.ratingAvg) : 0;

  const structuredData = jsonLd(
    softwareApplication({
      name: entity.name,
      description: entity.summary ?? entity.tagline ?? entity.name,
      url: `${siteUrl}/tools/${entity.slug}`,
      applicationCategory: primaryCategory?.name,
      aggregateRating: entity.score
        ? { ratingValue: ratingAvg, ratingCount: entity.score.ratingCount }
        : undefined,
    }),
    breadcrumbList([
      { name: "Home", url: siteUrl },
      ...(primaryCategory
        ? [{ name: primaryCategory.name, url: `${siteUrl}/categories/${primaryCategory.slug}` }]
        : []),
      { name: entity.name, url: `${siteUrl}/tools/${entity.slug}` },
    ]),
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />

      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          {primaryCategory ? (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={`/categories/${primaryCategory.slug}`}
                  className="hover:text-foreground"
                >
                  {primaryCategory.name}
                </Link>
              </li>
            </>
          ) : null}
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground">
            {entity.name}
          </li>
        </ol>
      </nav>

      {/* Hero */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{entity.name}</h1>
          {entity.tagline ? (
            <p className="mt-2 max-w-2xl text-muted-foreground">{entity.tagline}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {entity.company ? (
              <span className="text-sm text-muted-foreground">by {entity.company.name}</span>
            ) : null}
            <Badge>{pricingLabels[entity.pricingModel] ?? entity.pricingModel}</Badge>
            {entity.categories.map(({ category }) => (
              <Badge key={category.slug} variant="brand">
                {category.name}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {entity.score ? (
            <div className="text-center">
              <DecisionScore value={entity.score.decisionScore} />
              <p className="mt-1 text-xs text-muted-foreground">Decision Score</p>
            </div>
          ) : null}
          <BookmarkButton entityId={entity.id} entitySlug={entity.slug} />
          {entity.websiteUrl ? (
            <a
              href={`/out/${entity.slug}`}
              rel="nofollow sponsored noopener"
              target="_blank"
              className="inline-flex h-11 items-center rounded-[var(--ds-radius-md)] bg-[var(--ds-brand)] px-5 text-sm font-medium text-[var(--ds-brand-foreground)] hover:bg-[var(--ds-brand-hover)]"
            >
              Visit website ↗
            </a>
          ) : null}
        </div>
      </header>

      {/* Trust metadata (doc 06 §6: visible verification signal) */}
      {entity.lastVerifiedAt ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Information verified by DStarix editors on{" "}
          {entity.lastVerifiedAt.toLocaleDateString("en-US", { dateStyle: "medium" })}.
        </p>
      ) : null}

      {/* Summary */}
      {entity.summary ? (
        <section aria-labelledby="about-heading" className="mt-10">
          <h2 id="about-heading" className="text-lg font-semibold">
            About {entity.name}
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">{entity.summary}</p>
        </section>
      ) : null}

      {/* Pricing */}
      {entity.pricingPlans.length > 0 ? (
        <section aria-labelledby="pricing-heading" className="mt-10">
          <h2 id="pricing-heading" className="text-lg font-semibold">
            Pricing
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entity.pricingPlans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <p className="text-2xl font-semibold">
                    {formatPrice(plan.priceMinor, plan.currency)}
                    {plan.billingPeriod && plan.priceMinor ? (
                      <span className="text-sm font-normal text-muted-foreground">
                        /{plan.billingPeriod === "monthly" ? "mo" : plan.billingPeriod}
                      </span>
                    ) : null}
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="list-inside list-disc space-y-1">
                    {(plan.features as string[]).map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {/* Reviews */}
      <section aria-labelledby="reviews-heading" className="mt-10">
        <h2 id="reviews-heading" className="text-lg font-semibold">
          Reviews
          {entity.score && entity.score.ratingCount > 0 ? (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {ratingAvg.toFixed(1)}/5 · {entity.score.ratingCount} review
              {entity.score.ratingCount === 1 ? "" : "s"}
            </span>
          ) : null}
        </h2>
        {entity.reviews.length > 0 ? (
          <ul className="mt-4 space-y-4">
            {entity.reviews.map((review) => (
              <li key={review.id}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{review.title ?? "Review"}</CardTitle>
                      <span aria-label={`Rated ${review.rating} out of 5`} className="text-sm">
                        {"★".repeat(review.rating)}
                        <span className="text-muted-foreground">
                          {"★".repeat(5 - review.rating)}
                        </span>
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {review.user.name ?? review.user.handle ?? "DStarix user"} ·{" "}
                      {review.createdAt.toLocaleDateString("en-US", { dateStyle: "medium" })}
                    </p>
                  </CardHeader>
                  <CardContent>{review.body}</CardContent>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No reviews yet — be the first to share your experience.
          </p>
        )}
        <ReviewForm entityId={entity.id} entitySlug={entity.slug} entityName={entity.name} />
      </section>

      {/* Alternatives */}
      {alternatives.length > 0 ? (
        <section aria-labelledby="alternatives-heading" className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 id="alternatives-heading" className="text-lg font-semibold">
              Alternatives to {entity.name}
            </h2>
            <Link
              href={`/tools/${entity.slug}/alternatives`}
              className="text-sm font-medium text-brand"
            >
              See all →
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {alternatives.map((alternative) => (
              <EntityCard key={alternative.id} entity={alternative} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
