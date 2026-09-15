-- Mechanic becomes TraitDef (ADR-013).
--
-- Destructive on purpose: there is no production database, so tables are dropped and
-- recreated instead of renamed. `trait_def_id` is added as NOT NULL without a default,
-- which only succeeds on empty tables. Apply with `prisma migrate reset`, not on a
-- database that holds traits.

-- DropForeignKey
ALTER TABLE "mechanics" DROP CONSTRAINT "mechanics_campaign_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_traits" DROP CONSTRAINT "asset_traits_mechanic_id_fkey";

-- DropForeignKey
ALTER TABLE "entity_traits" DROP CONSTRAINT "entity_traits_mechanic_id_fkey";

-- DropIndex
DROP INDEX "asset_traits_mechanic_id_idx";

-- DropIndex
DROP INDEX "asset_traits_asset_id_mechanic_id_key";

-- DropIndex
DROP INDEX "entity_traits_mechanic_id_idx";

-- DropIndex
DROP INDEX "entity_traits_entity_id_mechanic_id_key";

-- AlterTable
ALTER TABLE "asset_traits" DROP COLUMN "mechanic_id",
ADD COLUMN     "trait_def_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "entity_traits" DROP COLUMN "mechanic_id",
ADD COLUMN     "trait_def_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "mechanics";

-- CreateTable
CREATE TABLE "trait_defs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "campaign_id" TEXT NOT NULL,

    CONSTRAINT "trait_defs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trait_defs_campaign_id_key_key" ON "trait_defs"("campaign_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "trait_defs_campaign_id_label_key" ON "trait_defs"("campaign_id", "label");

-- CreateIndex
CREATE INDEX "asset_traits_trait_def_id_idx" ON "asset_traits"("trait_def_id");

-- CreateIndex
CREATE UNIQUE INDEX "asset_traits_asset_id_trait_def_id_key" ON "asset_traits"("asset_id", "trait_def_id");

-- CreateIndex
CREATE INDEX "entity_traits_trait_def_id_idx" ON "entity_traits"("trait_def_id");

-- CreateIndex
CREATE UNIQUE INDEX "entity_traits_entity_id_trait_def_id_key" ON "entity_traits"("entity_id", "trait_def_id");

-- AddForeignKey
ALTER TABLE "trait_defs" ADD CONSTRAINT "trait_defs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_traits" ADD CONSTRAINT "asset_traits_trait_def_id_fkey" FOREIGN KEY ("trait_def_id") REFERENCES "trait_defs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_traits" ADD CONSTRAINT "entity_traits_trait_def_id_fkey" FOREIGN KEY ("trait_def_id") REFERENCES "trait_defs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
