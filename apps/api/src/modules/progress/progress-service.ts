import { prisma } from "@english-a1/db";
import { computeAccuracy, computeActivityStreak, computePriority } from "@english-a1/learning";
import type { ConceptProgress } from "@english-a1/shared";

export interface DailyActivity {
  /** YYYY-MM-DD, UTC calendar day. */
  date: string;
  count: number;
}

export interface ActivitySummary {
  /** Oldest first, one entry per day, always exactly `days` entries. */
  activity: DailyActivity[];
  currentStreak: number;
  practicedToday: boolean;
  todayCount: number;
}

/** How far back to look when computing the streak — long enough that a real streak never gets truncated. */
const STREAK_LOOKBACK_DAYS = 60;

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export class ProgressService {
  async getConceptProgress(userId: string): Promise<ConceptProgress[]> {
    const concepts = await prisma.concept.findMany({
      include: {
        userProgress: { where: { userId } },
        children: { select: { id: true } },
      },
      orderBy: { name: "asc" },
    });

    // Organizational parent concepts (e.g. "prepositions") group their
    // children by grammarTopic already — showing them alongside their own
    // children would double-count the same practice under two rows.
    const leafConcepts = concepts.filter((concept) => concept.children.length === 0);

    return leafConcepts.map((concept) => {
      const progress = concept.userProgress[0];
      const attempts = progress?.attempts ?? 0;
      const correct = progress?.correct ?? 0;
      const accuracy = computeAccuracy(attempts, correct);

      return {
        conceptId: concept.id,
        conceptKey: concept.key,
        conceptName: concept.name,
        grammarTopic: concept.grammarTopic,
        attempts,
        correct,
        accuracy,
        priority: computePriority(attempts, accuracy),
        lastPracticedAt: progress?.lastPracticedAt ?? null,
      };
    });
  }

  async getExercisesCompletedCount(userId: string): Promise<number> {
    return prisma.exerciseAttempt.count({ where: { userId } });
  }

  /** Recent daily activity plus the current practice streak, for the progress dashboard. */
  async getActivitySummary(userId: string, days = 14): Promise<ActivitySummary> {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - STREAK_LOOKBACK_DAYS);
    since.setUTCHours(0, 0, 0, 0);

    const attempts = await prisma.exerciseAttempt.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { createdAt: true },
    });

    const countsByDate = new Map<string, number>();
    for (const attempt of attempts) {
      const key = toDateKey(attempt.createdAt);
      countsByDate.set(key, (countsByDate.get(key) ?? 0) + 1);
    }

    const today = toDateKey(new Date());
    const { currentStreak, practicedToday } = computeActivityStreak(
      [...countsByDate.keys()],
      today,
    );

    const activity: DailyActivity[] = [];
    for (let offset = days - 1; offset >= 0; offset--) {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - offset);
      const key = toDateKey(date);
      activity.push({ date: key, count: countsByDate.get(key) ?? 0 });
    }

    return {
      activity,
      currentStreak,
      practicedToday,
      todayCount: countsByDate.get(today) ?? 0,
    };
  }
}
