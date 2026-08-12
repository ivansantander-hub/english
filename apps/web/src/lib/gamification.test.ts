import { describe, expect, it } from "vitest";

import { computeLevel, computeXp } from "./gamification.js";

describe("computeXp", () => {
  it("awards 10 xp per correct answer and 25 per mastered concept", () => {
    expect(computeXp(10, 2)).toBe(150);
  });

  it("is 0 with no activity", () => {
    expect(computeXp(0, 0)).toBe(0);
  });
});

describe("computeLevel", () => {
  it("starts at level 1 with 0 xp", () => {
    const info = computeLevel(0);
    expect(info.level).toBe(1);
    expect(info.title).toBe("New Arrival");
    expect(info.xpIntoLevel).toBe(0);
    expect(info.xpForNextLevel).toBe(50);
    expect(info.progress).toBe(0);
  });

  it("stays in level 1 below its threshold", () => {
    const info = computeLevel(49);
    expect(info.level).toBe(1);
    expect(info.xpIntoLevel).toBe(49);
  });

  it("advances to level 2 exactly at the threshold", () => {
    const info = computeLevel(50);
    expect(info.level).toBe(2);
    expect(info.title).toBe("Traveler");
    expect(info.xpIntoLevel).toBe(0);
    expect(info.xpForNextLevel).toBe(75);
  });

  it("climbs multiple levels for a large xp total", () => {
    // level 1->2 costs 50, 2->3 costs 75: 130 xp clears both with 5 left over.
    const info = computeLevel(130);
    expect(info.level).toBe(3);
    expect(info.xpIntoLevel).toBe(5);
  });

  it("caps the title at the last rung of the ladder for very high levels", () => {
    const info = computeLevel(100_000);
    expect(info.title).toBe("Native-level");
  });

  it("progress is always between 0 and 1", () => {
    for (const xp of [0, 1, 49, 50, 51, 500, 100_000]) {
      const info = computeLevel(xp);
      expect(info.progress).toBeGreaterThanOrEqual(0);
      expect(info.progress).toBeLessThan(1);
    }
  });
});
