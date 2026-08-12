import { describe, expect, it } from "vitest";

import { EvaluationResultSchema } from "./evaluation.js";

describe("EvaluationResultSchema", () => {
  it("accepts a well-formed evaluation result", () => {
    const result = EvaluationResultSchema.safeParse({
      overallScore: 0.75,
      sentences: [
        { sentenceIndex: 0, text: "He works in an office.", correct: true, score: 1, errors: [] },
        {
          sentenceIndex: 1,
          text: "He work in an office.",
          correct: false,
          score: 0,
          errors: [
            {
              type: "third_person_singular",
              category: "third_person_singular",
              explanation: "With he/she/it, the verb takes -s.",
              explanationEs: "Con he/she/it, el verbo lleva -s.",
              correctedText: "He works in an office.",
            },
          ],
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects an unknown error type", () => {
    const result = EvaluationResultSchema.safeParse({
      overallScore: 0,
      sentences: [
        {
          sentenceIndex: 0,
          text: "x",
          correct: false,
          score: 0,
          errors: [{ type: "made_up_type", category: "x", explanation: "x" }],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects an out-of-range score", () => {
    const result = EvaluationResultSchema.safeParse({
      overallScore: 1.5,
      sentences: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a missing sentences field", () => {
    const result = EvaluationResultSchema.safeParse({ overallScore: 0.5 });

    expect(result.success).toBe(false);
  });
});
