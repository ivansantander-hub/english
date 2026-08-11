import type { FilterableExercise } from "@english-a1/exercise";
import type { ConceptProgress } from "@english-a1/shared";
import { describe, expect, it } from "vitest";

import { buildDailyPractice } from "./daily-practice.js";

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

function exercise(
  id: string,
  conceptKeys: string[],
  type: FilterableExercise["type"] = "translation_es_en",
): FilterableExercise {
  return { id, type, level: "A1", difficulty: 1, grammarTopic: "present_simple", conceptKeys };
}

describe("buildDailyPractice", () => {
  it("never repeats an exercise across slices", () => {
    const concepts = [
      concept({ conceptKey: "arrive_at", priority: "high", accuracy: 0.3 }),
      concept({ conceptKey: "go_to", priority: "new", accuracy: 0 }),
    ];
    // Only one exercise exists for "arrive_at" and it also happens to be
    // the only general-pool candidate — it must not be picked twice.
    const exercises = [
      exercise("shared-1", ["arrive_at"]),
      exercise("new-1", ["go_to"]),
      exercise("writing-1", [], "paragraph_translation"),
    ];

    const items = buildDailyPractice(concepts, exercises);
    const ids = items.map((item) => item.exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only picks paragraph_translation exercises for the writing slice", () => {
    const exercises = [
      exercise("sentence-1", []),
      exercise("paragraph-1", [], "paragraph_translation"),
    ];
    const items = buildDailyPractice([], exercises);
    const writingItems = items.filter((item) => item.slice === "writing");

    expect(writingItems.every((item) => item.exercise.type === "paragraph_translation")).toBe(true);
  });

  it("respects ids already excluded by the caller", () => {
    const exercises = [exercise("ex-1", [])];
    const items = buildDailyPractice([], exercises, ["ex-1"]);

    expect(items.some((item) => item.exercise.id === "ex-1")).toBe(false);
  });

  it("returns an empty list when no exercises are available", () => {
    expect(buildDailyPractice([], [])).toEqual([]);
  });
});
