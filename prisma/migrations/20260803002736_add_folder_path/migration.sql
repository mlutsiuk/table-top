-- Nullable first, so existing rows survive the column being added.
ALTER TABLE "folders" ADD COLUMN "path" TEXT[];

-- Backfill by walking down from the roots, carrying the ancestry along.
WITH RECURSIVE tree AS (
  SELECT id, ARRAY[id] AS path
  FROM "folders"
  WHERE "parent_id" IS NULL

  UNION ALL

  SELECT f.id, t.path || f.id
  FROM "folders" f
  JOIN tree t ON f."parent_id" = t.id
)
UPDATE "folders" SET "path" = tree.path
FROM tree
WHERE "folders".id = tree.id;

-- Fails loudly if the walk missed a row, which would mean an orphaned folder.
ALTER TABLE "folders" ALTER COLUMN "path" SET NOT NULL;

-- Containment lookups (`path @> ARRAY[id]`) select a whole subtree at once.
CREATE INDEX "folders_path_idx" ON "folders" USING GIN ("path");
