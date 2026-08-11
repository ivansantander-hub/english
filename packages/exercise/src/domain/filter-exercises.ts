import type { CefrLevel, ExerciseType } from "@english-a1/shared";

export interface FilterableExercise {
  id: string;
  type: ExerciseType;
  level: CefrLevel;
  difficulty: number;
  grammarTopic: string;
  conceptKeys: string[];
}

export interface ExerciseFilterCriteria {
  level?: CefrLevel;
  type?: ExerciseType;
  grammarTopic?: string;
  /** Exercise must target at least one of these concepts. */
  conceptKeys?: string[];
  minDifficulty?: number;
  maxDifficulty?: number;
  /** Exclude exercises already attempted recently (e.g. within a session). */
  excludeIds?: string[];
}

export function filterExercises<T extends FilterableExercise>(
  exercises: readonly T[],
  criteria: ExerciseFilterCriteria,
): T[] {
  const excludeIds = new Set(criteria.excludeIds ?? []);

  return exercises.filter((exercise) => {
    if (criteria.level !== undefined && exercise.level !== criteria.level) return false;
    if (criteria.type !== undefined && exercise.type !== criteria.type) return false;
    if (criteria.grammarTopic !== undefined && exercise.grammarTopic !== criteria.grammarTopic) {
      return false;
    }
    if (criteria.minDifficulty !== undefined && exercise.difficulty < criteria.minDifficulty) {
      return false;
    }
    if (criteria.maxDifficulty !== undefined && exercise.difficulty > criteria.maxDifficulty) {
      return false;
    }
    if (excludeIds.has(exercise.id)) return false;
    if (criteria.conceptKeys !== undefined && criteria.conceptKeys.length > 0) {
      const targetsRequestedConcept = exercise.conceptKeys.some((key) =>
        criteria.conceptKeys?.includes(key),
      );
      if (!targetsRequestedConcept) return false;
    }
    return true;
  });
}
