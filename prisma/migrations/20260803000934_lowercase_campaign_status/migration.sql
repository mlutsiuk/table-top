-- Renaming the labels in place keeps every existing row's status intact.
-- Recreating the type would have required rewriting the column and losing data.
ALTER TYPE "CampaignStatus" RENAME VALUE 'DRAFT' TO 'draft';
ALTER TYPE "CampaignStatus" RENAME VALUE 'ACTIVE' TO 'active';
ALTER TYPE "CampaignStatus" RENAME VALUE 'ARCHIVED' TO 'archived';

-- The column default was written against the old label.
ALTER TABLE "campaigns" ALTER COLUMN "status" SET DEFAULT 'draft';
