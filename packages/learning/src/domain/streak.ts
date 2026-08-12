export interface StreakResult {
  currentStreak: number;
  practicedToday: boolean;
}

/**
 * `activeDates` are distinct "YYYY-MM-DD" calendar days on which the user
 * completed at least one exercise; `today` is that same format for "now"
 * (both in whatever single timezone the caller buckets attempts into).
 *
 * A streak counts consecutive days ending today. If today has no activity
 * yet, yesterday can still anchor the streak — the day isn't over, so the
 * user hasn't broken it by not having practiced yet — but it reads as 0
 * once a full day is missed.
 */
export function computeActivityStreak(
  activeDates: readonly string[],
  today: string,
): StreakResult {
  const days = new Set(activeDates);
  const practicedToday = days.has(today);

  let cursor = practicedToday ? today : addDays(today, -1);
  let currentStreak = 0;
  while (days.has(cursor)) {
    currentStreak += 1;
    cursor = addDays(cursor, -1);
  }

  return { currentStreak, practicedToday };
}

function addDays(dateStr: string, delta: number): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}
