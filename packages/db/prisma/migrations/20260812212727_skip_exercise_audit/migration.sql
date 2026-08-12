-- CreateTable
CREATE TABLE "ExerciseSkip" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseSkip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExerciseSkip_userId_createdAt_idx" ON "ExerciseSkip"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ExerciseSkip_exerciseId_idx" ON "ExerciseSkip"("exerciseId");

-- AddForeignKey
ALTER TABLE "ExerciseSkip" ADD CONSTRAINT "ExerciseSkip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseSkip" ADD CONSTRAINT "ExerciseSkip_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
