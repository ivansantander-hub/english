import { topicLabel } from "../../lib/mastery.js";
import { buildPracticePath, findContinueConcept } from "../../lib/practice-path.js";
import { trpc } from "../../lib/trpc.js";

import { ConceptNode } from "./ConceptNode.js";

export function PracticeMapPage({
  onStartConcept,
  onStartDaily,
}: {
  onStartConcept: (conceptKey: string) => void;
  onStartDaily: () => void;
}): React.JSX.Element {
  const dashboard = trpc.progress.getDashboard.useQuery();

  if (dashboard.isLoading) return <p className="text-ink/50">Loading your path…</p>;
  if (dashboard.isError || !dashboard.data) {
    return <p className="text-red-700">Couldn&rsquo;t load your practice path.</p>;
  }

  const sections = buildPracticePath(dashboard.data.concepts);
  const continueConcept = findContinueConcept(sections);

  return (
    <div className="space-y-10">
      <section className="rounded border border-ink/10 bg-white p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-ink/50">
          {continueConcept ? "Pick up where you left off" : "Every concept mastered"}
        </p>
        <p className="mt-1 font-serif text-xl font-semibold text-ink">
          {continueConcept ? continueConcept.conceptName : "Keep your streak alive"}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {continueConcept && (
            <button
              type="button"
              onClick={() => onStartConcept(continueConcept.conceptKey)}
              className="rounded bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink-light"
            >
              Continue →
            </button>
          )}
          <button
            type="button"
            onClick={onStartDaily}
            className={
              continueConcept
                ? "rounded border border-indigo-700 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
                : "rounded bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink-light"
            }
          >
            Start daily practice
          </button>
        </div>
      </section>

      {sections.map(({ topic, items }) => {
        const masteredCount = items.filter((c) => c.priority === "maintenance").length;
        return (
          <section key={topic}>
            <div className="mb-6 flex items-baseline justify-between border-b border-ink/10 pb-1.5">
              <h2 className="font-serif text-lg font-semibold text-ink">{topicLabel(topic)}</h2>
              <span className="text-sm tabular-nums text-ink/50">
                {masteredCount}/{items.length} mastered
              </span>
            </div>
            <div className="space-y-5">
              {items.map((concept, index) => (
                <ConceptNode
                  key={concept.conceptId}
                  concept={concept}
                  align={index % 2 === 0 ? "start" : "end"}
                  onClick={() => onStartConcept(concept.conceptKey)}
                />
              ))}
            </div>
          </section>
        );
      })}

      <section className="border-t border-ink/10 pt-4">
        <ul className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-ink/70">
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" aria-hidden="true" />
            Mastered
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" aria-hidden="true" />
            Almost there
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-600" aria-hidden="true" />
            Needs practice
          </li>
          <li className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full border-2 border-dashed border-ink/25"
              aria-hidden="true"
            />
            Not started
          </li>
        </ul>
      </section>
    </div>
  );
}
