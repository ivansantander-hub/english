import { ProfileAnalysisResultSchema } from "@english-a1/shared";
import type { ProfileAnalysisResult } from "@english-a1/shared";

/** Models sometimes wrap JSON in ```json fences despite instructions — strip them before parsing. */
function stripCodeFences(text: string): string {
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(text.trim());
  return fenced?.[1] ?? text;
}

export type AnalysisParseResult =
  { success: true; data: ProfileAnalysisResult } | { success: false; reason: string };

export function parsePracticeAnalysisResponse(rawText: string): AnalysisParseResult {
  let json: unknown;
  try {
    json = JSON.parse(stripCodeFences(rawText));
  } catch {
    return { success: false, reason: "Response is not valid JSON" };
  }

  const parsed = ProfileAnalysisResultSchema.safeParse(json);
  if (!parsed.success) {
    return { success: false, reason: parsed.error.message };
  }
  return { success: true, data: parsed.data };
}
