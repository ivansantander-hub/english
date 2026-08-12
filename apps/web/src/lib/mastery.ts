import { answersNeededForTarget } from "@english-a1/learning";

import type { ConceptProgressItem } from "./trpc-types.js";

export type Priority = ConceptProgressItem["priority"];

export const STATUS: Record<Priority, { label: string; text: string; bar: string; dot: string }> = {
  new: { label: "Not started", text: "text-ink/50", bar: "bg-ink/15", dot: "bg-ink/15" },
  high: {
    label: "Needs practice",
    text: "text-coral",
    bar: "bg-coral",
    dot: "bg-coral",
  },
  medium: {
    label: "Needs practice",
    text: "text-coral",
    bar: "bg-coral",
    dot: "bg-coral",
  },
  review: {
    label: "Almost there",
    text: "text-violet",
    bar: "bg-violet",
    dot: "bg-violet",
  },
  maintenance: {
    label: "Mastered",
    text: "text-mint",
    bar: "bg-mint",
    dot: "bg-mint",
  },
};

const TOPIC_LABELS: Record<string, string> = {
  present_simple: "Present Simple",
  prepositions: "Prepositions",
  possessives: "Possessives",
};

const TOPIC_ORDER = ["present_simple", "prepositions", "possessives"];

export function topicLabel(topic: string): string {
  return TOPIC_LABELS[topic] ?? topic.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function groupByTopic<T extends { grammarTopic: string }>(
  items: readonly T[],
): { topic: string; items: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const list = groups.get(item.grammarTopic) ?? [];
    list.push(item);
    groups.set(item.grammarTopic, list);
  }
  const orderedTopics = [
    ...TOPIC_ORDER.filter((topic) => groups.has(topic)),
    ...[...groups.keys()].filter((topic) => !TOPIC_ORDER.includes(topic)).sort(),
  ];
  return orderedTopics.map((topic) => ({ topic, items: groups.get(topic) ?? [] }));
}

export interface NextTarget {
  targetPercent: number;
  unlockLabel: string;
  needed: number;
}

/**
 * The next meaningful accuracy threshold worth showing the learner — the
 * point where their status label would actually change (80% or 90%), not
 * every 1% increment. Returns null once mastered or before any attempts.
 */
export function nextMasteryTarget(concept: {
  attempts: number;
  correct: number;
  accuracy: number;
}): NextTarget | null {
  if (concept.attempts === 0 || concept.accuracy >= 0.9) return null;

  const target = concept.accuracy < 0.8 ? 0.8 : 0.9;
  const unlockLabel = target === 0.8 ? "Almost there" : "Mastered";
  const needed = answersNeededForTarget(concept.attempts, concept.correct, target);

  return { targetPercent: Math.round(target * 100), unlockLabel, needed };
}
