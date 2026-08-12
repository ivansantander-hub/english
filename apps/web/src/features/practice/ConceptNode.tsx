import { STATUS } from "../../lib/mastery.js";
import type { ConceptProgressItem } from "../../lib/trpc-types.js";

const GLYPH: Record<ConceptProgressItem["priority"], string> = {
  maintenance: "✓",
  review: "◐",
  high: "●",
  medium: "●",
  new: "",
};

export function ConceptNode({
  concept,
  align,
  onClick,
}: {
  concept: ConceptProgressItem;
  align: "start" | "end";
  onClick: () => void;
}): React.JSX.Element {
  const status = STATUS[concept.priority];
  const isNew = concept.priority === "new";

  return (
    <div className={`flex ${align === "end" ? "justify-end" : "justify-start"}`}>
      <button
        type="button"
        onClick={onClick}
        title={`${concept.conceptName} — ${status.label}`}
        className={`flex items-center gap-3 rounded-full py-1 transition hover:bg-ink/5 ${
          align === "end" ? "flex-row-reverse pl-4 pr-1" : "pl-1 pr-4"
        }`}
      >
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-base font-semibold ${
            isNew
              ? "border-dashed border-ink/25 bg-paper text-ink/30"
              : `border-transparent text-white ${status.bar}`
          }`}
        >
          {GLYPH[concept.priority]}
        </span>
        <span className="text-sm font-medium text-ink">{concept.conceptName}</span>
      </button>
    </div>
  );
}
