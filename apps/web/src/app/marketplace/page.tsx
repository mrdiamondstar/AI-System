import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedListings } from "@dstarix/marketplace";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "AI Marketplace — agents, prompts & templates",
  description:
    "Buy and sell verified AI agents, prompts, and templates on DStarix. Every listing is reviewed before publishing.",
};

const typeLabels: Record<string, string> = {
  AGENT: "Agent",
  PROMPT: "Prompt",
  TEMPLATE: "Template",
};

function typeLabel(type: string): string {
  return typeLabels[type] ?? type;
}

function price(minor: number, currency: string): string {
  if (minor === 0) return "Free";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(minor / 100);
}

export default async function MarketplacePage() {
  const listings = await listPublishedListings();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">AI Marketplace</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Verified agents, prompts, and templates. Every listing is reviewed before it&apos;s
            published.
          </p>
        </div>
        <Link
          href="/marketplace/sell"
          className="inline-flex h-10 items-center rounded-[var(--ds-radius-md)] bg-[var(--ds-brand)] px-4 text-sm font-medium text-[var(--ds-brand-foreground)]"
        >
          Sell on DStarix
        </Link>
      </div>

      {listings.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <Link key={listing.slug} href={`/marketplace/${listing.slug}`} className="group block">
              <Card className="h-full group-hover:shadow-[var(--ds-shadow-md)]">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="group-hover:text-brand">{listing.title}</CardTitle>
                    <Badge variant="brand">{typeLabel(listing.type)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    by {listing.seller.name ?? listing.seller.handle ?? "DStarix seller"}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="line-clamp-2">{listing.summary}</p>
                  <span className="font-semibold text-foreground">
                    {price(listing.priceMinor, listing.currency)}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-10 rounded-[var(--ds-radius-lg)] border border-border p-6 text-sm text-muted-foreground">
          No listings published yet. Be the first to{" "}
          <Link href="/marketplace/sell" className="font-medium text-brand">
            sell on DStarix
          </Link>
          .
        </p>
      )}
    </main>
  );
}
