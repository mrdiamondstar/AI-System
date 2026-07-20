-- CreateTable
CREATE TABLE "analytics_events" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT,
    "entity_id" UUID,
    "user_id" UUID,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_events_name_created_at_idx" ON "analytics_events"("name", "created_at");

-- CreateIndex
CREATE INDEX "analytics_events_entity_id_name_idx" ON "analytics_events"("entity_id", "name");

