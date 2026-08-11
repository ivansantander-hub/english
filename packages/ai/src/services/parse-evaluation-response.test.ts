import { describe, expect, it } from "vitest";

import { parseEvaluationResponse } from "./parse-evaluation-response.js";

const VALID = JSON.stringify({
  overallScore: 1,
  sentences: [{ sentenceIndex: 0, text: "He works.", correct: true, score: 1, errors: [] }],
});

describe("parseEvaluationResponse", () => {
  it("parses a valid raw JSON response", () => {
    const result = parseEvaluationResponse(VALID);
    expect(result.success).toBe(true);
  });

  it("strips markdown code fences before parsing", () => {
    const result = parseEvaluationResponse("```json\n" + VALID + "\n```");
    expect(result.success).toBe(true);
  });

  it("fails gracefully on non-JSON text", () => {
    const result = parseEvaluationResponse("Sorry, I can't help with that.");
    expect(result.success).toBe(false);
  });

  it("fails gracefully when required fields are missing", () => {
    const result = parseEvaluationResponse(JSON.stringify({ overallScore: 1 }));
    expect(result.success).toBe(false);
  });

  it("fails gracefully on an unexpected error category enum value", () => {
    const result = parseEvaluationResponse(
      JSON.stringify({
        overallScore: 0,
        sentences: [
          {
            sentenceIndex: 0,
            text: "x",
            correct: false,
            score: 0,
            errors: [{ type: "not_a_real_type", category: "x", explanation: "x" }],
          },
        ],
      }),
    );
    expect(result.success).toBe(false);
  });
});
