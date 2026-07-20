import { prisma } from "@dstarix/db";

/**
 * Admin reporting reads (doc 07 §6, §9). Aggregations over the first-party
 * event store + operational tables. Kept read-only and cheap; when event
 * volume outgrows Postgres these move to the ClickHouse rollups behind the
 * same function signatures.
 */

function sinceDaysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/** Top zero-result search queries — the content-gap signal (doc 06 §3). */
export async function topZeroResultQueries(
  limit = 20,
): Promise<Array<{ query: string; count: number }>> {
  const rows = await prisma.$queryRaw<Array<{ query: string; count: bigint }>>`
    SELECT COALESCE(meta->>'query', path) AS query, COUNT(*) AS count
    FROM analytics_events
    WHERE name = 'search_zero_results'
      AND created_at > ${sinceDaysAgo(30)}
    GROUP BY 1
    ORDER BY count DESC
    LIMIT ${limit}
  `;
  return rows.map((row) => ({ query: row.query ?? "(unknown)", count: Number(row.count) }));
}

export interface EventCount {
  name: string;
  count: number;
}

/** Event volumes over a window — drives the SEO/engagement overview. */
export async function eventCounts(days = 30): Promise<EventCount[]> {
  const rows = await prisma.$queryRaw<Array<{ name: string; count: bigint }>>`
    SELECT name, COUNT(*) AS count
    FROM analytics_events
    WHERE created_at > ${sinceDaysAgo(days)}
    GROUP BY name
    ORDER BY count DESC
  `;
  return rows.map((row) => ({ name: row.name, count: Number(row.count) }));
}

export interface RevenueSummary {
  activeSubscriptions: number;
  marketplaceOrders: number;
  marketplaceGmvMinor: number;
  platformFeesMinor: number;
  outboundClicks: number;
  newsletterSubscribers: number;
}

/** Revenue dashboard summary across billing + marketplace + affiliate. */
export async function revenueSummary(): Promise<RevenueSummary> {
  const [subs, orders, gmv, fees, clicks, subscribers] = await Promise.all([
    prisma.subscription.count({ where: { status: { in: ["ACTIVE", "TRIALING"] } } }),
    prisma.marketplaceOrder.count({ where: { status: "PAID" } }),
    prisma.marketplaceOrder.aggregate({ where: { status: "PAID" }, _sum: { amountMinor: true } }),
    prisma.ledgerEntry.aggregate({
      where: { account: "platform:fees" },
      _sum: { amountMinor: true },
    }),
    prisma.analyticsEvent.count({
      where: { name: "outbound_click", createdAt: { gt: sinceDaysAgo(30) } },
    }),
    prisma.newsletterSubscriber.count({ where: { status: { not: "UNSUBSCRIBED" } } }),
  ]);

  return {
    activeSubscriptions: subs,
    marketplaceOrders: orders,
    marketplaceGmvMinor: gmv._sum.amountMinor ?? 0,
    platformFeesMinor: fees._sum.amountMinor ?? 0,
    outboundClicks: clicks,
    newsletterSubscribers: subscribers,
  };
}

export interface AutomationHealth {
  outboxBacklog: number;
  outboxFailed: number;
  embeddedEntities: number;
  publishedEntities: number;
  recentAuditActions: Array<{ action: string; resource: string; createdAt: Date }>;
}

/** Automation/health panel: outbox backlog, projection coverage, audit tail. */
export async function automationHealth(): Promise<AutomationHealth> {
  const [backlog, failed, embedded, published, audit] = await Promise.all([
    prisma.outboxEvent.count({ where: { processedAt: null } }),
    prisma.outboxEvent.count({ where: { processedAt: null, attempts: { gte: 10 } } }),
    prisma.embedding.count({ where: { subjectKind: "entity" } }),
    prisma.entity.count({ where: { status: "PUBLISHED", deletedAt: null } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { action: true, resource: true, createdAt: true },
    }),
  ]);

  return {
    outboxBacklog: backlog,
    outboxFailed: failed,
    embeddedEntities: embedded,
    publishedEntities: published,
    recentAuditActions: audit,
  };
}
