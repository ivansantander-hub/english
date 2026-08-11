import { groupByTopic, topicLabel } from "../../lib/mastery.js";
import { trpc } from "../../lib/trpc.js";
import { ConceptRow } from "../progress/ConceptRow.js";

export function MistakesPage({
  onPracticeConcept,
}: {
  onPracticeConcept: (conceptKey: string) => void;
}): React.JSX.Element {
  const mistakesQuery = trpc.progress.getMistakes.useQuery();

  if (mistakesQuery.isLoading) return <p className="text-stone-500">Loading mistakes…</p>;
  if (mistakesQuery.isError || !mistakesQuery.data) {
    return <p className="text-red-700">Couldn&rsquo;t load your recurring mistakes.</p>;
  }

  const mistakes = mistakesQuery.data;

  if (mistakes.length === 0) {
    return (
      <div className="space-y-2">
        <h2 className="font-serif text-xl font-semibold">Your recurring mistakes</h2>
        <p className="text-stone-500">
          Nothing below 80% accuracy right now — keep practicing and weak spots will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-serif text-xl font-semibold">Your recurring mistakes</h2>
        <p className="mt-1 text-sm text-stone-500">
          Every concept under 80% accuracy, weakest first. Same colors and math as Progress.
        </p>
      </section>

      {groupByTopic(mistakes).map(({ topic, items }) => (
        <section key={topic}>
          <div className="mb-3 flex items-baseline justify-between border-b border-stone-200 pb-1.5">
            <h3 className="font-serif text-lg font-semibold">{topicLabel(topic)}</h3>
            <span className="text-sm tabular-nums text-stone-500">
              {items.length} weak {items.length === 1 ? "spot" : "spots"}
            </span>
          </div>
          <ul className="space-y-3">
            {items.map((concept) => (
              <ConceptRow
                key={concept.conceptId}
                concept={concept}
                onPractice={() => onPracticeConcept(concept.conceptKey)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
