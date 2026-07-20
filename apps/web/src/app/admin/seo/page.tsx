import { eventCounts, topZeroResultQueries } from "@dstarix/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";

/**
 * SEO dashboard (doc 07 §9): zero-result queries (content-gap signal) and
 * event volumes. Google Search Console indexation/CTR joins here once the
 * property is verified (needs founder OAuth).
 */
export default async function AdminSeoPage() {
  const [zeroResults, events] = await Promise.all([topZeroResultQueries(), eventCounts(30)]);
  const searches = events.find((e) => e.name === "search")?.count ?? 0;
  const zero = events.find((e) => e.name === "search_zero_results")?.count ?? 0;
  const total = searches + zero;
  const successRate = total > 0 ? Math.round((searches / total) * 100) : null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">SEO & search</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Searches (30d)" value={total} />
        <Stat label="Zero-result searches" value={zero} />
        <Stat label="Search success rate" value={successRate !== null ? `${successRate}%` : "—"} />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Top zero-result queries (content gaps)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          These are searches that returned nothing — the highest-signal list for what to add next.
        </p>
        {zeroResults.length > 0 ? (
          <ul className="mt-4 divide-y divide-border rounded-[var(--ds-radius-lg)] border border-border">
            {zeroResults.map((row) => (
              <li key={row.query} className="flex items-center justify-between p-3 text-sm">
                <span className="font-medium">{row.query}</span>
                <span className="text-muted-foreground">{row.count}×</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No zero-result searches recorded yet.
          </p>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>{label}</CardContent>
    </Card>
  );
}
