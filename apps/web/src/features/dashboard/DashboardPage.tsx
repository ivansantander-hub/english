import { useState } from "react";

import { DayPip } from "../../components/DayPip.js";
import { FlameIcon } from "../../components/FlameIcon.js";
import { LevelBadge } from "../../components/LevelBadge.js";
import { computeLevel, computeXp } from "../../lib/gamification.js";
import { groupByTopic, topicLabel } from "../../lib/mastery.js";
import { trpc } from "../../lib/trpc.js";
import { ConceptRow } from "../progress/ConceptRow.js";

function weekdayLabel(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, { weekday: "narrow" });
}

function StatBlock({ value, label }: { value: React.ReactNode; label: string }): React.JSX.Element {
  return (
    <div>
      <p className="font-serif text-3xl font-extrabold tabular-nums text-ink">{value}</p>
      <p className="mt-1 text-sm font-semibold text-ink/55">{label}</p>
    </div>
  );
}

export function DashboardPage({
  onPracticeWeaknesses,
  onDailyPractice,
}: {
  onPracticeWeaknesses: () => void;
  onDailyPractice: () => void;
}): React.JSX.Element {
  const dashboard = trpc.progress.getDashboard.useQuery();
  const [showAllConcepts, setShowAllConcepts] = useState(false);

  if (dashboard.isLoading) return <p className="text-ink/50">Loading progress…</p>;
  if (dashboard.isError || !dashboard.data) {
    return <p className="text-red-700 dark:text-red-400">Couldn&rsquo;t load progress.</p>;
  }

  const {
    concepts,
    overallAccuracy,
    exercisesCompleted,
    exercisesSkipped,
    currentStreak,
    practicedToday,
    todayCount,
    dailyGoal,
    activity,
  } = dashboard.data;
  const today = activity[activity.length - 1]?.date ?? "";
  const hasWeaknesses = concepts.some((c) => c.priority === "high" || c.priority === "medium");

  const totalCorrect = concepts.reduce((sum, c) => sum + c.correct, 0);
  const conceptsMastered = concepts.filter((c) => c.priority === "maintenance").length;
  const level = computeLevel(computeXp(totalCorrect, conceptsMastered));

  if (exercisesCompleted === 0) {
    return (
      <div className="space-y-6">
        <section className="flex items-center gap-4 rounded-[22px] bg-sky-tint p-6">
          <LevelBadge level={1} size="lg" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink/50">
              Your journey starts here
            </p>
            <p className="mt-1 font-serif text-xl font-extrabold text-ink">
              You haven&rsquo;t completed any exercises yet.
            </p>
            <p className="mt-2 max-w-md text-sm text-ink/60">
              Start practicing and your streak, level, and daily goal will show up here.
            </p>
          </div>
        </section>
        <button
          type="button"
          onClick={onDailyPractice}
          className="rounded-xl bg-sky px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5"
        >
          Start daily practice
        </button>
      </div>
    );
  }

  const touchedConcepts = concepts.filter((c) => c.attempts > 0);
  const untouchedCount = concepts.length - touchedConcepts.length;
  const fullTopics = groupByTopic(concepts);
  const touchedByTopic = new Map(groupByTopic(touchedConcepts).map((g) => [g.topic, g.items]));

  return (
    <div className="space-y-9">
      <section className="rounded-[26px] bg-gradient-to-br from-gold-tint to-sky-tint p-6 shadow-md">
        <div className="flex items-center gap-4">
          <LevelBadge level={level.level} size="lg" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-ink/50">
              Level {level.level}
            </p>
            <p className="truncate font-serif text-xl font-extrabold text-ink">{level.title}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 w-36 rounded-full bg-white/60">
                <div
                  className="h-1.5 rounded-full bg-gold"
                  style={{ width: `${Math.max(4, level.progress * 100)}%` }}
                />
              </div>
              <span className="font-mono text-xs tabular-nums text-ink/50">
                {level.xpIntoLevel}/{level.xpForNextLevel} XP
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
          <div>
            <div className="flex items-center gap-1.5">
              <FlameIcon className={`h-5 w-5 ${practicedToday ? "text-sky" : "text-ink/30"}`} />
              <p className="font-serif text-3xl font-extrabold tabular-nums text-ink">
                {currentStreak}
              </p>
            </div>
            <p className="mt-1 text-sm font-semibold text-ink/55">
              day{currentStreak === 1 ? "" : "s"} streak
            </p>
            {!practicedToday && currentStreak > 0 && (
              <p className="mt-0.5 text-xs font-bold text-berry">Practice today to keep it</p>
            )}
          </div>

          <div>
            <p className="font-serif text-3xl font-extrabold tabular-nums text-ink">
              {todayCount}
              <span className="text-lg text-ink/35">/{dailyGoal}</span>
            </p>
            <p className="mt-1 text-sm font-semibold text-ink/55">today&rsquo;s goal</p>
            <div className="mt-1.5 h-1.5 w-20 rounded-full bg-white/60">
              <div
                className="h-1.5 rounded-full bg-mint"
                style={{ width: `${Math.min(100, (todayCount / dailyGoal) * 100)}%` }}
              />
            </div>
          </div>

          <StatBlock value={exercisesCompleted} label="exercises total" />
          <StatBlock value={`${Math.round(overallAccuracy * 100)}%`} label="accuracy" />
        </div>
      </section>

      <p className="-mt-5 max-w-md text-xs text-ink/45">
        Accuracy is correct ÷ attempts across every grammar concept you&rsquo;ve practiced —
        one exercise can touch several concepts at once, so it moves faster than the exercise
        count above.
        {exercisesSkipped > 0 &&
          ` You've skipped ${exercisesSkipped} exercise${exercisesSkipped === 1 ? "" : "s"} without answering.`}
      </p>

      <section>
        <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-ink/50">Last 14 days</p>
        <div className="flex gap-1.5">
          {activity.map((day) => (
            <div key={day.date} className="flex flex-col items-center gap-1">
              <DayPip
                seed={day.date}
                count={day.count}
                isToday={day.date === today}
                title={`${day.date}: ${day.count} exercise${day.count === 1 ? "" : "s"}`}
              />
              <span className="text-[10px] text-ink/40">{weekdayLabel(day.date)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onDailyPractice}
          className="rounded-xl bg-sky px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5"
        >
          Start daily practice
        </button>
        {hasWeaknesses && (
          <button
            type="button"
            onClick={onPracticeWeaknesses}
            className="rounded-xl border-2 border-berry px-4 py-2.5 text-sm font-bold text-berry transition hover:bg-berry-tint"
          >
            Practice my weaknesses
          </button>
        )}
      </section>

      <section className="rounded-2xl bg-ink/[0.03] px-5 py-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink/50">Mastery scale</p>
        <ul className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-ink/70">
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-ink/15" aria-hidden="true" />
            Not started
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-berry" aria-hidden="true" />
            Below 80% — needs practice
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-gold" aria-hidden="true" />
            80–89% — almost there
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-mint" aria-hidden="true" />
            90%+ — mastered
          </li>
        </ul>
      </section>

      {untouchedCount > 0 && (
        <p className="text-sm text-ink/50">
          Showing the {touchedConcepts.length} concept{touchedConcepts.length === 1 ? "" : "s"}{" "}
          you&rsquo;ve practiced.{" "}
          <button
            type="button"
            onClick={() => setShowAllConcepts((v) => !v)}
            className="font-bold text-sky hover:text-ink"
          >
            {showAllConcepts
              ? "Hide concepts you haven't started"
              : `Show ${untouchedCount} more you haven't started`}
          </button>
        </p>
      )}

      {fullTopics.map(({ topic, items: allItems }) => {
        const shownItems = showAllConcepts ? allItems : (touchedByTopic.get(topic) ?? []);
        if (shownItems.length === 0) return null;
        const masteredCount = allItems.filter((c) => c.priority === "maintenance").length;

        return (
          <section key={topic}>
            <div className="mb-3 flex items-baseline justify-between border-b border-ink/10 pb-1.5">
              <h2 className="font-serif text-lg font-extrabold text-ink">{topicLabel(topic)}</h2>
              <span className="text-sm tabular-nums text-ink/50">
                {masteredCount}/{allItems.length} mastered
              </span>
            </div>
            <ul className="space-y-3">
              {shownItems.map((concept) => (
                <ConceptRow key={concept.conceptId} concept={concept} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
