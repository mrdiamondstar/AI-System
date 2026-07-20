import { createQueue, jobs } from "@dstarix/queue";
import { scopedLogger } from "@dstarix/shared";
import { relayOutboxBatch } from "./outbox-relay";

const log = scopedLogger("workers");

/**
 * Worker tier entrypoint (doc 02): outbox relay + queue consumers + cron.
 * Handlers registered here must all be idempotent (at-least-once delivery).
 */
async function main() {
  const queue = await createQueue();

  // Outbox relay: scheduled tick + immediate kick so a fresh boot drains fast.
  await queue.work(jobs.outboxRelay, async () => {
    let drained: number;
    do {
      drained = await relayOutboxBatch(queue);
    } while (drained > 0);
  });
  await queue.schedule(jobs.outboxRelay, "* * * * *");
  await queue.send(jobs.outboxRelay, {});

  // Event consumers. Idempotent by construction (at-least-once delivery).
  // Phase 1 keeps derived state in Postgres; when Meilisearch/embeddings land
  // these handlers fan out to those projections behind the same events.
  await queue.work<{ topic: string; payload: { entityId?: string } }>(
    "event.tool.published.v1",
    async ({ payload }) => {
      if (payload.entityId) {
        log.info({ entityId: payload.entityId }, "tool.published — projections would refresh here");
      }
    },
  );
  await queue.work<{ topic: string; payload: { entityId?: string } }>(
    "event.tool.updated.v1",
    async ({ payload }) => {
      if (payload.entityId) {
        log.info({ entityId: payload.entityId }, "tool.updated — projections would refresh here");
      }
    },
  );

  const shutdown = async (signal: string) => {
    log.info({ signal }, "shutting down");
    await queue.stop();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  log.info("workers ready");
}

main().catch((error) => {
  log.error({ err: error }, "worker boot failed");
  process.exit(1);
});
