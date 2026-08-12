-- AlterEnum
ALTER TYPE "LLMRequestType" ADD VALUE 'analysis';

-- CreateTable
CREATE TABLE "ProfileAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gradedBy" "GradedBy" NOT NULL,
    "summary" TEXT NOT NULL,
    "summaryEs" TEXT NOT NULL,
    "strengths" TEXT[],
    "strengthsEs" TEXT[],

    CONSTRAINT "ProfileAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileAnalysisFocusArea" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "concept" TEXT NOT NULL,
    "why" TEXT NOT NULL,
    "whyEs" TEXT NOT NULL,
    "howTo" TEXT NOT NULL,
    "howToEs" TEXT NOT NULL,

    CONSTRAINT "ProfileAnalysisFocusArea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfileAnalysis_userId_createdAt_idx" ON "ProfileAnalysis"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ProfileAnalysisFocusArea_analysisId_idx" ON "ProfileAnalysisFocusArea"("analysisId");

-- AddForeignKey
ALTER TABLE "ProfileAnalysis" ADD CONSTRAINT "ProfileAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileAnalysisFocusArea" ADD CONSTRAINT "ProfileAnalysisFocusArea_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "ProfileAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
