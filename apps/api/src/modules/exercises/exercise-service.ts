import { prisma } from "@english-a1/db";
import { filterExercises } from "@english-a1/exercise";
import {
  BalancedPracticeStrategy,
  buildDailyPractice,
  pickRandomExercise,
  WeaknessPracticeStrategy,
} from "@english-a1/learning";
import type {
  DailyPracticeItem,
  DailyPracticeSliceLabel,
  ExerciseHistory,
  SelectionStrategy,
} from "@english-a1/learning";
import type { ConceptProgress } from "@english-a1/shared";

import { NotFoundError } from "../../errors.js";
import type { ProgressService } from "../progress/progress-service.js";

import type { ExerciseRecord, ExerciseRepository } from "./exercise-repository.js";

export type PracticeMode = "balanced" | "weakness";

/** Short-term "don't repeat the exact last thing I did" window. */
const RECENT_HISTORY_SIZE = 15;

export class ExerciseService {
  constructor(
    private readonly repository: ExerciseRepository,
    private readonly progressService: ProgressService,
  ) {}

  async getById(id: string): Promise<ExerciseRecord> {
    const exercise = await this.repository.findById(id);
    if (!exercise) throw new NotFoundError(`Exercise ${id} not found`);
    return exercise;
  }

  /** Records that the learner chose to skip this exercise rather than answer it. */
  async recordSkip(userId: string, exerciseId: string): Promise<void> {
    await prisma.exerciseSkip.create({ data: { userId, exerciseId } });
  }

  /**
   * Picks the next exercise for a user. "weakness" mode targets the
   * learner's lowest-accuracy concepts first; "balanced" picks a
   * weighted-random exercise, strongly favoring ones the learner hasn't
   * mastered yet. Passing `conceptKey` (from the Mistakes page) narrows the
   * pool to that single concept for targeted drilling. Either way, falls
   * back to the least-recently-practiced exercise if the strategy/filter
   * can't find a match — the learner always gets something.
   */
  async getNext(
    userId: string,
    mode: PracticeMode = "balanced",
    conceptKey?: string,
  ): Promise<ExerciseRecord> {
    const { candidates, recentIds, history, concepts } = await this.loadSelectionData(userId);

    if (conceptKey) {
      const targeted = filterExercises(candidates, { conceptKeys: [conceptKey] });
      const fresh = filterExercises(targeted, { excludeIds: recentIds });
      const chosen = pickRandomExercise(fresh, history) ?? pickRandomExercise(targeted, history);
      if (chosen) return this.getById(chosen.id);
    }

    const strategy: SelectionStrategy =
      mode === "weakness" ? new WeaknessPracticeStrategy() : new BalancedPracticeStrategy();
    const [picked] = strategy.select({
      concepts,
      exercises: candidates,
      excludeIds: recentIds,
      history,
      count: 1,
    });
    if (picked) return this.getById(picked.id);

    return this.fallbackLeastRecentlyPracticed(userId, candidates);
  }

  async getDailyPractice(
    userId: string,
  ): Promise<Array<{ exercise: ExerciseRecord; slice: DailyPracticeSliceLabel }>> {
    const { candidates, recentIds, history, concepts } = await this.loadSelectionData(userId);
    const items: DailyPracticeItem[] = buildDailyPractice(concepts, candidates, recentIds, history);

    const exercises = await this.repository.findManyByIds(items.map((item) => item.exercise.id));
    const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));

    return items
      .map((item) => {
        const exercise = byId.get(item.exercise.id);
        return exercise ? { exercise, slice: item.slice } : null;
      })
      .filter(
        (item): item is { exercise: ExerciseRecord; slice: DailyPracticeSliceLabel } =>
          item !== null,
      );
  }

  private async loadSelectionData(userId: string): Promise<{
    candidates: ExerciseRecord[];
    recentIds: string[];
    history: ExerciseHistory;
    concepts: ConceptProgress[];
  }> {
    const [allExercises, attempts, recentSkips, concepts, user] = await Promise.all([
      this.repository.findAll(),
      prisma.exerciseAttempt.findMany({
        where: { userId },
        select: { exerciseId: true, overallScore: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.exerciseSkip.findMany({
        where: { userId },
        select: { exerciseId: true },
        orderBy: { createdAt: "desc" },
        take: RECENT_HISTORY_SIZE,
      }),
      this.progressService.getConceptProgress(userId),
      prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { currentLevel: true } }),
    ]);

    const candidates = filterExercises(allExercises, { level: user.currentLevel });
    if (candidates.length === 0) {
      throw new NotFoundError(`No exercises available for level ${user.currentLevel}`);
    }
    // A just-skipped exercise shouldn't immediately resurface as "next", even
    // though skipping isn't an attempt and doesn't touch ExerciseAttempt.
    const recentIds = [
      ...new Set([
        ...attempts.slice(-RECENT_HISTORY_SIZE).map((attempt) => attempt.exerciseId),
        ...recentSkips.map((skip) => skip.exerciseId),
      ]),
    ];

    const history = new Map<string, { attempts: number; everFullyCorrect: boolean }>();
    for (const attempt of attempts) {
      const entry = history.get(attempt.exerciseId) ?? { attempts: 0, everFullyCorrect: false };
      entry.attempts += 1;
      entry.everFullyCorrect = entry.everFullyCorrect || attempt.overallScore >= 1;
      history.set(attempt.exerciseId, entry);
    }

    return { candidates, recentIds, history, concepts };
  }

  private async fallbackLeastRecentlyPracticed(
    userId: string,
    candidates: ExerciseRecord[],
  ): Promise<ExerciseRecord> {
    const attempts = await prisma.exerciseAttempt.findMany({
      where: { userId },
      select: { exerciseId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    const lastAttemptedAt = new Map<string, Date>();
    for (const attempt of attempts) {
      lastAttemptedAt.set(attempt.exerciseId, attempt.createdAt);
    }

    const unattempted = candidates.filter((exercise) => !lastAttemptedAt.has(exercise.id));
    if (unattempted.length > 0) {
      return unattempted[Math.floor(Math.random() * unattempted.length)] as ExerciseRecord;
    }

    const sortedByStaleness = [...candidates].sort((a, b) => {
      const aTime = lastAttemptedAt.get(a.id)?.getTime() ?? 0;
      const bTime = lastAttemptedAt.get(b.id)?.getTime() ?? 0;
      return aTime - bTime;
    });
    return sortedByStaleness[0] as ExerciseRecord;
  }
}
