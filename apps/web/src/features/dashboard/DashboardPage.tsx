import { groupByTopic, topicLabel } from "../../lib/mastery.js";
import { trpc } from "../../lib/trpc.js";
import { ConceptRow } from "../progress/ConceptRow.js";

export function DashboardPage({
  onPracticeWeaknesses,
  onDailyPractice,
}: {
  onPracticeWeaknesses: () => void;
  onDailyPractice: () => void;
}): React.JSX.Element {
  const dashboard = trpc.progress.getDashboard.useQuery();

  if (dashboard.isLoading) return <p className="text-stone-500">Loading progress…</p>;
  if (dashboard.isError || !dashboard.data) {
    return <p className="text-red-700">Couldn&rsquo;t load progress.</p>;
  }

  const { concepts, overallAccuracy, exercisesCompleted } = dashboard.data;
  const hasWeaknesses = concepts.some((c) => c.priority === "high" || c.priority === "medium");
  const totalCorrect = concepts.reduce((sum, c) => sum + c.correct, 0);
  const totalAttempts = concepts.reduce((sum, c) => sum + c.attempts, 0);
  const totalIncorrect = totalAttempts - totalCorrect;

  if (exercisesCompleted === 0) {
    return (
      <div className="space-y-6">
        <section>
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Progress</p>
          <p className="mt-2 font-serif text-2xl font-semibold">
            You haven&rsquo;t completed any exercises yet.
          </p>
          <p className="mt-2 max-w-md text-sm text-stone-500">
            Start practicing and your accuracy, broken down by grammar concept, will show up here.
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

  return (
    <div className="space-y-10">
      <section>
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Progress</p>
        <p className="mt-1 font-serif text-5xl font-semibold tabular-nums">
          {Math.round(overallAccuracy * 100)}%
        </p>
        <p className="mt-1 text-sm text-stone-600">
          overall accuracy · <span className="tabular-nums">{exercisesCompleted}</span> exercise
          {exercisesCompleted === 1 ? "" : "s"} completed
        </p>
        <p className="mt-2 text-sm text-stone-600">
          <span className="tabular-nums font-medium text-stone-900">{totalCorrect}</span> correct
          answers ·{" "}
          <span className="tabular-nums font-medium text-stone-900">{totalIncorrect}</span>{" "}
          incorrect ·{" "}
          <span className="tabular-nums font-medium text-stone-900">{totalAttempts}</span> total
          (across every concept the exercise touched)
        </p>
        <p className="mt-3 max-w-md text-sm text-stone-500">
          The percentage above is correct ÷ total, averaged across every concept below. One exercise
          often targets 2–3 concepts at once, so completing one exercise updates several rows below,
          and the overall number can move faster than exercises completed.
        </p>
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

      {groupByTopic(concepts).map(({ topic, items }) => {
        const masteredCount = items.filter((c) => c.priority === "maintenance").length;
        return (
          <section key={topic}>
            <div className="mb-3 flex items-baseline justify-between border-b border-stone-200 pb-1.5">
              <h2 className="font-serif text-lg font-semibold">{topicLabel(topic)}</h2>
              <span className="text-sm tabular-nums text-stone-500">
                {masteredCount}/{items.length} mastered
              </span>
            </div>
            <ul className="space-y-3">
              {items.map((concept) => (
                <ConceptRow key={concept.conceptId} concept={concept} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
