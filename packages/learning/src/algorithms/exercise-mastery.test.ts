import { describe, expect, it } from "vitest";

import {
  classifyExercise,
  pickManyRandomExercises,
  pickRandomExercise,
  type ExerciseHistory,
} from "./exercise-mastery.js";

function history(
  entries: Record<string, { attempts: number; everFullyCorrect: boolean }>,
): ExerciseHistory {
  return new Map(Object.entries(entries));
}

describe("classifyExercise", () => {
  it("classifies an unattempted exercise as new", () => {
    expect(classifyExercise("ex-1", history({}))).toBe("new");
  });

  it("classifies an attempted-but-never-correct exercise as struggling", () => {
    const h = history({ "ex-1": { attempts: 3, everFullyCorrect: false } });
    expect(classifyExercise("ex-1", h)).toBe("struggling");
  });

  it("classifies an exercise the learner has gotten fully right as mastered", () => {
    const h = history({ "ex-1": { attempts: 2, everFullyCorrect: true } });
    expect(classifyExercise("ex-1", h)).toBe("mastered");
  });
});

describe("pickRandomExercise", () => {
  const exercises = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("returns undefined for an empty pool", () => {
    expect(pickRandomExercise([], history({}))).toBeUndefined();
  });

  it("picks deterministically when random() is stubbed to 0", () => {
    const result = pickRandomExercise(exercises, history({}), { random: () => 0 });
    expect(result?.id).toBe("a");
  });

  it("heavily favors new/struggling over mastered exercises", () => {
    const h = history({
      a: { attempts: 1, everFullyCorrect: true },
      b: { attempts: 1, everFullyCorrect: true },
    });
    // "c" is the only new exercise; even a near-max roll should still land
    // outside the tiny mastered-tier weight and pick from the "new" tier.
    const result = pickRandomExercise(exercises, h, { random: () => 0.9 });
    expect(result?.id).toBe("c");
  });

  it("only picks from mastered tier when nothing else is available", () => {
    const h = history({
      a: { attempts: 1, everFullyCorrect: true },
      b: { attempts: 1, everFullyCorrect: true },
      c: { attempts: 1, everFullyCorrect: true },
    });
    const result = pickRandomExercise(exercises, h, { random: () => 0.5 });
    expect(["a", "b", "c"]).toContain(result?.id);
  });

  it("respects custom tier weights", () => {
    const h = history({ a: { attempts: 1, everFullyCorrect: false } });
    const result = pickRandomExercise([{ id: "a" }, { id: "b" }], h, {
      random: () => 0.01,
      tierWeights: { new: 0, struggling: 1, mastered: 0 },
    });
    expect(result?.id).toBe("a");
  });
});

describe("pickManyRandomExercises", () => {
  it("returns distinct exercises without replacement", () => {
    const exercises = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
    const result = pickManyRandomExercises(exercises, history({}), 3, { random: () => 0 });
    const ids = result.map((e) => e.id);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
  });

  it("stops early when the pool is exhausted", () => {
    const exercises = [{ id: "a" }, { id: "b" }];
    const result = pickManyRandomExercises(exercises, history({}), 5, { random: () => 0 });
    expect(result).toHaveLength(2);
  });

  it("returns an empty array for an empty pool", () => {
    expect(pickManyRandomExercises([], history({}), 3)).toEqual([]);
  });
});
