import { describe, expect, it } from "vitest";

import { computeAccuracy, computePriority } from "./concept-accuracy.js";

describe("computeAccuracy", () => {
  it("returns 0 when there are no attempts", () => {
    expect(computeAccuracy(0, 0)).toBe(0);
  });

  it("computes the correct ratio", () => {
    expect(computeAccuracy(10, 6)).toBeCloseTo(0.6);
  });

  it("handles a perfect record", () => {
    expect(computeAccuracy(5, 5)).toBe(1);
  });
});

describe("computePriority", () => {
  it("classifies an untouched concept as new", () => {
    expect(computePriority(0, 0)).toBe("new");
  });

  it("classifies below 60% as high priority", () => {
    expect(computePriority(10, 0.59)).toBe("high");
  });

  it("classifies 60-80% as medium priority", () => {
    expect(computePriority(10, 0.6)).toBe("medium");
    expect(computePriority(10, 0.79)).toBe("medium");
  });

  it("classifies 80-90% as review", () => {
    expect(computePriority(10, 0.8)).toBe("review");
    expect(computePriority(10, 0.89)).toBe("review");
  });

  it("classifies 90%+ as maintenance", () => {
    expect(computePriority(10, 0.9)).toBe("maintenance");
    expect(computePriority(10, 1)).toBe("maintenance");
  });
});
