export interface ExerciseHistoryEntry {
  attempts: number;
  /** True if at least one past attempt scored 1.0 (fully correct). */
  everFullyCorrect: boolean;
}

export type ExerciseHistory = ReadonlyMap<string, ExerciseHistoryEntry>;

export type MasteryTier = "new" | "struggling" | "mastered";

/**
 * Classifies a single exercise against the learner's history:
 * - "new": never attempted — highest value for variety and coverage.
 * - "struggling": attempted, never gotten fully right — worth retrying.
 * - "mastered": got it fully right at least once — rarely worth repeating.
 */
export function classifyExercise(exerciseId: string, history: ExerciseHistory): MasteryTier {
  const entry = history.get(exerciseId);
  if (!entry) return "new";
  return entry.everFullyCorrect ? "mastered" : "struggling";
}

export interface WeightedPickOptions {
  tierWeights?: Readonly<Record<MasteryTier, number>>;
  /** Injectable RNG (0-1) so selection is deterministic in tests. */
  random?: () => number;
}

/**
 * Mastered exercises are far less likely to reappear than new/struggling
 * ones — this is what stops the practice loop from re-serving sentences
 * the learner has already nailed.
 */
const DEFAULT_TIER_WEIGHTS: Readonly<Record<MasteryTier, number>> = {
  new: 0.6,
  struggling: 0.35,
  mastered: 0.05,
};

function pickIndex(random: () => number, length: number): number {
  return Math.min(length - 1, Math.floor(random() * length));
}

/**
 * Weighted-random pick across mastery tiers, uniform within the chosen
 * tier. Tiers with no candidates are skipped and their weight redistributed
 * automatically (falling out of the total).
 */
export function pickRandomExercise<T extends { id: string }>(
  exercises: readonly T[],
  history: ExerciseHistory,
  options: WeightedPickOptions = {},
): T | undefined {
  if (exercises.length === 0) return undefined;
  const random = options.random ?? Math.random;
  const weights = options.tierWeights ?? DEFAULT_TIER_WEIGHTS;

  const tiers: Record<MasteryTier, T[]> = { new: [], struggling: [], mastered: [] };
  for (const exercise of exercises) {
    tiers[classifyExercise(exercise.id, history)].push(exercise);
  }

  const availableTiers = (Object.keys(tiers) as MasteryTier[]).filter(
    (tier) => tiers[tier].length > 0,
  );
  const firstTier = availableTiers[0];
  if (!firstTier) return undefined;

  const totalWeight = availableTiers.reduce((sum, tier) => sum + weights[tier], 0);
  let roll = random() * totalWeight;
  let chosenTier: MasteryTier = firstTier;
  for (const tier of availableTiers) {
    roll -= weights[tier];
    if (roll <= 0) {
      chosenTier = tier;
      break;
    }
  }

  const pool = tiers[chosenTier];
  return pool[pickIndex(random, pool.length)];
}

/** Picks up to `count` distinct exercises, without replacement. */
export function pickManyRandomExercises<T extends { id: string }>(
  exercises: readonly T[],
  history: ExerciseHistory,
  count: number,
  options: WeightedPickOptions = {},
): T[] {
  const picked: T[] = [];
  let remaining = exercises;

  for (let i = 0; i < count; i += 1) {
    const next = pickRandomExercise(remaining, history, options);
    if (!next) break;
    picked.push(next);
    remaining = remaining.filter((exercise) => exercise.id !== next.id);
  }

  return picked;
}
