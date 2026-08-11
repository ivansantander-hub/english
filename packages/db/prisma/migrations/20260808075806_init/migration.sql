-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('translation_es_en', 'translation_en_es', 'fill_blank', 'correct_sentence', 'free_writing', 'paragraph_translation');

-- CreateEnum
CREATE TYPE "CefrLevel" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- CreateEnum
CREATE TYPE "ExerciseSource" AS ENUM ('seeded', 'ai_generated');

-- CreateEnum
CREATE TYPE "ErrorType" AS ENUM ('grammar', 'third_person_singular', 'verb_tense', 'word_order', 'preposition', 'article', 'pronoun', 'possessive', 'vocabulary', 'expression', 'meaning', 'spelling', 'naturalness');

-- CreateEnum
CREATE TYPE "LLMRequestType" AS ENUM ('evaluation', 'generation', 'explanation', 'conversation');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Concept" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grammarTopic" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "Concept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "type" "ExerciseType" NOT NULL,
    "level" "CefrLevel" NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "grammarTopic" TEXT NOT NULL,
    "spanishText" TEXT,
    "expectedAnswer" TEXT,
    "prompt" TEXT,
    "contextHint" TEXT,
    "source" "ExerciseSource" NOT NULL DEFAULT 'seeded',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseConcept" (
    "exerciseId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,

    CONSTRAINT "ExerciseConcept_pkey" PRIMARY KEY ("exerciseId","conceptId")
);

-- CreateTable
CREATE TABLE "ExerciseAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "rawAnswer" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SentenceResult" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "sentenceIndex" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SentenceResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Error" (
    "id" TEXT NOT NULL,
    "sentenceResultId" TEXT NOT NULL,
    "type" "ErrorType" NOT NULL,
    "category" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "correctedText" TEXT,

    CONSTRAINT "Error_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserConceptProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "lastPracticedAt" TIMESTAMP(3),

    CONSTRAINT "UserConceptProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "exercisesCompleted" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LearningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LLMRequest" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "requestType" "LLMRequestType" NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LLMRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Concept_key_key" ON "Concept"("key");

-- CreateIndex
CREATE INDEX "Concept_grammarTopic_idx" ON "Concept"("grammarTopic");

-- CreateIndex
CREATE INDEX "Exercise_grammarTopic_level_difficulty_idx" ON "Exercise"("grammarTopic", "level", "difficulty");

-- CreateIndex
CREATE INDEX "ExerciseConcept_conceptId_idx" ON "ExerciseConcept"("conceptId");

-- CreateIndex
CREATE INDEX "ExerciseAttempt_userId_createdAt_idx" ON "ExerciseAttempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ExerciseAttempt_exerciseId_idx" ON "ExerciseAttempt"("exerciseId");

-- CreateIndex
CREATE INDEX "SentenceResult_attemptId_idx" ON "SentenceResult"("attemptId");

-- CreateIndex
CREATE INDEX "Error_sentenceResultId_idx" ON "Error"("sentenceResultId");

-- CreateIndex
CREATE INDEX "Error_type_category_idx" ON "Error"("type", "category");

-- CreateIndex
CREATE INDEX "UserConceptProgress_userId_idx" ON "UserConceptProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserConceptProgress_userId_conceptId_key" ON "UserConceptProgress"("userId", "conceptId");

-- CreateIndex
CREATE INDEX "LearningSession_userId_startedAt_idx" ON "LearningSession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "LLMRequest_requestType_createdAt_idx" ON "LLMRequest"("requestType", "createdAt");

-- AddForeignKey
ALTER TABLE "Concept" ADD CONSTRAINT "Concept_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Concept"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseConcept" ADD CONSTRAINT "ExerciseConcept_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseConcept" ADD CONSTRAINT "ExerciseConcept_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentenceResult" ADD CONSTRAINT "SentenceResult_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExerciseAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Error" ADD CONSTRAINT "Error_sentenceResultId_fkey" FOREIGN KEY ("sentenceResultId") REFERENCES "SentenceResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConceptProgress" ADD CONSTRAINT "UserConceptProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConceptProgress" ADD CONSTRAINT "UserConceptProgress_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
