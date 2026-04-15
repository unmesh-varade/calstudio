ALTER TABLE "users"
ADD COLUMN "username" TEXT;

UPDATE "users"
SET "username" = LOWER(REPLACE(SPLIT_PART(email, '@', 1), ' ', '-'))
WHERE "username" IS NULL;

ALTER TABLE "users"
ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
