import { useState } from "react";

import { trpc } from "../../lib/trpc.js";

import { ExerciseCard } from "./ExerciseCard.js";

const SLICE_LABELS: Record<string, string> = {
  review_weak: "Review a weak spot",
  normal_practice: "Practice",
  new_concepts: "New concept",
  writing: "Writing",
};

function MapLink({ onExit }: { onExit: (() => void) | undefined }): React.JSX.Element | null {
  if (!onExit) return null;
  return (
    <button type="button" onClick={onExit} className="text-sm font-bold text-ink/60 hover:text-ink">
      ← Path
    </button>
  );
}

export function DailyPracticePage({ onExit }: { onExit?: () => void }): React.JSX.Element {
  const planQuery = trpc.exercise.getDailyPractice.useQuery();
  const [index, setIndex] = useState(0);
  const [totalXp, setTotalXp] = useState(0);

  if (planQuery.isLoading) {
    return (
      <div className="space-y-4">
        <MapLink onExit={onExit} />
        <p className="text-ink/50">Building today&rsquo;s session…</p>
      </div>
    );
  }

  if (planQuery.isError || !planQuery.data) {
    return (
      <div className="space-y-4">
        <MapLink onExit={onExit} />
        <p className="text-red-700">Couldn&rsquo;t build a daily practice session.</p>
      </div>
    );
  }

  const plan = planQuery.data;

  if (plan.length === 0) {
    return (
      <div className="space-y-4">
        <MapLink onExit={onExit} />
        <p className="text-ink/50">No exercises available right now.</p>
      </div>
    );
  }

  if (index >= plan.length) {
    return (
      <div className="space-y-4">
        <MapLink onExit={onExit} />
        <div className="space-y-3 py-12 text-center">
          <p className="font-serif text-2xl font-extrabold text-ink">Daily practice complete</p>
          <p className="text-ink/60">
            You finished {plan.length} exercises. See your Progress tab for updated results.
          </p>
          {totalXp > 0 && (
            <p className="inline-block rounded-full bg-gold-tint px-3 py-1 font-mono text-sm font-bold text-ink">
              +{totalXp} XP earned
            </p>
          )}
        </div>
      </div>
    );
  }

  const current = plan[index];
  if (!current) return <p className="text-red-700">Something went wrong loading this exercise.</p>;

  return (
    <div className="space-y-4">
      <MapLink onExit={onExit} />
      <div className="flex items-center justify-between text-sm text-ink/50">
        <span>
          Exercise {index + 1} of {plan.length}
        </span>
        <span className="font-bold text-violet">
          {SLICE_LABELS[current.slice] ?? current.slice}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-ink/10">
        <div
          className="h-1.5 rounded-full bg-coral transition-all"
          style={{ width: `${(index / plan.length) * 100}%` }}
        />
      </div>
      <ExerciseCard
        key={current.exercise.id}
        exercise={current.exercise}
        onNext={(earnedXp) => {
          setTotalXp((xp) => xp + earnedXp);
          setIndex((i) => i + 1);
        }}
        nextLabel={index + 1 >= plan.length ? "Finish session" : "Next exercise"}
      />
    </div>
  );
}
