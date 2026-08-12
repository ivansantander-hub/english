import { describe, expect, it } from "vitest";

import { computeActivityStreak } from "./streak.js";

describe("computeActivityStreak", () => {
  it("is 0 with no activity at all", () => {
    expect(computeActivityStreak([], "2026-08-11")).toEqual({
      currentStreak: 0,
      practicedToday: false,
    });
  });

  it("counts today alone as a streak of 1", () => {
    expect(computeActivityStreak(["2026-08-11"], "2026-08-11")).toEqual({
      currentStreak: 1,
      practicedToday: true,
    });
  });

  it("counts consecutive days ending today", () => {
    const dates = ["2026-08-09", "2026-08-10", "2026-08-11"];
    expect(computeActivityStreak(dates, "2026-08-11")).toEqual({
      currentStreak: 3,
      practicedToday: true,
    });
  });

  it("stops at the first gap looking backward from today", () => {
    const dates = ["2026-08-06", "2026-08-10", "2026-08-11"];
    expect(computeActivityStreak(dates, "2026-08-11")).toEqual({
      currentStreak: 2,
      practicedToday: true,
    });
  });

  it("keeps yesterday's streak alive if today hasn't happened yet", () => {
    const dates = ["2026-08-09", "2026-08-10"];
    expect(computeActivityStreak(dates, "2026-08-11")).toEqual({
      currentStreak: 2,
      practicedToday: false,
    });
  });

  it("resets to 0 once a full day is missed", () => {
    const dates = ["2026-08-08", "2026-08-09"];
    expect(computeActivityStreak(dates, "2026-08-11")).toEqual({
      currentStreak: 0,
      practicedToday: false,
    });
  });

  it("ignores future dates and dates far in the past", () => {
    const dates = ["2026-08-11", "2026-08-12", "2020-01-01"];
    expect(computeActivityStreak(dates, "2026-08-11")).toEqual({
      currentStreak: 1,
      practicedToday: true,
    });
  });
});
