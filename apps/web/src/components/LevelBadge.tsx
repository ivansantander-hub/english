const SIZE_CLASSES = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-9 w-9 text-sm",
  lg: "h-16 w-16 text-xl",
};

export function LevelBadge({
  level,
  size = "md",
}: {
  level: number;
  size?: "sm" | "md" | "lg";
}): React.JSX.Element {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gold font-serif font-extrabold text-ink shadow-sm ${SIZE_CLASSES[size]}`}
      aria-label={`Level ${level}`}
    >
      {level}
    </div>
  );
}
