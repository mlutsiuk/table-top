-- CreateTable
CREATE TABLE "mechanics" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "campaign_id" TEXT NOT NULL,

    CONSTRAINT "mechanics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_traits" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "asset_id" TEXT NOT NULL,
    "mechanic_id" TEXT NOT NULL,

    CONSTRAINT "asset_traits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mechanics_campaign_id_name_key" ON "mechanics"("campaign_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "asset_traits_asset_id_mechanic_id_key" ON "asset_traits"("asset_id", "mechanic_id");

-- AddForeignKey
ALTER TABLE "mechanics" ADD CONSTRAINT "mechanics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_traits" ADD CONSTRAINT "asset_traits_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_traits" ADD CONSTRAINT "asset_traits_mechanic_id_fkey" FOREIGN KEY ("mechanic_id") REFERENCES "mechanics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
