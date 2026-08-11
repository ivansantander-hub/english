import { z } from "zod";

/**
 * Controlled vocabulary of mistake types the evaluator (AI or rule-based) can
 * report. Keep this list append-only in practice — removing/renaming a value
 * invalidates historical Error rows that reference it.
 */
export const ERROR_TYPES = [
  "grammar",
  "third_person_singular",
  "verb_tense",
  "word_order",
  "preposition",
  "article",
  "pronoun",
  "possessive",
  "vocabulary",
  "expression",
  "meaning",
  "spelling",
  "naturalness",
] as const;

export const ErrorTypeSchema = z.enum(ERROR_TYPES);

export type ErrorType = z.infer<typeof ErrorTypeSchema>;

/**
 * "naturalness" errors are stylistic suggestions, not correctness failures —
 * they must never reduce a sentence's score.
 */
export const NON_SCORING_ERROR_TYPES: ReadonlySet<ErrorType> = new Set(["naturalness"]);
