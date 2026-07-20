import PgBoss from "pg-boss";
import { requireEnv, scopedLogger } from "@dstarix/shared";

/**
 * Queue abstraction (ADR-006): pg-boss (Postgres-backed) today; the interface
 * is the contract so a later move to BullMQ/Cloudflare Queues is a config
 * change for producers and consumers, not a rewrite.
 */

const log = scopedLogger("queue");

export interface JobQueue {
  send(name: string, data: object, options?: { startAfterSeconds?: number }): Promise<void>;
  schedule(name: string, cron: string, data?: object): Promise<void>;
  work<T extends object>(name: string, handler: (data: T) => Promise<void>): Promise<void>;
  stop(): Promise<void>;
}

/** Well-known job names — always reference these, never string literals. */
export const jobs = {
  outboxRelay: "outbox.relay",
  searchIndexEntity: "search.index-entity",
  refreshEmbedding: "ai.refresh-embedding",
  recomputeScore: "catalog.recompute-score",
  sendEmail: "notifications.send-email",
} as const;

export async function createQueue(): Promise<JobQueue> {
  const boss = new PgBoss({
    connectionString: requireEnv("DATABASE_URL"),
    schema: "pgboss",
  });

  boss.on("error", (error) => log.error({ err: error }, "queue error"));
  await boss.start();
  log.info("queue started");

  return {
    async send(name, data, options) {
      await boss.send(name, data, {
        retryLimit: 5,
        retryBackoff: true,
        startAfter: options?.startAfterSeconds,
      });
    },
    async schedule(name, cron, data) {
      await boss.schedule(name, cron, data ?? {});
    },
    async work<T extends object>(name: string, handler: (data: T) => Promise<void>) {
      await boss.createQueue(name).catch(() => undefined);
      await boss.work<T>(name, async ([job]) => {
        if (!job) return;
        log.debug({ job: name, id: job.id }, "job started");
        await handler(job.data);
        log.debug({ job: name, id: job.id }, "job completed");
      });
    },
    async stop() {
      await boss.stop();
    },
  };
}
