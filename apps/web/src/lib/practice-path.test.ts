import { describe, expect, it } from "vitest";

import { buildPracticePath, findContinueConcept } from "./practice-path.js";
import type { ConceptProgressItem } from "./trpc-types.js";

function concept(
  conceptKey: string,
  grammarTopic: string,
  priority: ConceptProgressItem["priority"] = "new",
): ConceptProgressItem {
  return {
    conceptId: conceptKey,
    conceptKey,
    conceptName: conceptKey,
    grammarTopic,
    attempts: priority === "new" ? 0 : 5,
    correct: priority === "maintenance" ? 5 : 1,
    accuracy: priority === "maintenance" ? 1 : 0.2,
    priority,
    lastPracticedAt: null,
  };
}

describe("buildPracticePath", () => {
  it("orders each topic's concepts pedagogically instead of alphabetically", () => {
    // Deliberately alphabetical/scrambled input, matching what the API actually returns.
    const input = [
      concept("third_person_singular", "present_simple"),
      concept("present_simple_affirmative", "present_simple"),
      concept("present_simple_questions", "present_simple"),
      concept("present_simple_negative", "present_simple"),
      concept("work_at", "prepositions"),
      concept("arrive_at", "prepositions"),
    ];

    const sections = buildPracticePath(input);
    const presentSimple = sections.find((s) => s.topic === "present_simple");
    const prepositions = sections.find((s) => s.topic === "prepositions");

    expect(presentSimple?.items.map((c) => c.conceptKey)).toEqual([
      "present_simple_affirmative",
      "present_simple_negative",
      "present_simple_questions",
      "third_person_singular",
    ]);
    expect(prepositions?.items.map((c) => c.conceptKey)).toEqual(["arrive_at", "work_at"]);
  });

  it("keeps an unknown concept key instead of dropping it, appended alphabetically", () => {
    const input = [
      concept("present_simple_affirmative", "present_simple"),
      concept("some_future_concept", "present_simple"),
      concept("present_simple_negative", "present_simple"),
    ];

    const sections = buildPracticePath(input);
    const keys = sections.find((s) => s.topic === "present_simple")?.items.map((c) => c.conceptKey);

    expect(keys).toContain("some_future_concept");
    expect(keys?.at(-1)).toBe("some_future_concept");
  });
});

describe("findContinueConcept", () => {
  it("returns the first non-mastered concept in path order", () => {
    const sections = buildPracticePath([
      concept("present_simple_affirmative", "present_simple", "maintenance"),
      concept("present_simple_negative", "present_simple", "high"),
      concept("third_person_singular", "present_simple", "new"),
      concept("arrive_at", "prepositions", "new"),
    ]);

    expect(findContinueConcept(sections)?.conceptKey).toBe("present_simple_negative");
  });

  it("returns null once every concept is mastered", () => {
    const sections = buildPracticePath([
      concept("present_simple_affirmative", "present_simple", "maintenance"),
      concept("arrive_at", "prepositions", "maintenance"),
    ]);

    expect(findContinueConcept(sections)).toBeNull();
  });
});
