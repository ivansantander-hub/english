import { describe, expect, it } from "vitest";

import { filterExercises, type FilterableExercise } from "./filter-exercises.js";

const exercises: FilterableExercise[] = [
  {
    id: "1",
    type: "translation_es_en",
    level: "A1",
    difficulty: 1,
    grammarTopic: "present_simple",
    conceptKeys: ["third_person_singular"],
  },
  {
    id: "2",
    type: "translation_es_en",
    level: "A1",
    difficulty: 3,
    grammarTopic: "prepositions",
    conceptKeys: ["arrive_at"],
  },
  {
    id: "3",
    type: "paragraph_translation",
    level: "A2",
    difficulty: 2,
    grammarTopic: "present_simple",
    conceptKeys: ["present_simple_negative"],
  },
  {
    id: "4",
    type: "fill_blank",
    level: "A1",
    difficulty: 2,
    grammarTopic: "possessives",
    conceptKeys: ["possessive_my", "possessive_your"],
  },
];

describe("filterExercises", () => {
  it("filters by level", () => {
    expect(filterExercises(exercises, { level: "A2" }).map((e) => e.id)).toEqual(["3"]);
  });

  it("filters by difficulty range", () => {
    expect(
      filterExercises(exercises, { minDifficulty: 2, maxDifficulty: 2 }).map((e) => e.id),
    ).toEqual(["3", "4"]);
  });

  it("filters by concept membership (any match)", () => {
    expect(
      filterExercises(exercises, { conceptKeys: ["possessive_your", "arrive_at"] }).map(
        (e) => e.id,
      ),
    ).toEqual(["2", "4"]);
  });

  it("excludes explicitly excluded ids", () => {
    expect(filterExercises(exercises, { excludeIds: ["1", "2", "3"] }).map((e) => e.id)).toEqual([
      "4",
    ]);
  });

  it("combines multiple criteria with AND semantics", () => {
    expect(
      filterExercises(exercises, { level: "A1", grammarTopic: "present_simple" }).map((e) => e.id),
    ).toEqual(["1"]);
  });
});
