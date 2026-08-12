/** Deterministic small tilt so a row of stamps doesn't look machine-printed. */
function rotationFor(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 360;
  return (hash % 13) - 6;
}

export function StampBadge({
  seed,
  count,
  isToday = false,
  size = "md",
  title,
  animate = false,
}: {
  /** Any stable string unique to this stamp (e.g. the date) — drives the tilt. */
  seed: string;
  count: number;
  isToday?: boolean;
  size?: "sm" | "md";
  title?: string;
  animate?: boolean;
}): React.JSX.Element {
  const dimension = size === "sm" ? "h-5 w-5" : "h-7 w-7";
  const textSize = size === "sm" ? "text-[9px]" : "text-[10px]";
  const active = count > 0;
  const rotation = active ? rotationFor(seed) : 0;

  return (
    <div
      className={`flex items-center justify-center rounded-full border-2 ${dimension} ${
        active ? "border-stamp bg-stamp/10 text-stamp" : "border-dashed border-ink/15 text-ink/25"
      } ${isToday ? "ring-2 ring-gold ring-offset-1 ring-offset-paper" : ""} ${
        animate ? "animate-stamp" : ""
      }`}
      style={active ? { transform: `rotate(${rotation}deg)` } : undefined}
      title={title}
    >
      <span className={`font-mono ${textSize} font-semibold`}>{active ? count : "·"}</span>
    </div>
  );
}
