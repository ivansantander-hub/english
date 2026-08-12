import type { ConceptProgressItem } from "../../lib/trpc-types.js";

export type StoneState = "done" | "active" | "locked";

const GLYPH: Record<StoneState, string> = { done: "✓", active: "●", locked: "○" };
const LABEL: Record<StoneState, string> = {
  done: "Mastered",
  active: "You're here",
  locked: "Not started yet",
};

export function ConceptNode({
  concept,
  state,
  index,
  onClick,
}: {
  concept: ConceptProgressItem;
  state: StoneState;
  index: number;
  onClick: () => void;
}): React.JSX.Element {
  const rotate = index % 2 === 0 ? "-rotate-3" : "rotate-3";

  return (
    <div className="flex w-[84px] shrink-0 flex-col items-center gap-2" style={{ minWidth: "84px" }}>
      <span
        className={`flex h-5 items-center justify-center rounded-full bg-ink px-2 text-[10px] font-extrabold text-paper ${
          state === "active" ? "" : "invisible"
        }`}
      >
        You&rsquo;re here
      </span>
      <button
        type="button"
        onClick={onClick}
        title={`${concept.conceptName} — ${LABEL[state]}`}
        className={`flex h-11 w-11 items-center justify-center rounded-2xl text-base font-extrabold shadow-sm transition hover:scale-105 ${rotate} ${
          state === "done"
            ? "bg-mint text-white"
            : state === "active"
              ? "border-2 border-dashed border-sky bg-surface text-ink"
              : "bg-surface text-ink/30"
        }`}
      >
        {GLYPH[state]}
      </button>
      <span className="text-center text-xs font-semibold leading-tight text-ink/70">
        {concept.conceptName}
      </span>
    </div>
  );
}
