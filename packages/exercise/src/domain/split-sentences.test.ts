import { describe, expect, it } from "vitest";

import { splitIntoSentences } from "./split-sentences.js";

describe("splitIntoSentences", () => {
  it("splits on sentence-ending punctuation", () => {
    expect(splitIntoSentences("I work. She works. Do you work?")).toEqual([
      "I work.",
      "She works.",
      "Do you work?",
    ]);
  });

  it("trims surrounding whitespace and drops empty segments", () => {
    expect(splitIntoSentences("  I work.   She works.  ")).toEqual(["I work.", "She works."]);
  });

  it("returns a single sentence unchanged", () => {
    expect(splitIntoSentences("He works in an office.")).toEqual(["He works in an office."]);
  });

  it("returns an empty array for empty input", () => {
    expect(splitIntoSentences("")).toEqual([]);
  });
});
