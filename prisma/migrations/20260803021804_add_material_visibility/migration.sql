CREATE TYPE "MaterialVisibility" AS ENUM ('public', 'master_only');

-- Defaults make this non-destructive: everything that exists stays visible.
ALTER TABLE "folders" ADD COLUMN "visibility" "MaterialVisibility" NOT NULL DEFAULT 'public';
ALTER TABLE "assets"  ADD COLUMN "visibility" "MaterialVisibility" NOT NULL DEFAULT 'public';
