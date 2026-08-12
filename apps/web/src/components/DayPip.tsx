/** Deterministic small tilt so a row of pips doesn't look machine-printed. */
function rotationFor(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 360;
  return (hash % 11) - 5;
}

export function DayPip({
  seed,
  count,
  isToday = false,
  title,
}: {
  /** Any stable string unique to this pip (e.g. the date) — drives the tilt. */
  seed: string;
  count: number;
  isToday?: boolean;
  title?: string;
}): React.JSX.Element {
  const active = count > 0;
  const rotation = active ? rotationFor(seed) : 0;

  return (
    <div
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold ${
        active ? "bg-mint text-white shadow-sm" : "border-2 border-dashed border-ink/15 text-ink/25"
      } ${isToday ? "ring-2 ring-coral ring-offset-1 ring-offset-paper" : ""}`}
      style={active ? { transform: `rotate(${rotation}deg)` } : undefined}
      title={title}
    >
      {active ? count : "·"}
    </div>
  );
}
