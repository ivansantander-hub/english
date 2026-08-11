import type { FilterableExercise } from "@english-a1/exercise";
import { filterExercises } from "@english-a1/exercise";
import type { ExerciseType } from "@english-a1/shared";
import type { ConceptProgress } from "@english-a1/shared";

import type { ExerciseHistory } from "./exercise-mastery.js";
import {
  BalancedPracticeStrategy,
  NewConceptStrategy,
  WeaknessPracticeStrategy,
} from "./selection-strategy.js";
import type { SelectionStrategy } from "./selection-strategy.js";

export type DailyPracticeSliceLabel =
  "review_weak" | "normal_practice" | "new_concepts" | "writing";

interface DailyPracticeSlice {
  label: DailyPracticeSliceLabel;
  strategy: SelectionStrategy;
  count: number;
  exerciseType?: ExerciseType;
}

/**
 * The 15-exercise daily session split from the product spec: 5 review weak
 * concepts, 5 normal practice, 3 new concepts, 2 writing exercises.
 */
function dailyPracticeSlices(): DailyPracticeSlice[] {
  return [
    { label: "review_weak", strategy: new WeaknessPracticeStrategy(), count: 5 },
    { label: "normal_practice", strategy: new BalancedPracticeStrategy(), count: 5 },
    { label: "new_concepts", strategy: new NewConceptStrategy(), count: 3 },
    {
      label: "writing",
      strategy: new BalancedPracticeStrategy(),
      count: 2,
      exerciseType: "paragraph_translation",
    },
  ];
}

export interface DailyPracticeItem {
  exercise: FilterableExercise;
  slice: DailyPracticeSlice["label"];
}

/**
 * Builds one daily practice session. Slices run in order and each one's
 * picks are excluded from the next, so the same exercise never appears
 * twice in a single session.
 */
export function buildDailyPractice(
  concepts: readonly ConceptProgress[],
  exercises: readonly FilterableExercise[],
  alreadyExcludedIds: readonly string[] = [],
  history: ExerciseHistory = new Map(),
): DailyPracticeItem[] {
  const items: DailyPracticeItem[] = [];
  const excludeIds = new Set(alreadyExcludedIds);

  for (const slice of dailyPracticeSlices()) {
    const pool = slice.exerciseType
      ? filterExercises(exercises, { type: slice.exerciseType })
      : exercises;

    const picked = slice.strategy.select({
      concepts,
      exercises: pool,
      excludeIds: [...excludeIds],
      history,
      count: slice.count,
    });

    for (const exercise of picked) {
      items.push({ exercise, slice: slice.label });
      excludeIds.add(exercise.id);
    }
  }

  return items;
}
