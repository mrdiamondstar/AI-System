import { prisma } from "@dstarix/db";
import { isKnownTopic } from "@dstarix/events";
import { scopedLogger } from "@dstarix/shared";
import type { JobQueue } from "@dstarix/queue";

const log = scopedLogger("outbox-relay");

const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 10;

/**
 * Transactional outbox relay (doc 02 §5): drains unprocessed outbox rows to
 * the queue as `event.<topic>` jobs. Rows are locked with FOR UPDATE SKIP
 * LOCKED so multiple relay instances never double-deliver a batch; consumers
 * are still required to be idempotent (at-least-once delivery).
 */
export async function relayOutboxBatch(queue: JobQueue): Promise<number> {
  const events = await prisma.$transaction(async (tx) => {
    const batch = await tx.$queryRaw<
      Array<{ id: string; topic: string; payload: unknown; occurred_at: Date }>
    >`
      SELECT id, topic, payload, occurred_at FROM outbox_events
      WHERE processed_at IS NULL AND attempts < ${MAX_ATTEMPTS}
      ORDER BY occurred_at
      LIMIT ${BATCH_SIZE}
      FOR UPDATE SKIP LOCKED
    `;
    if (batch.length > 0) {
      const ids = batch.map((event) => event.id);
      await tx.outboxEvent.updateMany({
        where: { id: { in: ids } },
        data: { processedAt: new Date() },
      });
    }
    return batch;
  });

  for (const event of events) {
    if (!isKnownTopic(event.topic)) {
      log.warn({ topic: event.topic, id: event.id }, "unknown outbox topic — skipped");
      continue;
    }
    await queue.send(`event.${event.topic}`, {
      eventId: event.id,
      topic: event.topic,
      payload: event.payload,
      occurredAt: event.occurred_at.toISOString(),
    });
  }

  if (events.length > 0) {
    log.info({ count: events.length }, "relayed outbox events");
  }
  return events.length;
}
