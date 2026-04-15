-- CreateTable
CREATE TABLE "entities" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,

    CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_traits" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "entity_id" TEXT NOT NULL,
    "mechanic_id" TEXT NOT NULL,

    CONSTRAINT "entity_traits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_relations" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "data" JSONB,
    "source_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,

    CONSTRAINT "entity_relations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "entity_traits_entity_id_mechanic_id_key" ON "entity_traits"("entity_id", "mechanic_id");

-- CreateIndex
CREATE INDEX "entity_relations_source_id_key_idx" ON "entity_relations"("source_id", "key");

-- CreateIndex
CREATE INDEX "entity_relations_target_id_key_idx" ON "entity_relations"("target_id", "key");

-- AddForeignKey
ALTER TABLE "entities" ADD CONSTRAINT "entities_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entities" ADD CONSTRAINT "entities_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_traits" ADD CONSTRAINT "entity_traits_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_traits" ADD CONSTRAINT "entity_traits_mechanic_id_fkey" FOREIGN KEY ("mechanic_id") REFERENCES "mechanics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_relations" ADD CONSTRAINT "entity_relations_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_relations" ADD CONSTRAINT "entity_relations_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
