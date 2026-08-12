export function FlameIcon({ className = "h-4 w-4" }: { className?: string }): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2c.8 2.7-.4 4-1.6 5.3C9 8.7 7.5 10.3 7.5 13a4.5 4.5 0 0 0 9 0c0-1.3-.4-2.2-1-3.1.9.4 2 1.6 2 3.6a5.5 5.5 0 0 1-11 0c0-4 2.7-6 4-8 .7-1 1.2-2 1.5-3.5z" />
    </svg>
  );
}
