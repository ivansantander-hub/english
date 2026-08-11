import { describe, expect, it } from "vitest";

import { aggregateErrors } from "./error-aggregation.js";

describe("aggregateErrors", () => {
  it("counts occurrences grouped by type and category", () => {
    const result = aggregateErrors([
      { type: "preposition", category: "arrive_at" },
      { type: "preposition", category: "arrive_at" },
      { type: "third_person_singular", category: "third_person_singular" },
    ]);

    expect(result).toEqual([
      { type: "preposition", category: "arrive_at", count: 2 },
      { type: "third_person_singular", category: "third_person_singular", count: 1 },
    ]);
  });

  it("sorts most frequent first", () => {
    const result = aggregateErrors([
      { type: "article", category: "a_an" },
      { type: "preposition", category: "go_to" },
      { type: "preposition", category: "go_to" },
      { type: "preposition", category: "go_to" },
    ]);

    expect(result[0]).toEqual({ type: "preposition", category: "go_to", count: 3 });
  });

  it("returns an empty array for no errors", () => {
    expect(aggregateErrors([])).toEqual([]);
  });

  it("keeps distinct categories of the same error type separate", () => {
    const result = aggregateErrors([
      { type: "preposition", category: "arrive_at" },
      { type: "preposition", category: "go_to" },
    ]);
    expect(result).toHaveLength(2);
  });
});
