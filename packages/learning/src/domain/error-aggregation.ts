import type { ErrorType } from "@english-a1/shared";

export interface ErrorEvent {
  type: ErrorType;
  category: string;
}

export interface ErrorAggregate {
  type: ErrorType;
  category: string;
  count: number;
}

/**
 * Groups raw Error rows by (type, category) and counts occurrences,
 * most frequent first. Used for the developer-facing error breakdown —
 * the learner-facing "recurring mistakes" ranking uses concept accuracy
 * instead (see detectWeaknesses), since error categories are free-form
 * strings from the AI evaluator and don't carry a reliable attempt count.
 */
export function aggregateErrors(errors: readonly ErrorEvent[]): ErrorAggregate[] {
  const counts = new Map<string, ErrorAggregate>();

  for (const error of errors) {
    const key = `${error.type}::${error.category}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { type: error.type, category: error.category, count: 1 });
    }
  }

  return [...counts.values()].sort((a, b) => b.count - a.count);
}
