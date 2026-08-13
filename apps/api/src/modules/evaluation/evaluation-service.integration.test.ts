import { AIService } from "@english-a1/ai";
import type {
  LLMChatStreamInput,
  LLMGenerateInput,
  LLMGenerateOutput,
  LLMProvider,
} from "@english-a1/ai";
import { prisma } from "@english-a1/db";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PrismaExerciseRepository } from "../exercises/exercise-repository.js";
import { ExerciseService } from "../exercises/exercise-service.js";
import { ProgressService } from "../progress/progress-service.js";

import { EvaluationService } from "./evaluation-service.js";

const progressService = new ProgressService();

class ScriptedProvider implements LLMProvider {
  constructor(private readonly response: LLMGenerateOutput | Error) {}

  generate(_input: LLMGenerateInput): Promise<LLMGenerateOutput> {
    if (this.response instanceof Error) return Promise.reject(this.response);
    return Promise.resolve(this.response);
  }

  // eslint-disable-next-line require-yield -- unused in these tests, satisfies the interface
  async *generateStream(_input: LLMChatStreamInput): AsyncIterable<string> {
    await Promise.resolve();
    throw new Error("ScriptedProvider.generateStream not used in these tests");
  }
}

/**
 * Exercises the full submit -> evaluate -> persist -> progress-update loop
 * against a real Postgres instance (no mocks). Requires DATABASE_URL to
 * point at a reachable database — see `pnpm db:migrate` / `docker compose up`.
 */
describe("EvaluationService (integration)", () => {
  const testEmail = "integration-test-user@english-a1.local";
  let userId: string;
  const evaluationService = new EvaluationService(
    new ExerciseService(new PrismaExerciseRepository(), progressService),
    {
      aiSettingsService: { modelFor: () => Promise.resolve("test-model") },
      providerName: "test-provider",
    },
  );

  beforeAll(async () => {
    const user = await prisma.user.upsert({
      where: { email: testEmail },
      update: {},
      create: { email: testEmail },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("persists a fully correct attempt and increments concept progress", async () => {
    const result = await evaluationService.submitAnswer(
      userId,
      "ps-001",
      "My brother works in an office.",
    );

    expect(result.overallScore).toBe(1);
    expect(result.sentences[0]?.correct).toBe(true);

    const attempt = await prisma.exerciseAttempt.findUnique({
      where: { id: result.attemptId },
      include: { sentences: { include: { errors: true } } },
    });
    expect(attempt).not.toBeNull();
    expect(attempt?.sentences).toHaveLength(1);
    expect(attempt?.sentences[0]?.correct).toBe(true);

    const concept = await prisma.concept.findUniqueOrThrow({
      where: { key: "third_person_singular" },
    });
    const progress = await prisma.userConceptProgress.findUnique({
      where: { userId_conceptId: { userId, conceptId: concept.id } },
    });
    expect(progress?.attempts).toBe(1);
    expect(progress?.correct).toBe(1);
  });

  it("persists an incorrect attempt with a grammar error and does not credit progress", async () => {
    // ps-cs-001: "Correct the sentence" prompt "He work in an office.",
    // expectedAnswer "He works in an office." — submit the uncorrected form first.
    const wrongAttempt = await evaluationService.submitAnswer(
      userId,
      "ps-cs-001",
      "He work in an office.",
    );
    expect(wrongAttempt.overallScore).toBe(0);
    expect(wrongAttempt.sentences[0]?.correct).toBe(false);
    expect(wrongAttempt.sentences[0]?.errors[0]?.type).toBe("grammar");

    const correctAttempt = await evaluationService.submitAnswer(
      userId,
      "ps-cs-001",
      "He works in an office.",
    );
    expect(correctAttempt.overallScore).toBe(1);

    const concept = await prisma.concept.findUniqueOrThrow({
      where: { key: "third_person_singular" },
    });
    const progress = await prisma.userConceptProgress.findUniqueOrThrow({
      where: { userId_conceptId: { userId, conceptId: concept.id } },
    });
    // Cumulative across both tests in this file: 1 (previous test, correct)
    // + 1 (wrong) + 1 (correct) = 3 attempts, 2 correct.
    expect(progress.attempts).toBe(3);
    expect(progress.correct).toBe(2);
  });

  it("grades with the AI provider when configured and logs a successful LLMRequest", async () => {
    const aiEvaluationService = new EvaluationService(
      new ExerciseService(new PrismaExerciseRepository(), progressService),
      {
        aiService: new AIService(
          new ScriptedProvider({
            text: JSON.stringify({
              overallScore: 1,
              sentences: [
                {
                  sentenceIndex: 0,
                  text: "We live near downtown.",
                  correct: true,
                  score: 1,
                  errors: [],
                },
              ],
            }),
            usage: { promptTokens: 12, completionTokens: 5 },
          }),
        ),
        aiSettingsService: { modelFor: () => Promise.resolve("test-model") },
        providerName: "test-provider",
      },
    );

    const result = await aiEvaluationService.submitAnswer(
      userId,
      "ps-022",
      "We live near downtown.",
    );
    expect(result.gradedBy).toBe("ai");

    const logged = await prisma.lLMRequest.findFirst({
      where: { model: "test-model", requestType: "evaluation" },
      orderBy: { createdAt: "desc" },
    });
    expect(logged?.success).toBe(true);
    expect(logged?.promptTokens).toBe(12);
  });

  it("falls back to rule-based grading and logs a failed LLMRequest when the AI call fails", async () => {
    const aiEvaluationService = new EvaluationService(
      new ExerciseService(new PrismaExerciseRepository(), progressService),
      {
        aiService: new AIService(new ScriptedProvider(new Error("simulated provider outage"))),
        aiSettingsService: { modelFor: () => Promise.resolve("test-model-down") },
        providerName: "test-provider",
      },
    );

    const result = await aiEvaluationService.submitAnswer(
      userId,
      "ps-023",
      "They play basketball on Fridays.",
    );
    expect(result.gradedBy).toBe("rules");
    expect(result.overallScore).toBe(1);

    const logged = await prisma.lLMRequest.findFirst({
      where: { model: "test-model-down", requestType: "evaluation" },
      orderBy: { createdAt: "desc" },
    });
    expect(logged?.success).toBe(false);
    expect(logged?.errorMessage).toContain("simulated provider outage");
  });
});
