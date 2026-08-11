import { describe, expect, it } from "vitest";

import { answersNeededForTarget } from "./mastery-target.js";

describe("answersNeededForTarget", () => {
  it("returns 0 when already at the target accuracy", () => {
    expect(answersNeededForTarget(10, 8, 0.8)).toBe(0);
  });

  it("returns 0 when already above the target accuracy", () => {
    expect(answersNeededForTarget(10, 9, 0.8)).toBe(0);
  });

  it("computes the minimum consecutive-correct count to cross a target", () => {
    // 14/31 = ~45.2%; verified by hand: +12 correct -> 26/43 = 60.47% (>=60%),
    // +11 correct -> 25/42 = 59.5% (still short).
    expect(answersNeededForTarget(31, 14, 0.6)).toBe(12);
  });

  it("treats an unattempted concept as needing exactly one correct answer", () => {
    expect(answersNeededForTarget(0, 0, 0.8)).toBe(1);
  });

  it("requires more answers as the target gets stricter", () => {
    const forEighty = answersNeededForTarget(20, 10, 0.8);
    const forNinety = answersNeededForTarget(20, 10, 0.9);
    expect(forNinety).toBeGreaterThan(forEighty);
  });

  it("returns 0 for a non-positive target", () => {
    expect(answersNeededForTarget(5, 1, 0)).toBe(0);
  });

  it("returns Infinity for a target of 100%", () => {
    expect(answersNeededForTarget(5, 4, 1)).toBe(Number.POSITIVE_INFINITY);
  });
});
