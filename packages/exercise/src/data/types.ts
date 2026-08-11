import type { CefrLevel, ExerciseType } from "@english-a1/shared";

export interface ExerciseSeed {
  id: string;
  type: ExerciseType;
  level: CefrLevel;
  difficulty: 1 | 2 | 3 | 4 | 5;
  grammarTopic: string;
  /** Source-language prompt for translation exercises. */
  spanishText?: string;
  /** Reference correct answer, used for rule-based fallback grading. */
  expectedAnswer?: string;
  /** English-language prompt for fill_blank / correct_sentence exercises. */
  prompt?: string;
  /** Disambiguates possessive pronouns etc. without leaking the answer into spanishText. */
  contextHint?: string;
  targetConcepts: string[];
}
