import type { ConceptProgress } from "@english-a1/shared";
import { describe, expect, it } from "vitest";

import { detectWeaknesses } from "./weakness.js";

function concept(overrides: Partial<ConceptProgress>): ConceptProgress {
  return {
    conceptId: "id",
    conceptKey: "key",
    conceptName: "Name",
    grammarTopic: "present_simple",
    attempts: 10,
    correct: 5,
    accuracy: 0.5,
    priority: "medium",
    lastPracticedAt: null,
    ...overrides,
  };
}

describe("detectWeaknesses", () => {
  it("excludes new, review, and maintenance concepts", () => {
    const concepts = [
      concept({ conceptKey: "a", priority: "new" }),
      concept({ conceptKey: "b", priority: "review" }),
      concept({ conceptKey: "c", priority: "maintenance" }),
    ];
    expect(detectWeaknesses(concepts)).toEqual([]);
  });

  it("includes high and medium priority concepts", () => {
    const concepts = [
      concept({ conceptKey: "a", priority: "high", accuracy: 0.3 }),
      concept({ conceptKey: "b", priority: "medium", accuracy: 0.7 }),
    ];
    expect(detectWeaknesses(concepts).map((c) => c.conceptKey)).toEqual(["a", "b"]);
  });

  it("sorts weakest (lowest accuracy) first", () => {
    const concepts = [
      concept({ conceptKey: "a", priority: "medium", accuracy: 0.75 }),
      concept({ conceptKey: "b", priority: "high", accuracy: 0.2 }),
      concept({ conceptKey: "c", priority: "medium", accuracy: 0.65 }),
    ];
    expect(detectWeaknesses(concepts).map((c) => c.conceptKey)).toEqual(["b", "c", "a"]);
  });
});
