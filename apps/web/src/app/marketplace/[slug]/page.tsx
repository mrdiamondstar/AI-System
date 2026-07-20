import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getListingBySlug } from "@dstarix/marketplace";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";
import { BuyButton } from "./buy-button";

export const revalidate = 300;
export const dynamicParams = true;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return {};
  return {
    title: listing.title,
    description: listing.summary.slice(0, 160),
    alternates: { canonical: `${siteUrl}/marketplace/${slug}` },
  };
}

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="brand">{typeLabel(listing.type)}</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{listing.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            by {listing.seller.name ?? listing.seller.handle ?? "DStarix seller"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold">{price(listing.priceMinor, listing.currency)}</p>
          <BuyButton slug={listing.slug} isFree={listing.priceMinor === 0} />
        </div>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>About this {typeLabel(listing.type).toLowerCase()}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap leading-relaxed">{listing.summary}</p>
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground">
        Reviewed and published by DStarix editors. The deliverable is released to your account
        immediately after purchase.
      </p>
    </main>
  );
}
