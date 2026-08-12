import { trpc } from "../../lib/trpc.js";

import { ExerciseCard } from "./ExerciseCard.js";
import type { PracticeParams } from "./practice-params.js";

const MODE_LABELS: Record<string, string> = {
  weakness: "Practicing your weak spots",
  balanced: "Practice",
};

export function PracticePage({
  params,
  onExit,
}: {
  params: PracticeParams;
  onExit?: () => void;
}): React.JSX.Element {
  const utils = trpc.useUtils();
  const exerciseQuery = trpc.exercise.getNext.useQuery({
    mode: params.mode === "daily" ? "balanced" : params.mode,
    ...(params.conceptKey ? { conceptKey: params.conceptKey } : {}),
  });

  const exercise = exerciseQuery.data;

  function handleNext(): void {
    void utils.exercise.getNext.invalidate();
  }

  return (
    <div className="space-y-4">
      {onExit && (
        <button
          type="button"
          onClick={onExit}
          className="text-sm font-bold text-ink/60 hover:text-ink"
        >
          ← Path
        </button>
      )}

      {exerciseQuery.isLoading && <p className="text-ink/50">Loading exercise…</p>}

      {(exerciseQuery.isError || (!exerciseQuery.isLoading && !exercise)) && (
        <p className="text-red-700">
          Couldn&rsquo;t load an exercise. Make sure the API is running and the database has been
          seeded.
        </p>
      )}

      {exercise && (
        <>
          {(params.mode === "weakness" || params.conceptKey) && (
            <p className="text-sm font-bold text-violet">
              {params.conceptKey
                ? `Targeted practice: ${params.conceptKey.replace(/_/g, " ")}`
                : MODE_LABELS.weakness}
            </p>
          )}
          <ExerciseCard exercise={exercise} onNext={handleNext} />
        </>
      )}
    </div>
  );
}
