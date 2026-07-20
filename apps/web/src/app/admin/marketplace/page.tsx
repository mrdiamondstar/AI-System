import { listPendingListings } from "@dstarix/marketplace";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";
import { ReviewControls } from "./review-controls";

/** Marketplace listing review queue (doc 07 §2). Layout role-gates access. */
export default async function AdminMarketplacePage() {
  const pending = await listPendingListings();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Marketplace review</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {pending.length} listing{pending.length === 1 ? "" : "s"} awaiting review.
      </p>

      <ul className="mt-8 space-y-4">
        {pending.map((listing) => (
          <li key={listing.id}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-sm">
                    {listing.title} <Badge variant="brand">{listing.type}</Badge>
                  </CardTitle>
                  <ReviewControls listingId={listing.id} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {listing.seller.name ?? listing.seller.email} ·{" "}
                  {listing.priceMinor === 0 ? "Free" : `$${(listing.priceMinor / 100).toFixed(2)}`}
                </p>
              </CardHeader>
              <CardContent>{listing.summary}</CardContent>
            </Card>
          </li>
        ))}
      </ul>
      {pending.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">Queue is clear. 🎉</p>
      ) : null}
    </main>
  );
}
