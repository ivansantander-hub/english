-- AlterTable
ALTER TABLE "LLMRequest" ADD COLUMN     "costUsd" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "AISettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "defaultModel" TEXT NOT NULL,
    "evaluationModel" TEXT,
    "conversationModel" TEXT,
    "analysisModel" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISettings_pkey" PRIMARY KEY ("id")
);
