import { revenueSummary } from "@dstarix/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";

function usd(minor: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(minor / 100);
}

/**
 * Revenue dashboard (doc 07 §9): subscriptions, marketplace GMV + platform
 * fees, affiliate clicks, newsletter size. Numbers are live from billing +
 * marketplace + first-party analytics.
 */
export default async function AdminRevenuePage() {
  const r = await revenueSummary();

  const stats = [
    { label: "Active subscriptions", value: r.activeSubscriptions },
    { label: "Marketplace orders", value: r.marketplaceOrders },
    { label: "Marketplace GMV", value: usd(r.marketplaceGmvMinor) },
    { label: "Platform fees earned", value: usd(r.platformFeesMinor) },
    { label: "Affiliate clicks (30d)", value: r.outboundClicks },
    { label: "Newsletter subscribers", value: r.newsletterSubscribers },
  ];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Revenue</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Live across subscriptions, marketplace, and affiliate. Ads are deliberately secondary.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>{stat.label}</CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
