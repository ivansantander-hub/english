import { z } from "zod";

export const ProfileAnalysisFocusAreaSchema = z.object({
  concept: z.string().min(1).max(120),
  /** Which lookup space topicKey belongs to — controls how a recommended video is found for this focus area. */
  topicType: z.enum(["concept", "error_type"]),
  /** Must be copied exactly from the provided concept keys or error types — never invented or rephrased. */
  topicKey: z.string().min(1).max(80),
  why: z.string().min(1).max(500),
  whyEs: z.string().min(1).max(500),
  howTo: z.string().min(1).max(500),
  howToEs: z.string().min(1).max(500),
});

export type ProfileAnalysisFocusArea = z.infer<typeof ProfileAnalysisFocusAreaSchema>;

/**
 * Structured shape the AI practice-analysis call must return, validated
 * before it's ever trusted — same discipline as EvaluationResultSchema.
 */
export const ProfileAnalysisResultSchema = z.object({
  summary: z.string().min(1).max(600),
  summaryEs: z.string().min(1).max(600),
  strengths: z.array(z.string().min(1).max(300)).min(1).max(3),
  strengthsEs: z.array(z.string().min(1).max(300)).min(1).max(3),
  focusAreas: z.array(ProfileAnalysisFocusAreaSchema).min(1).max(4),
});

export type ProfileAnalysisResult = z.infer<typeof ProfileAnalysisResultSchema>;
