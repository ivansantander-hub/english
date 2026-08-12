import { AIEvaluationFailedError, evaluateWithRules } from "@english-a1/ai";
import type { AIService, LLMCallMeta } from "@english-a1/ai";
import { prisma } from "@english-a1/db";
import type { EvaluationResult } from "@english-a1/shared";

import { ValidationError } from "../../errors.js";
import type { ExerciseService } from "../exercises/exercise-service.js";

export interface SubmitAnswerResult extends EvaluationResult {
  attemptId: string;
  exerciseId: string;
  gradedBy: "ai" | "rules";
}

export interface EvaluationServiceConfig {
  aiService?: AIService;
  model: string;
  providerName: string;
}

export class EvaluationService {
  constructor(
    private readonly exerciseService: ExerciseService,
    private readonly config: EvaluationServiceConfig,
  ) {}

  async submitAnswer(
    userId: string,
    exerciseId: string,
    rawAnswer: string,
  ): Promise<SubmitAnswerResult> {
    const exercise = await this.exerciseService.getById(exerciseId);
    if (!exercise.expectedAnswer) {
      throw new ValidationError(
        `Exercise ${exerciseId} has no reference answer to grade against yet`,
      );
    }

    const { evaluation, gradedBy } = await this.grade(userId, {
      sourceText: exercise.spanishText ?? exercise.prompt ?? "",
      referenceAnswer: exercise.expectedAnswer,
      rawAnswer,
      ...(exercise.contextHint ? { contextHint: exercise.contextHint } : {}),
    });

    const attempt = await prisma.exerciseAttempt.create({
      data: {
        userId,
        exerciseId,
        rawAnswer,
        overallScore: evaluation.overallScore,
        gradedBy,
        sentences: {
          create: evaluation.sentences.map((sentence) => ({
            sentenceIndex: sentence.sentenceIndex,
            text: sentence.text,
            correct: sentence.correct,
            score: sentence.score,
            errors: {
              create: sentence.errors.map((error) => ({
                type: error.type,
                category: error.category,
                explanation: error.explanation,
                explanationEs: error.explanationEs,
                correctedText: error.correctedText ?? null,
              })),
            },
          })),
        },
      },
    });

    await this.updateConceptProgress(userId, exerciseId, evaluation);

    return { ...evaluation, attemptId: attempt.id, exerciseId, gradedBy };
  }

  /**
   * Grades with the AI evaluator when configured, logging the call to
   * LLMRequest either way. Falls back to exact-match rule-based grading if
   * no provider is configured, or if the AI call/validation fails — the
   * learner always gets a result, never a 500.
   */
  private async grade(
    userId: string,
    input: {
      sourceText: string;
      referenceAnswer: string;
      rawAnswer: string;
      contextHint?: string;
    },
  ): Promise<{ evaluation: EvaluationResult; gradedBy: "ai" | "rules" }> {
    if (!this.config.aiService) {
      return {
        evaluation: evaluateWithRules(input.rawAnswer, input.referenceAnswer),
        gradedBy: "rules",
      };
    }

    try {
      const outcome = await this.config.aiService.evaluateAnswer({
        ...input,
        model: this.config.model,
        providerName: this.config.providerName,
      });
      await this.logLLMRequest(userId, outcome.meta);
      return { evaluation: outcome.evaluation, gradedBy: "ai" };
    } catch (error) {
      if (error instanceof AIEvaluationFailedError) {
        await this.logLLMRequest(userId, error.meta);
        return {
          evaluation: evaluateWithRules(input.rawAnswer, input.referenceAnswer),
          gradedBy: "rules",
        };
      }
      throw error;
    }
  }

  private async logLLMRequest(userId: string, meta: LLMCallMeta): Promise<void> {
    await prisma.lLMRequest.create({
      data: {
        userId,
        provider: meta.provider,
        model: meta.model,
        requestType: meta.requestType,
        latencyMs: meta.latencyMs,
        success: meta.success,
        errorMessage: meta.errorMessage ?? null,
        promptTokens: meta.promptTokens ?? null,
        completionTokens: meta.completionTokens ?? null,
      },
    });
  }

  /**
   * Coarse-grained progress update: every concept targeted by this exercise
   * gets +1 attempt, and +1 correct only if every sentence in the answer
   * was correct. Concepts aren't yet tied to individual sentences in the
   * seed data, so per-sentence-per-concept attribution isn't possible —
   * this is the documented simplification until content carries that link.
   */
  private async updateConceptProgress(
    userId: string,
    exerciseId: string,
    evaluation: EvaluationResult,
  ): Promise<void> {
    const links = await prisma.exerciseConcept.findMany({ where: { exerciseId } });
    const wasFullyCorrect = evaluation.sentences.every((sentence) => sentence.correct);

    for (const link of links) {
      await prisma.userConceptProgress.upsert({
        where: { userId_conceptId: { userId, conceptId: link.conceptId } },
        update: {
          attempts: { increment: 1 },
          correct: { increment: wasFullyCorrect ? 1 : 0 },
          lastPracticedAt: new Date(),
        },
        create: {
          userId,
          conceptId: link.conceptId,
          attempts: 1,
          correct: wasFullyCorrect ? 1 : 0,
          lastPracticedAt: new Date(),
        },
      });
    }
  }
}
