import type { ConceptProgress } from "@english-a1/shared";

/**
 * Concepts worth prioritizing in practice: anything not yet at "review" or
 * "maintenance" accuracy. Untouched ("new") concepts are excluded here —
 * that's NewConceptStrategy's job, not remediation.
 */
export function detectWeaknesses(concepts: readonly ConceptProgress[]): ConceptProgress[] {
  return concepts
    .filter((concept) => concept.priority === "high" || concept.priority === "medium")
    .sort((a, b) => a.accuracy - b.accuracy);
}
