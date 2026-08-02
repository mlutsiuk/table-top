-- DropForeignKey
ALTER TABLE "folders" DROP CONSTRAINT "folders_parent_id_fkey";

-- CreateIndex
CREATE INDEX "asset_traits_mechanic_id_idx" ON "asset_traits"("mechanic_id");

-- CreateIndex
CREATE INDEX "assets_campaign_id_idx" ON "assets"("campaign_id");

-- CreateIndex
CREATE INDEX "assets_folder_id_idx" ON "assets"("folder_id");

-- CreateIndex
CREATE INDEX "campaigns_master_id_idx" ON "campaigns"("master_id");

-- CreateIndex
CREATE INDEX "entities_asset_id_idx" ON "entities"("asset_id");

-- CreateIndex
CREATE INDEX "entities_campaign_id_idx" ON "entities"("campaign_id");

-- CreateIndex
CREATE INDEX "entity_traits_mechanic_id_idx" ON "entity_traits"("mechanic_id");

-- CreateIndex
CREATE INDEX "folders_campaign_id_idx" ON "folders"("campaign_id");

-- CreateIndex
CREATE INDEX "folders_parent_id_idx" ON "folders"("parent_id");

-- CreateIndex
CREATE INDEX "media_campaign_id_idx" ON "media"("campaign_id");

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
