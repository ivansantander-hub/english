import { useState } from "react";

import { groupByTopic, topicLabel } from "../../lib/mastery.js";
import { trpc } from "../../lib/trpc.js";
import { ConceptRow } from "../progress/ConceptRow.js";

function activityLevelClass(count: number): string {
  if (count === 0) return "bg-stone-200";
  if (count <= 2) return "bg-indigo-300";
  if (count <= 5) return "bg-indigo-500";
  return "bg-indigo-700";
}

function weekdayLabel(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, { weekday: "narrow" });
}

function ActivityStrip({
  activity,
  today,
}: {
  activity: { date: string; count: number }[];
  today: string;
}): React.JSX.Element {
  return (
    <div className="flex gap-1.5">
      {activity.map((day) => (
        <div key={day.date} className="flex flex-col items-center gap-1">
          <div
            className={`h-6 w-6 rounded-sm ${activityLevelClass(day.count)} ${
              day.date === today ? "ring-2 ring-stone-900 ring-offset-1" : ""
            }`}
            title={`${day.date}: ${day.count} exercise${day.count === 1 ? "" : "s"}`}
          />
          <span className="text-[10px] text-stone-400">{weekdayLabel(day.date)}</span>
        </div>
      ))}
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

  if (dashboard.isLoading) return <p className="text-stone-500">Loading progress…</p>;
  if (dashboard.isError || !dashboard.data) {
    return <p className="text-red-700">Couldn&rsquo;t load progress.</p>;
  }

  const {
    concepts,
    overallAccuracy,
    exercisesCompleted,
    currentStreak,
    practicedToday,
    todayCount,
    dailyGoal,
    activity,
  } = dashboard.data;
  const today = activity[activity.length - 1]?.date ?? "";
  const hasWeaknesses = concepts.some((c) => c.priority === "high" || c.priority === "medium");

  if (exercisesCompleted === 0) {
    return (
      <div className="space-y-6">
        <section>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Progress</p>
          <p className="mt-2 font-serif text-2xl font-semibold">
            You haven&rsquo;t completed any exercises yet.
          </p>
          <p className="mt-2 max-w-md text-sm text-stone-500">
            Start practicing and your streak, daily goal, and accuracy by grammar concept will show
            up here.
          </p>
        </section>
        <button
          type="button"
          onClick={onDailyPractice}
          className="rounded bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-stone-700"
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
    <div className="space-y-10">
      <section>
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Progress</p>

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
          <div>
            <p className="font-serif text-4xl font-semibold tabular-nums">{currentStreak}</p>
            <p className="mt-1 text-sm text-stone-600">
              day{currentStreak === 1 ? "" : "s"} streak
            </p>
            {!practicedToday && currentStreak > 0 && (
              <p className="mt-0.5 text-xs text-amber-700">Practice today to keep it</p>
            )}
          </div>

          <div>
            <p className="font-serif text-4xl font-semibold tabular-nums">
              {todayCount}
              <span className="text-xl text-stone-400">/{dailyGoal}</span>
            </p>
            <p className="mt-1 text-sm text-stone-600">today&rsquo;s goal</p>
            <div className="mt-1.5 h-1.5 w-20 rounded-full bg-stone-200">
              <div
                className="h-1.5 rounded-full bg-stone-900"
                style={{ width: `${Math.min(100, (todayCount / dailyGoal) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <p className="font-serif text-4xl font-semibold tabular-nums">{exercisesCompleted}</p>
            <p className="mt-1 text-sm text-stone-600">exercises total</p>
          </div>

          <div>
            <p className="font-serif text-4xl font-semibold tabular-nums">
              {Math.round(overallAccuracy * 100)}%
            </p>
            <p className="mt-1 text-sm text-stone-600">accuracy</p>
          </div>
        </div>

        <p className="mt-4 max-w-md text-xs text-stone-500">
          Accuracy is correct ÷ attempts across every grammar concept you&rsquo;ve practiced —
          one exercise can touch several concepts at once, so it moves faster than the exercise
          count above.
        </p>
      </section>

      <section>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
          Last 14 days
        </p>
        <ActivityStrip activity={activity} today={today} />
      </section>

      <section className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onDailyPractice}
          className="rounded bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-stone-700"
        >
          Start daily practice
        </button>
        {hasWeaknesses && (
          <button
            type="button"
            onClick={onPracticeWeaknesses}
            className="rounded border border-indigo-700 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
          >
            Practice my weaknesses
          </button>
        )}
      </section>

      <section className="border-y border-stone-200 py-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
          Mastery scale
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-stone-700">
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-stone-300" aria-hidden="true" />
            Not started
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-amber-600" aria-hidden="true" />
            Below 80% — needs practice
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-indigo-500" aria-hidden="true" />
            80–89% — almost there
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-emerald-600" aria-hidden="true" />
            90%+ — mastered
          </li>
        </ul>
      </section>

      {untouchedCount > 0 && (
        <p className="text-sm text-stone-500">
          Showing the {touchedConcepts.length} concept{touchedConcepts.length === 1 ? "" : "s"}{" "}
          you&rsquo;ve practiced.{" "}
          <button
            type="button"
            onClick={() => setShowAllConcepts((v) => !v)}
            className="font-medium text-indigo-700 hover:text-indigo-900"
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
            <div className="mb-3 flex items-baseline justify-between border-b border-stone-200 pb-1.5">
              <h2 className="font-serif text-lg font-semibold">{topicLabel(topic)}</h2>
              <span className="text-sm tabular-nums text-stone-500">
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
