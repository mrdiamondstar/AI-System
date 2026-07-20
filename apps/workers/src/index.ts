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

  // Event consumers land here as modules ship (search indexer, embeddings,
  // score recompute, notifications) — see packages/queue jobs registry.

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
