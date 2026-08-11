import type { FilterableExercise } from "@english-a1/exercise";
import { filterExercises } from "@english-a1/exercise";
import type { ConceptProgress } from "@english-a1/shared";

import { detectWeaknesses } from "../domain/weakness.js";

import type { ExerciseHistory, WeightedPickOptions } from "./exercise-mastery.js";
import { pickManyRandomExercises, pickRandomExercise } from "./exercise-mastery.js";

export interface SelectionContext {
  concepts: readonly ConceptProgress[];
  exercises: readonly FilterableExercise[];
  /** Exercise ids to skip — typically recently attempted in this session. */
  excludeIds: readonly string[];
  /** Per-exercise attempt history, used to avoid re-serving mastered exercises. */
  history: ExerciseHistory;
  count: number;
  randomOptions?: WeightedPickOptions;
}

export interface SelectionStrategy {
  readonly name: string;
  select(context: SelectionContext): FilterableExercise[];
}

/**
 * Picks at most one exercise per concept key, in the given priority order,
 * weighted-random within each concept's candidates (favoring new/struggling
 * over already-mastered exercises) so repeated visits don't always show the
 * same sentence for a given concept.
 */
function pickOnePerConcept(
  exercises: readonly FilterableExercise[],
  conceptKeys: readonly string[],
  excludeIds: readonly string[],
  history: ExerciseHistory,
  count: number,
  randomOptions?: WeightedPickOptions,
): FilterableExercise[] {
  const picked: FilterableExercise[] = [];
  const seen = new Set(excludeIds);

  for (const key of conceptKeys) {
    if (picked.length >= count) break;
    const candidates = filterExercises(exercises, { conceptKeys: [key], excludeIds: [...seen] });
    const candidate = pickRandomExercise(candidates, history, randomOptions);
    if (candidate) {
      picked.push(candidate);
      seen.add(candidate.id);
    }
  }

  return picked;
}

/** Targets the learner's weakest concepts (accuracy < 80%) first. */
export class WeaknessPracticeStrategy implements SelectionStrategy {
  readonly name = "weakness";

  select({
    concepts,
    exercises,
    excludeIds,
    history,
    count,
    randomOptions,
  }: SelectionContext): FilterableExercise[] {
    const conceptKeys = detectWeaknesses(concepts).map((c) => c.conceptKey);
    return pickOnePerConcept(exercises, conceptKeys, excludeIds, history, count, randomOptions);
  }
}

/** Periodically resurfaces concepts at "review" or "maintenance" accuracy so they don't decay. */
export class ReviewStrategy implements SelectionStrategy {
  readonly name = "review";

  select({
    concepts,
    exercises,
    excludeIds,
    history,
    count,
    randomOptions,
  }: SelectionContext): FilterableExercise[] {
    const conceptKeys = concepts
      .filter((c) => c.priority === "review" || c.priority === "maintenance")
      .sort((a, b) => (a.lastPracticedAt?.getTime() ?? 0) - (b.lastPracticedAt?.getTime() ?? 0))
      .map((c) => c.conceptKey);
    return pickOnePerConcept(exercises, conceptKeys, excludeIds, history, count, randomOptions);
  }
}

/** Introduces concepts the learner hasn't attempted yet. */
export class NewConceptStrategy implements SelectionStrategy {
  readonly name = "new-concept";

  select({
    concepts,
    exercises,
    excludeIds,
    history,
    count,
    randomOptions,
  }: SelectionContext): FilterableExercise[] {
    const conceptKeys = concepts.filter((c) => c.priority === "new").map((c) => c.conceptKey);
    return pickOnePerConcept(exercises, conceptKeys, excludeIds, history, count, randomOptions);
  }
}

/**
 * No concept targeting — weighted-random pick from whatever hasn't been
 * excluded, favoring exercises the learner hasn't mastered yet. This is
 * what makes "Practice" and the "normal practice" daily slice feel varied
 * instead of replaying the exercise bank in a fixed order.
 */
export class BalancedPracticeStrategy implements SelectionStrategy {
  readonly name = "balanced";

  select({
    exercises,
    excludeIds,
    history,
    count,
    randomOptions,
  }: SelectionContext): FilterableExercise[] {
    const pool = filterExercises(exercises, { excludeIds: [...excludeIds] });
    return pickManyRandomExercises(pool, history, count, randomOptions);
  }
}
