-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT';
