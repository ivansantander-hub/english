/**
 * Minimum number of additional correct answers — assuming every one of
 * them is correct — needed to raise accuracy from `correct`/`attempts` up
 * to `target`. Returns 0 if already at or above target. This is what
 * powers "N more correct in a row to reach 80%" in the UI: an honest,
 * literal number instead of an opaque percentage.
 */
export function answersNeededForTarget(attempts: number, correct: number, target: number): number {
  if (target <= 0) return 0;
  if (target >= 1) return Number.POSITIVE_INFINITY;
  if (attempts <= 0) return 1;

  const currentAccuracy = correct / attempts;
  if (currentAccuracy >= target) return 0;

  const needed = (target * attempts - correct) / (1 - target);
  return Math.max(0, Math.ceil(needed));
}
