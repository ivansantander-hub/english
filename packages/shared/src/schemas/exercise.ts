import { z } from "zod";

export const EXERCISE_TYPES = [
  "translation_es_en",
  "translation_en_es",
  "fill_blank",
  "correct_sentence",
  "free_writing",
  "paragraph_translation",
] as const;

export const ExerciseTypeSchema = z.enum(EXERCISE_TYPES);
export type ExerciseType = z.infer<typeof ExerciseTypeSchema>;

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export const CefrLevelSchema = z.enum(CEFR_LEVELS);
export type CefrLevel = z.infer<typeof CefrLevelSchema>;

export const ExerciseSourceSchema = z.enum(["seeded", "ai_generated"]);
export type ExerciseSource = z.infer<typeof ExerciseSourceSchema>;

export const SubmitAnswerInputSchema = z.object({
  exerciseId: z.string().min(1),
  rawAnswer: z.string().min(1).max(5000),
});
export type SubmitAnswerInput = z.infer<typeof SubmitAnswerInputSchema>;
