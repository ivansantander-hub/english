-- AlterTable
-- topicType/topicKey are added nullable first because production already has
-- ProfileAnalysisFocusArea rows from earlier releases (dev's empty table hid
-- this). Existing rows are backfilled with a best-effort slug so they still
-- resolve to *something* (or safely no match, which the video lookup already
-- handles) before the columns are locked to NOT NULL.
ALTER TABLE "ProfileAnalysisFocusArea" ADD COLUMN     "topicKey" TEXT,
ADD COLUMN     "topicType" TEXT;

UPDATE "ProfileAnalysisFocusArea"
SET "topicType" = 'concept',
    "topicKey" = lower(regexp_replace(regexp_replace(trim("concept"), '[^a-zA-Z0-9]+', '_', 'g'), '^_+|_+$', '', 'g'))
WHERE "topicKey" IS NULL;

ALTER TABLE "ProfileAnalysisFocusArea" ALTER COLUMN "topicKey" SET NOT NULL,
ALTER COLUMN "topicType" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "showVideoRecsInPractice" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showVideoRecsInProfile" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "RecommendedVideo" (
    "id" TEXT NOT NULL,
    "topicType" TEXT NOT NULL,
    "topicKey" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendedVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoWatchEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recommendedVideoId" TEXT NOT NULL,
    "watchedSeconds" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoWatchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecommendedVideo_topicType_topicKey_idx" ON "RecommendedVideo"("topicType", "topicKey");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendedVideo_topicType_topicKey_videoId_key" ON "RecommendedVideo"("topicType", "topicKey", "videoId");

-- CreateIndex
CREATE INDEX "VideoWatchEvent_userId_createdAt_idx" ON "VideoWatchEvent"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VideoWatchEvent_userId_recommendedVideoId_key" ON "VideoWatchEvent"("userId", "recommendedVideoId");

-- AddForeignKey
ALTER TABLE "VideoWatchEvent" ADD CONSTRAINT "VideoWatchEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoWatchEvent" ADD CONSTRAINT "VideoWatchEvent_recommendedVideoId_fkey" FOREIGN KEY ("recommendedVideoId") REFERENCES "RecommendedVideo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
