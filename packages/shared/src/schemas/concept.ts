import { z } from "zod";

/**
 * Deterministic priority bucket derived from a concept's accuracy.
 * See packages/learning for the thresholds that produce this value.
 */
export const CONCEPT_PRIORITIES = ["high", "medium", "review", "maintenance", "new"] as const;
export const ConceptPrioritySchema = z.enum(CONCEPT_PRIORITIES);
export type ConceptPriority = z.infer<typeof ConceptPrioritySchema>;

export const ConceptProgressSchema = z.object({
  conceptId: z.string().min(1),
  conceptKey: z.string().min(1),
  conceptName: z.string().min(1),
  grammarTopic: z.string().min(1),
  attempts: z.number().int().min(0),
  correct: z.number().int().min(0),
  accuracy: z.number().min(0).max(1),
  priority: ConceptPrioritySchema,
  lastPracticedAt: z.date().nullable(),
});
export type ConceptProgress = z.infer<typeof ConceptProgressSchema>;
