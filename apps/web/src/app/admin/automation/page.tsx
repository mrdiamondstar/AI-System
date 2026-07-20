import { automationHealth } from "@dstarix/analytics";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";

/**
 * Automation & health (doc 07 §9): outbox backlog/DLQ, projection coverage,
 * and the recent audit trail. This is the operator's at-a-glance system view.
 */
export default async function AdminAutomationPage() {
  const health = await automationHealth();
  const coverage =
    health.publishedEntities > 0
      ? Math.round((health.embeddedEntities / health.publishedEntities) * 100)
      : 100;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Automation & health</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <HealthStat
          label="Outbox backlog"
          value={health.outboxBacklog}
          ok={health.outboxBacklog < 100}
        />
        <HealthStat
          label="Dead-lettered events"
          value={health.outboxFailed}
          ok={health.outboxFailed === 0}
        />
        <HealthStat label="Embedding coverage" value={`${coverage}%`} ok={coverage >= 95} />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Recent admin actions</h2>
        {health.recentAuditActions.length > 0 ? (
          <ul className="mt-4 divide-y divide-border rounded-[var(--ds-radius-lg)] border border-border">
            {health.recentAuditActions.map((entry, i) => (
              <li key={i} className="flex items-center justify-between p-3 text-sm">
                <span>
                  <code className="text-brand">{entry.action}</code> on {entry.resource}
                </span>
                <span className="text-muted-foreground">
                  {entry.createdAt.toLocaleString("en-US")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No audited actions yet.</p>
        )}
      </section>
    </main>
  );
}

function HealthStat({ label, value, ok }: { label: string; value: string | number; ok: boolean }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-3xl">{value}</CardTitle>
          <Badge variant={ok ? "success" : "sponsored"}>{ok ? "OK" : "Check"}</Badge>
        </div>
      </CardHeader>
      <CardContent>{label}</CardContent>
    </Card>
  );
}
