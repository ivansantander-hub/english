import { describe, expect, it } from "vitest";

import { evaluateWithRules } from "./rule-based-evaluator.js";

describe("evaluateWithRules", () => {
  it("scores an exact match (ignoring case and punctuation) as fully correct", () => {
    const result = evaluateWithRules("he works in an office", "He works in an office.");

    expect(result.overallScore).toBe(1);
    expect(result.sentences[0]?.correct).toBe(true);
    expect(result.sentences[0]?.errors).toEqual([]);
  });

  it("marks a mismatched sentence as incorrect with a generic grammar error", () => {
    const result = evaluateWithRules("He work in an office.", "He works in an office.");

    expect(result.overallScore).toBe(0);
    expect(result.sentences[0]?.correct).toBe(false);
    expect(result.sentences[0]?.errors[0]?.type).toBe("grammar");
    expect(result.sentences[0]?.errors[0]?.correctedText).toBe("He works in an office.");
  });

  it("scores a paragraph sentence-by-sentence", () => {
    const result = evaluateWithRules(
      "I work in an office. I don't work on weekends.",
      "I work in an office. I don't work on weekends.",
    );

    expect(result.sentences).toHaveLength(2);
    expect(result.overallScore).toBe(1);
  });

  it("penalizes a missing sentence when the answer is shorter than expected", () => {
    const result = evaluateWithRules(
      "I work in an office.",
      "I work in an office. I don't work on weekends.",
    );

    expect(result.sentences).toHaveLength(2);
    expect(result.sentences[1]?.correct).toBe(false);
    expect(result.overallScore).toBe(0.5);
  });
});
