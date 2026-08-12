import { groupByTopic } from "./mastery.js";
import type { ConceptProgressItem } from "./trpc-types.js";

/**
 * Leaf concept keys in curriculum order, matching CONCEPT_SEEDS in
 * packages/exercise/src/data/concepts.ts (the source of truth for how
 * this A1 course is meant to be taught). A key missing here just falls
 * back to alphabetical and lands at the end of its topic — it never
 * disappears from the map.
 */
export const CONCEPT_ORDER: string[] = [
  "present_simple_affirmative",
  "present_simple_negative",
  "present_simple_questions",
  "third_person_singular",
  "arrive_at",
  "go_to",
  "listen_to",
  "work_at",
  "work_from",
  "possessive_my",
  "possessive_your",
  "possessive_his",
  "possessive_her",
  "possessive_our",
  "possessive_their",
];

export interface PracticePathSection {
  topic: string;
  items: ConceptProgressItem[];
}

/** Groups concepts by topic (via mastery.ts's groupByTopic) and orders each topic's items pedagogically instead of alphabetically. */
export function buildPracticePath(concepts: ConceptProgressItem[]): PracticePathSection[] {
  return groupByTopic(concepts).map(({ topic, items }) => ({
    topic,
    items: [...items].sort((a, b) => {
      const rankA = CONCEPT_ORDER.indexOf(a.conceptKey);
      const rankB = CONCEPT_ORDER.indexOf(b.conceptKey);
      if (rankA === -1 && rankB === -1) return a.conceptName.localeCompare(b.conceptName);
      if (rankA === -1) return 1;
      if (rankB === -1) return -1;
      return rankA - rankB;
    }),
  }));
}

/** First not-yet-mastered concept in path order, or null once everything is mastered. */
export function findContinueConcept(
  sections: PracticePathSection[],
): ConceptProgressItem | null {
  for (const section of sections) {
    const next = section.items.find((item) => item.priority !== "maintenance");
    if (next) return next;
  }
  return null;
}
