/**
 * Typed JSON-LD builders (doc 03 §4). Builders return plain objects; render
 * them with a single <script type="application/ld+json"> per page. Keeping
 * schema construction centralized means schema.org validity survives data
 * model evolution.
 */

export interface SoftwareApplicationInput {
  name: string;
  description: string;
  url: string;
  applicationCategory?: string;
  operatingSystem?: string;
  offers?:
    | { price: string; priceCurrency: string }
    | { lowPrice: string; highPrice: string; priceCurrency: string };
  aggregateRating?: { ratingValue: number; ratingCount: number };
}

export function softwareApplication(input: SoftwareApplicationInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: input.name,
    description: input.description,
    url: input.url,
    applicationCategory: input.applicationCategory ?? "WebApplication",
    operatingSystem: input.operatingSystem ?? "Web",
    ...(input.offers ? { offers: { "@type": "Offer", ...input.offers } } : {}),
    ...(input.aggregateRating && input.aggregateRating.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: input.aggregateRating.ratingValue,
            ratingCount: input.aggregateRating.ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

export function breadcrumbList(
  items: Array<{ name: string; url: string }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function organization(siteUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DStarix",
    legalName: "DStarix Techno Pvt Ltd",
    url: siteUrl,
  };
}

export function webSite(siteUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DStarix",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Serialize for a JSON-LD script tag, escaping to prevent script injection. */
export function jsonLd(...documents: Array<Record<string, unknown>>): string {
  const payload = documents.length === 1 ? documents[0] : documents;
  return JSON.stringify(payload).replaceAll("<", "\\u003c");
}
