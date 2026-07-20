import { upsertEntityEmbedding } from "@dstarix/catalog";
import { prisma } from "@dstarix/db";
import { scopedLogger } from "@dstarix/shared";

const log = scopedLogger("projections");

/**
 * Entity projections: keep derived stores in sync with the catalog. Today this
 * refreshes the pgvector embedding; the Meilisearch index upsert fans out from
 * the same function once that store is provisioned. Idempotent — safe to
 * replay (at-least-once delivery).
 */
export async function refreshEntityProjections(entityId: string): Promise<void> {
  const entity = await prisma.entity.findUnique({
    where: { id: entityId },
    select: { id: true, name: true, tagline: true, summary: true, status: true },
  });
  if (!entity || entity.status !== "PUBLISHED") return;

  await upsertEntityEmbedding(entity);
  log.info({ entityId }, "entity projections refreshed");
}
