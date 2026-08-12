import { trpc } from "../../lib/trpc.js";

import { ExerciseCard } from "./ExerciseCard.js";
import type { PracticeParams } from "./practice-params.js";

const MODE_LABELS: Record<string, string> = {
  weakness: "Practicing your weak spots",
  balanced: "Practice",
};

export function PracticePage({ params }: { params: PracticeParams }): React.JSX.Element {
  const utils = trpc.useUtils();
  const exerciseQuery = trpc.exercise.getNext.useQuery({
    mode: params.mode === "daily" ? "balanced" : params.mode,
    ...(params.conceptKey ? { conceptKey: params.conceptKey } : {}),
  });

  const exercise = exerciseQuery.data;

  function handleNext(): void {
    void utils.exercise.getNext.invalidate();
  }

  if (exerciseQuery.isLoading) {
    return <p className="text-ink/50">Loading exercise…</p>;
  }

  if (exerciseQuery.isError || !exercise) {
    return (
      <p className="text-red-700">
        Couldn&rsquo;t load an exercise. Make sure the API is running and the database has been
        seeded.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {(params.mode === "weakness" || params.conceptKey) && (
        <p className="text-sm font-medium text-indigo-700">
          {params.conceptKey
            ? `Targeted practice: ${params.conceptKey.replace(/_/g, " ")}`
            : MODE_LABELS.weakness}
        </p>
      )}
      <ExerciseCard exercise={exercise} onNext={handleNext} />
    </div>
  );
}
