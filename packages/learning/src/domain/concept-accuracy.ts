import type { ConceptPriority } from "@english-a1/shared";

export function computeAccuracy(attempts: number, correct: number): number {
  if (attempts <= 0) return 0;
  return correct / attempts;
}

/**
 * Deterministic priority bucket used to drive adaptive exercise selection.
 * Thresholds are intentionally simple (no ML) and isolated here so the
 * selection algorithm can evolve without touching persistence code.
 */
export function computePriority(attempts: number, accuracy: number): ConceptPriority {
  if (attempts === 0) return "new";
  if (accuracy < 0.6) return "high";
  if (accuracy < 0.8) return "medium";
  if (accuracy < 0.9) return "review";
  return "maintenance";
}
