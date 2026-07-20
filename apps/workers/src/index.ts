import { createQueue, jobs } from "@dstarix/queue";
import { scopedLogger } from "@dstarix/shared";
import { relayOutboxBatch } from "./outbox-relay";
import { refreshEntityProjections } from "./projections";

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
  // Refresh derived projections (pgvector embedding now; Meilisearch index
  // fans out from the same handler once provisioned).
  const onEntityChange = async ({ payload }: { payload: { entityId?: string } }) => {
    if (payload.entityId) await refreshEntityProjections(payload.entityId);
  };
  await queue.work<{ topic: string; payload: { entityId?: string } }>(
    "event.tool.published.v1",
    onEntityChange,
  );
  await queue.work<{ topic: string; payload: { entityId?: string } }>(
    "event.tool.updated.v1",
    onEntityChange,
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
