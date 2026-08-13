-- CreateEnum
CREATE TYPE "VideoLanguage" AS ENUM ('es', 'en');

-- CreateEnum
CREATE TYPE "VideoLanguagePreference" AS ENUM ('auto', 'es', 'en');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "videoLanguagePreference" "VideoLanguagePreference" NOT NULL DEFAULT 'auto';

-- AlterTable
-- language is added nullable first because production already has
-- RecommendedVideo rows from the first ship (all fetched via the
-- English-only search path) — backfilled to 'en' before locking NOT NULL,
-- same discipline as the topicType/topicKey fix on the previous migration.
ALTER TABLE "RecommendedVideo" ADD COLUMN "language" "VideoLanguage";

UPDATE "RecommendedVideo" SET "language" = 'en' WHERE "language" IS NULL;

ALTER TABLE "RecommendedVideo" ALTER COLUMN "language" SET NOT NULL;

-- DropIndex
DROP INDEX "RecommendedVideo_topicType_topicKey_idx";

-- DropIndex
DROP INDEX "RecommendedVideo_topicType_topicKey_videoId_key";

-- CreateIndex
CREATE INDEX "RecommendedVideo_topicType_topicKey_language_idx" ON "RecommendedVideo"("topicType", "topicKey", "language");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendedVideo_topicType_topicKey_language_videoId_key" ON "RecommendedVideo"("topicType", "topicKey", "language", "videoId");
