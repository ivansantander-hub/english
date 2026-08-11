import type { FilterableExercise } from "@english-a1/exercise";
import type { ConceptProgress } from "@english-a1/shared";
import { describe, expect, it } from "vitest";

import type { ExerciseHistory } from "./exercise-mastery.js";
import {
  BalancedPracticeStrategy,
  NewConceptStrategy,
  ReviewStrategy,
  WeaknessPracticeStrategy,
} from "./selection-strategy.js";

const NO_HISTORY: ExerciseHistory = new Map();
/** Stubbed RNG that always picks the first item within whichever tier is chosen. */
const DETERMINISTIC = { random: () => 0 };

function concept(overrides: Partial<ConceptProgress>): ConceptProgress {
  return {
    conceptId: overrides.conceptKey ?? "id",
    conceptKey: "key",
    conceptName: "Name",
    grammarTopic: "present_simple",
    attempts: 5,
    correct: 3,
    accuracy: 0.6,
    priority: "medium",
    lastPracticedAt: null,
    ...overrides,
  };
}

function exercise(id: string, conceptKeys: string[]): FilterableExercise {
  return {
    id,
    type: "translation_es_en",
    level: "A1",
    difficulty: 1,
    grammarTopic: "present_simple",
    conceptKeys,
  };
}

const exercises: FilterableExercise[] = [
  exercise("ex-prep-1", ["arrive_at"]),
  exercise("ex-prep-2", ["arrive_at"]),
  exercise("ex-poss-1", ["possessive_my"]),
  exercise("ex-new-1", ["present_simple_questions"]),
  exercise("ex-review-1", ["third_person_singular"]),
  exercise("ex-general-1", ["present_simple_affirmative"]),
];

describe("WeaknessPracticeStrategy", () => {
  it("picks exercises only for high/medium priority concepts", () => {
    const concepts = [
      concept({ conceptKey: "arrive_at", priority: "high", accuracy: 0.3 }),
      concept({ conceptKey: "possessive_my", priority: "medium", accuracy: 0.7 }),
      concept({ conceptKey: "third_person_singular", priority: "maintenance", accuracy: 0.95 }),
    ];
    const strategy = new WeaknessPracticeStrategy();
    const result = strategy.select({
      concepts,
      exercises,
      excludeIds: [],
      history: NO_HISTORY,
      count: 5,
      randomOptions: DETERMINISTIC,
    });

    expect(result.map((e) => e.id)).toEqual(["ex-prep-1", "ex-poss-1"]);
  });

  it("respects excludeIds", () => {
    const concepts = [concept({ conceptKey: "arrive_at", priority: "high", accuracy: 0.3 })];
    const strategy = new WeaknessPracticeStrategy();
    const result = strategy.select({
      concepts,
      exercises,
      excludeIds: ["ex-prep-1"],
      history: NO_HISTORY,
      count: 5,
      randomOptions: DETERMINISTIC,
    });

    expect(result.map((e) => e.id)).toEqual(["ex-prep-2"]);
  });

  it("caps results at count", () => {
    const concepts = [
      concept({ conceptKey: "arrive_at", priority: "high", accuracy: 0.3 }),
      concept({ conceptKey: "possessive_my", priority: "medium", accuracy: 0.7 }),
    ];
    const strategy = new WeaknessPracticeStrategy();
    const result = strategy.select({
      concepts,
      exercises,
      excludeIds: [],
      history: NO_HISTORY,
      count: 1,
      randomOptions: DETERMINISTIC,
    });

    expect(result).toHaveLength(1);
  });

  it("avoids an exercise the learner has already mastered when an alternative exists", () => {
    const concepts = [concept({ conceptKey: "arrive_at", priority: "high", accuracy: 0.3 })];
    const history: ExerciseHistory = new Map([
      ["ex-prep-1", { attempts: 2, everFullyCorrect: true }],
    ]);
    const strategy = new WeaknessPracticeStrategy();
    // "ex-prep-1" is first in filter order and would win under old
    // first-match logic even at the lowest possible roll — mastery tiering
    // must route this to the unmastered "ex-prep-2" instead.
    const result = strategy.select({
      concepts,
      exercises,
      excludeIds: [],
      history,
      count: 1,
      randomOptions: { random: () => 0 },
    });

    expect(result.map((e) => e.id)).toEqual(["ex-prep-2"]);
  });
});

describe("NewConceptStrategy", () => {
  it("only targets untouched concepts", () => {
    const concepts = [
      concept({ conceptKey: "present_simple_questions", priority: "new", accuracy: 0 }),
      concept({ conceptKey: "arrive_at", priority: "high", accuracy: 0.3 }),
    ];
    const strategy = new NewConceptStrategy();
    const result = strategy.select({
      concepts,
      exercises,
      excludeIds: [],
      history: NO_HISTORY,
      count: 5,
      randomOptions: DETERMINISTIC,
    });

    expect(result.map((e) => e.id)).toEqual(["ex-new-1"]);
  });
});

describe("ReviewStrategy", () => {
  it("targets review and maintenance concepts, staler ones first", () => {
    const concepts = [
      concept({
        conceptKey: "third_person_singular",
        priority: "review",
        lastPracticedAt: new Date("2026-01-01"),
      }),
      concept({
        conceptKey: "present_simple_affirmative",
        priority: "maintenance",
        lastPracticedAt: new Date("2025-01-01"),
      }),
    ];
    const strategy = new ReviewStrategy();
    const result = strategy.select({
      concepts,
      exercises,
      excludeIds: [],
      history: NO_HISTORY,
      count: 5,
      randomOptions: DETERMINISTIC,
    });

    expect(result.map((e) => e.id)).toEqual(["ex-general-1", "ex-review-1"]);
  });
});

describe("BalancedPracticeStrategy", () => {
  it("ignores concept targeting entirely", () => {
    const strategy = new BalancedPracticeStrategy();
    const result = strategy.select({
      concepts: [],
      exercises,
      excludeIds: [],
      history: NO_HISTORY,
      count: 3,
      randomOptions: DETERMINISTIC,
    });

    expect(result).toHaveLength(3);
  });

  it("respects excludeIds", () => {
    const strategy = new BalancedPracticeStrategy();
    const result = strategy.select({
      concepts: [],
      exercises,
      excludeIds: exercises.slice(0, 5).map((e) => e.id),
      history: NO_HISTORY,
      count: 3,
      randomOptions: DETERMINISTIC,
    });

    expect(result.map((e) => e.id)).toEqual(["ex-general-1"]);
  });

  it("returns different exercises across repeated calls (not always the first candidate)", () => {
    const strategy = new BalancedPracticeStrategy();
    const seen = new Set<string>();
    for (let i = 0; i < 20; i += 1) {
      const [picked] = strategy.select({
        concepts: [],
        exercises,
        excludeIds: [],
        history: NO_HISTORY,
        count: 1,
      });
      if (picked) seen.add(picked.id);
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});
