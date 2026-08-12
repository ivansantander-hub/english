/**
 * XP and levels are flavor, not a claim about real English proficiency —
 * that's what the accuracy/mastery numbers elsewhere on the page are for.
 * XP is derived straight from real activity (correct answers, concepts
 * mastered) so it can't drift from what actually happened.
 */
export function computeXp(totalCorrect: number, conceptsMastered: number): number {
  return totalCorrect * 10 + conceptsMastered * 25;
}

const LEVEL_TITLES = [
  "New Arrival",
  "Traveler",
  "Regular",
  "Local",
  "Old Hand",
  "Insider",
  "Wanderer",
  "Veteran",
  "Fluent Friend",
  "Native-level",
];

/** XP required to climb out of `level` into the next one. */
function costForLevel(level: number): number {
  return 50 + (level - 1) * 25;
}

export interface LevelInfo {
  level: number;
  title: string;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progress: number;
}

export function computeLevel(xp: number): LevelInfo {
  let level = 1;
  let remaining = xp;
  let cost = costForLevel(level);

  while (remaining >= cost) {
    remaining -= cost;
    level += 1;
    cost = costForLevel(level);
  }

  return {
    level,
    title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] ?? "Native-level",
    xp,
    xpIntoLevel: remaining,
    xpForNextLevel: cost,
    progress: remaining / cost,
  };
}
