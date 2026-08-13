import { AIAnalysisFailedError } from "@english-a1/ai";
import type { AIService, PracticeAnalysisPromptInput } from "@english-a1/ai";
import { prisma } from "@english-a1/db";
import { aggregateErrors, detectWeaknesses } from "@english-a1/learning";
import type { ErrorEvent } from "@english-a1/learning";
import type { ConceptProgress, ProfileAnalysisResult } from "@english-a1/shared";

import { logLLMRequest } from "../../lib/llm-usage.js";
import type { AISettingsService } from "../admin/ai-settings-service.js";
import type { ProgressService } from "../progress/progress-service.js";

/** How many recent attempts to sample errors from — recent, not lifetime, is what's actionable. */
const RECENT_ATTEMPTS_FOR_SAMPLE = 10;
const RECENT_ERROR_SAMPLE_SIZE = 15;
const MAX_FALLBACK_FOCUS_AREAS = 3;

export interface ProfileAnalysisServiceConfig {
  aiService?: AIService;
  aiSettingsService: Pick<AISettingsService, "modelFor">;
  providerName: string;
}

export type TopicType = "concept" | "error_type";

export interface ProfileAnalysisFocusAreaDTO {
  concept: string;
  topicType: TopicType;
  topicKey: string;
  why: string;
  whyEs: string;
  howTo: string;
  howToEs: string;
}

export interface ProfileAnalysisDTO {
  id: string;
  createdAt: Date;
  gradedBy: "ai" | "rules";
  summary: string;
  summaryEs: string;
  strengths: string[];
  strengthsEs: string[];
  focusAreas: ProfileAnalysisFocusAreaDTO[];
}

export class ProfileAnalysisService {
  constructor(
    private readonly progressService: ProgressService,
    private readonly config: ProfileAnalysisServiceConfig,
  ) {}

  async generateAnalysis(userId: string): Promise<ProfileAnalysisDTO> {
    const concepts = await this.progressService.getConceptProgress(userId);
    const promptInput = await this.buildPromptInput(userId, concepts);
    const { result, gradedBy } = await this.analyze(userId, promptInput, concepts);
    return this.persist(userId, gradedBy, result);
  }

  async listAnalyses(userId: string): Promise<ProfileAnalysisDTO[]> {
    const rows = await prisma.profileAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { focusAreas: { orderBy: { order: "asc" } } },
    });
    return rows.map((row) => toDTO(row));
  }

  private async buildPromptInput(
    userId: string,
    concepts: ConceptProgress[],
  ): Promise<PracticeAnalysisPromptInput> {
    const [exercisesCompleted, exercisesSkipped, activitySummary, recentAttempts, skips] =
      await Promise.all([
        this.progressService.getExercisesCompletedCount(userId),
        this.progressService.getExercisesSkippedCount(userId),
        this.progressService.getActivitySummary(userId),
        prisma.exerciseAttempt.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: RECENT_ATTEMPTS_FOR_SAMPLE,
          include: { sentences: { include: { errors: true } } },
        }),
        prisma.exerciseSkip.findMany({
          where: { userId },
          include: { exercise: { select: { grammarTopic: true } } },
        }),
      ]);

    const totalAttempts = concepts.reduce((sum, c) => sum + c.attempts, 0);
    const totalCorrect = concepts.reduce((sum, c) => sum + c.correct, 0);
    const overallAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

    const recentErrors = recentAttempts.flatMap((attempt) =>
      attempt.sentences.flatMap((sentence) => sentence.errors),
    );

    const errorEvents: ErrorEvent[] = recentErrors.map((error) => ({
      type: error.type,
      category: error.category,
    }));
    const errorTypeCounts = new Map<string, number>();
    for (const aggregate of aggregateErrors(errorEvents)) {
      errorTypeCounts.set(aggregate.type, (errorTypeCounts.get(aggregate.type) ?? 0) + aggregate.count);
    }
    const errorTypeBreakdown = [...errorTypeCounts.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    const skipCounts = new Map<string, number>();
    for (const skip of skips) {
      const topic = skip.exercise.grammarTopic;
      skipCounts.set(topic, (skipCounts.get(topic) ?? 0) + 1);
    }
    const skipBreakdown = [...skipCounts.entries()]
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);

    return {
      overview: {
        exercisesCompleted,
        exercisesSkipped,
        overallAccuracy,
        currentStreak: activitySummary.currentStreak,
      },
      concepts: concepts.map((concept) => ({
        key: concept.conceptKey,
        name: concept.conceptName,
        topic: concept.grammarTopic,
        accuracy: concept.accuracy,
        attempts: concept.attempts,
        priority: concept.priority,
      })),
      errorTypeBreakdown,
      skipBreakdown,
      recentErrors: recentErrors.slice(0, RECENT_ERROR_SAMPLE_SIZE).map((error) => ({
        type: error.type,
        explanationEs: error.explanationEs ?? error.explanation,
        ...(error.correctedText ? { correctedText: error.correctedText } : {}),
      })),
    };
  }

  /**
   * Analyzes with the AI when configured, logging the call to LLMRequest
   * either way. Falls back to a deterministic (no AI) analysis if no
   * provider is configured or the AI call/validation fails — the learner
   * always gets something back, never just an error.
   */
  private async analyze(
    userId: string,
    promptInput: PracticeAnalysisPromptInput,
    concepts: ConceptProgress[],
  ): Promise<{ result: ProfileAnalysisResult; gradedBy: "ai" | "rules" }> {
    if (!this.config.aiService) {
      return { result: this.fallbackAnalysis(concepts), gradedBy: "rules" };
    }

    try {
      const model = await this.config.aiSettingsService.modelFor("analysis");
      const outcome = await this.config.aiService.analyzePractice({
        ...promptInput,
        model,
        providerName: this.config.providerName,
      });
      await logLLMRequest(userId, outcome.meta);
      return { result: outcome.analysis, gradedBy: "ai" };
    } catch (error) {
      if (error instanceof AIAnalysisFailedError) {
        await logLLMRequest(userId, error.meta);
        return { result: this.fallbackAnalysis(concepts), gradedBy: "rules" };
      }
      throw error;
    }
  }

  private fallbackAnalysis(concepts: ConceptProgress[]): ProfileAnalysisResult {
    const weakest = detectWeaknesses(concepts).slice(0, MAX_FALLBACK_FOCUS_AREAS);

    if (weakest.length === 0) {
      return {
        summary:
          "No concept is currently flagged as needing practice — you're keeping up with everything you've tried so far.",
        summaryEs:
          "Ningún concepto está marcado como que necesita práctica ahora mismo — vas al día con todo lo que has intentado.",
        strengths: ["Every concept you've practiced is at review level or above."],
        strengthsEs: ["Todos los conceptos que has practicado están en nivel de repaso o mejor."],
        focusAreas: [],
      };
    }

    return {
      summary: `Generated without AI. Your lowest-accuracy concepts right now: ${weakest.map((c) => c.conceptName).join(", ")}.`,
      summaryEs: `Generado sin IA. Tus conceptos con menor precisión ahora mismo: ${weakest.map((c) => c.conceptName).join(", ")}.`,
      strengths: ["See the full concept list on your Dashboard for the complete picture."],
      strengthsEs: ["Mira la lista completa de conceptos en tu Dashboard para el panorama completo."],
      focusAreas: weakest.map((concept) => ({
        concept: concept.conceptName,
        topicType: "concept" as const,
        topicKey: concept.conceptKey,
        why: `${Math.round(concept.accuracy * 100)}% accuracy across ${concept.attempts} attempts.`,
        whyEs: `${Math.round(concept.accuracy * 100)}% de precisión en ${concept.attempts} intentos.`,
        howTo: "Practice this concept from the Mistakes page.",
        howToEs: "Practica este concepto desde la página de Mistakes.",
      })),
    };
  }

  private async persist(
    userId: string,
    gradedBy: "ai" | "rules",
    result: ProfileAnalysisResult,
  ): Promise<ProfileAnalysisDTO> {
    const row = await prisma.profileAnalysis.create({
      data: {
        userId,
        gradedBy,
        summary: result.summary,
        summaryEs: result.summaryEs,
        strengths: result.strengths,
        strengthsEs: result.strengthsEs,
        focusAreas: {
          create: result.focusAreas.map((area, index) => ({
            order: index,
            concept: area.concept,
            topicType: area.topicType,
            topicKey: area.topicKey,
            why: area.why,
            whyEs: area.whyEs,
            howTo: area.howTo,
            howToEs: area.howToEs,
          })),
        },
      },
      include: { focusAreas: { orderBy: { order: "asc" } } },
    });

    return toDTO(row);
  }
}

interface ProfileAnalysisRow {
  id: string;
  createdAt: Date;
  gradedBy: "ai" | "rules";
  summary: string;
  summaryEs: string;
  strengths: string[];
  strengthsEs: string[];
  focusAreas: {
    concept: string;
    topicType: string;
    topicKey: string;
    why: string;
    whyEs: string;
    howTo: string;
    howToEs: string;
  }[];
}

function toDTO(row: ProfileAnalysisRow): ProfileAnalysisDTO {
  return {
    id: row.id,
    createdAt: row.createdAt,
    gradedBy: row.gradedBy,
    summary: row.summary,
    summaryEs: row.summaryEs,
    strengths: row.strengths,
    strengthsEs: row.strengthsEs,
    focusAreas: row.focusAreas.map((area) => ({
      concept: area.concept,
      topicType: area.topicType as TopicType,
      topicKey: area.topicKey,
      why: area.why,
      whyEs: area.whyEs,
      howTo: area.howTo,
      howToEs: area.howToEs,
    })),
  };
}
