-- CreateEnum
CREATE TYPE "GradedBy" AS ENUM ('ai', 'rules');

-- AlterTable
ALTER TABLE "ExerciseAttempt" ADD COLUMN     "gradedBy" "GradedBy";

-- AlterTable
ALTER TABLE "LLMRequest" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "LLMRequest_userId_createdAt_idx" ON "LLMRequest"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "LLMRequest" ADD CONSTRAINT "LLMRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
