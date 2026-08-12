import { groupByTopic, topicLabel } from "../../lib/mastery.js";
import { trpc } from "../../lib/trpc.js";
import { ConceptRow } from "../progress/ConceptRow.js";

export function MistakesPage({
  onPracticeConcept,
}: {
  onPracticeConcept: (conceptKey: string) => void;
}): React.JSX.Element {
  const mistakesQuery = trpc.progress.getMistakes.useQuery();

  if (mistakesQuery.isLoading) return <p className="text-ink/50">Loading mistakes…</p>;
  if (mistakesQuery.isError || !mistakesQuery.data) {
    return <p className="text-red-700">Couldn&rsquo;t load your recurring mistakes.</p>;
  }

  const mistakes = mistakesQuery.data;

  if (mistakes.length === 0) {
    return (
      <div className="space-y-2">
        <h2 className="font-serif text-xl font-extrabold text-ink">Focus areas</h2>
        <p className="text-ink/60">
          Nothing below 80% accuracy right now — keep practicing and weak spots will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-serif text-xl font-extrabold text-ink">Focus areas</h2>
        <p className="mt-1 text-sm text-ink/60">
          Every concept under 80% accuracy, weakest first. Same colors and math as Progress.
        </p>
      </section>

      {groupByTopic(mistakes).map(({ topic, items }) => (
        <section key={topic}>
          <div className="mb-3 flex items-baseline justify-between border-b border-ink/10 pb-1.5">
            <h3 className="font-serif text-lg font-extrabold text-ink">{topicLabel(topic)}</h3>
            <span className="text-sm tabular-nums text-ink/50">
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
