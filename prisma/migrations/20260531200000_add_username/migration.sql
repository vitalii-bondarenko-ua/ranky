-- Add username as nullable first so existing rows don't violate NOT NULL
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Backfill existing rows: use the part before @ in email, appending row number if needed
UPDATE "User"
SET "username" = CONCAT(
  SPLIT_PART(email, '@', 1),
  '_',
  SUBSTRING(id, 1, 4)
);

-- Now enforce NOT NULL and unique
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
