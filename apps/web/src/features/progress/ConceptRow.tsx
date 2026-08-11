import { nextMasteryTarget, STATUS } from "../../lib/mastery.js";
import type { ConceptProgressItem } from "../../lib/trpc-types.js";

export function ConceptRow({
  concept,
  onPractice,
}: {
  concept: ConceptProgressItem;
  onPractice?: () => void;
}): React.JSX.Element {
  const status = STATUS[concept.priority];
  const percent = Math.round(concept.accuracy * 100);
  const incorrect = concept.attempts - concept.correct;
  const target = nextMasteryTarget(concept);

  return (
    <li>
      <div className="mb-0.5 flex items-baseline justify-between text-sm">
        <span className="font-medium">{concept.conceptName}</span>
        <span className={`tabular-nums ${status.text}`}>
          {concept.attempts === 0 ? "—" : `${percent}%`} · {status.label}
        </span>
      </div>

      {concept.attempts > 0 && (
        <p className="mb-1 text-xs text-stone-500">
          <span className="tabular-nums text-stone-700">{concept.correct}</span> correct ·{" "}
          <span className="tabular-nums text-stone-700">{incorrect}</span> incorrect
          {target && (
            <>
              {" "}
              · <span className="tabular-nums text-stone-700">{target.needed}</span> more correct in
              a row → {target.targetPercent}% ({target.unlockLabel})
            </>
          )}
        </p>
      )}

      <div className="flex items-center gap-3">
        <div className="h-1.5 w-full rounded-full bg-stone-200" role="presentation">
          <div className={`h-1.5 rounded-full ${status.bar}`} style={{ width: `${percent}%` }} />
        </div>
        {onPractice && (
          <button
            type="button"
            onClick={onPractice}
            className="shrink-0 text-xs font-medium text-indigo-700 hover:text-indigo-900"
          >
            Practice this →
          </button>
        )}
      </div>
    </li>
  );
}
