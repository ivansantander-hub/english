import { EvaluationResultSchema } from "@english-a1/shared";
import type { EvaluationResult } from "@english-a1/shared";

/** Models sometimes wrap JSON in ```json fences despite instructions — strip them before parsing. */
function stripCodeFences(text: string): string {
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(text.trim());
  return fenced?.[1] ?? text;
}

export type ParseResult =
  { success: true; data: EvaluationResult } | { success: false; reason: string };

export function parseEvaluationResponse(rawText: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(stripCodeFences(rawText));
  } catch {
    return { success: false, reason: "Response is not valid JSON" };
  }

  const parsed = EvaluationResultSchema.safeParse(json);
  if (!parsed.success) {
    return { success: false, reason: parsed.error.message };
  }
  return { success: true, data: parsed.data };
}
