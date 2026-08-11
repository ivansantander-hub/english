import { z } from "zod";

import { ErrorTypeSchema } from "./error-taxonomy.js";

export const SentenceErrorSchema = z.object({
  type: ErrorTypeSchema,
  category: z.string().min(1).max(100),
  explanation: z.string().min(1).max(1000),
  correctedText: z.string().max(1000).optional(),
});

export type SentenceError = z.infer<typeof SentenceErrorSchema>;

export const SentenceResultSchema = z.object({
  sentenceIndex: z.number().int().min(0),
  text: z.string().min(1),
  correct: z.boolean(),
  score: z.number().min(0).max(1),
  errors: z.array(SentenceErrorSchema),
});

export type SentenceResult = z.infer<typeof SentenceResultSchema>;

/**
 * Structured shape the AI evaluator must return. This is validated against
 * raw LLM output before it is ever trusted — see AIResponseValidationError.
 */
export const EvaluationResultSchema = z.object({
  overallScore: z.number().min(0).max(1),
  sentences: z.array(SentenceResultSchema).min(1),
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;
