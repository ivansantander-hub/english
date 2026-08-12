import { topicLabel } from "../../lib/mastery.js";
import { buildPracticePath, findContinueConcept } from "../../lib/practice-path.js";
import { trpc } from "../../lib/trpc.js";

import { ConceptNode } from "./ConceptNode.js";
import type { StoneState } from "./ConceptNode.js";

const TOPIC_THEMES = [
  { card: "bg-coral-tint", dot: "bg-coral" },
  { card: "bg-violet-tint", dot: "bg-violet" },
  { card: "bg-gold-tint", dot: "bg-gold" },
];

function Mascot(): React.JSX.Element {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
      <svg viewBox="0 0 32 32" fill="none" className="h-8 w-8" aria-hidden="true">
        <circle cx="16" cy="16" r="15" fill="#ffb238" />
        <circle cx="11" cy="14" r="2.4" fill="#241f21" />
        <circle cx="21" cy="14" r="2.4" fill="#241f21" />
        <path
          d="M10 20c2 2.5 10 2.5 12 0"
          stroke="#241f21"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

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

  const { concepts, currentStreak, todayCount, dailyGoal } = dashboard.data;
  const sections = buildPracticePath(concepts);
  const continueConcept = findContinueConcept(sections);
  const goalPercent = Math.min(100, (todayCount / dailyGoal) * 100);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-coral-tint to-gold-tint p-6 shadow-md">
        <div className="relative flex items-start justify-between gap-4">
          <h1 className="font-serif text-2xl font-extrabold leading-tight text-ink">
            {continueConcept
              ? `Keep going — you're on ${continueConcept.conceptName}`
              : "Every concept mastered — keep your streak alive!"}
          </h1>
          <Mascot />
        </div>

        <div className="relative mt-6 flex gap-7">
          <div>
            <p className="font-serif text-3xl font-extrabold text-ink">{currentStreak}</p>
            <p className="mt-1 text-xs font-semibold text-ink/60">day streak</p>
          </div>
          <div>
            <p className="font-serif text-3xl font-extrabold text-ink">
              {todayCount}
              <span className="text-lg text-ink/40">/{dailyGoal}</span>
            </p>
            <p className="mt-1 text-xs font-semibold text-ink/60">today&rsquo;s goal</p>
            <div className="mt-1.5 h-1.5 w-24 rounded-full bg-ink/10">
              <div className="h-1.5 rounded-full bg-mint" style={{ width: `${goalPercent}%` }} />
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-lg font-extrabold text-ink">Your path</h2>
        <button
          type="button"
          onClick={onStartDaily}
          className="rounded-xl bg-coral px-3.5 py-2 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5"
        >
          Start daily practice
        </button>
      </div>

      {sections.map(({ topic, items }, topicIndex) => {
        const masteredCount = items.filter((c) => c.priority === "maintenance").length;
        const theme = TOPIC_THEMES[topicIndex % TOPIC_THEMES.length];

        return (
          <div key={topic} className={`rounded-[22px] px-5 pb-6 pt-5 ${theme?.card}`}>
            <div className="mb-5 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${theme?.dot}`} aria-hidden="true" />
              <h3 className="font-serif text-base font-extrabold text-ink">{topicLabel(topic)}</h3>
              <span className="ml-auto font-mono text-sm text-ink/40">
                {masteredCount}/{items.length}
              </span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 pt-6">
              {items.map((concept, index) => {
                const state: StoneState =
                  concept.priority === "maintenance"
                    ? "done"
                    : concept.conceptId === continueConcept?.conceptId
                      ? "active"
                      : "locked";
                return (
                  <ConceptNode
                    key={concept.conceptId}
                    concept={concept}
                    state={state}
                    index={index}
                    onClick={() => onStartConcept(concept.conceptKey)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink/60">
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-md bg-mint" aria-hidden="true" /> Mastered
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-md border-2 border-dashed border-coral bg-white" aria-hidden="true" />{" "}
          You&rsquo;re here
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-md bg-white opacity-60" aria-hidden="true" /> Not started
        </span>
      </div>
    </div>
  );
}
