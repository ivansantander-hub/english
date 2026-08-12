interface IconProps {
  className?: string;
}

const DEFAULT_CLASS = "h-5 w-5";

export function PracticeIcon({ className = DEFAULT_CLASS }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19c3-1.5 4.5-4 4.5-7S7 6.5 4 5" />
        <path d="M20 19c-3-1.5-4.5-4-4.5-7S17 6.5 20 5" />
        <circle cx="12" cy="12" r="2.1" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

export function TalkIcon({ className = DEFAULT_CLASS }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 5.5h16v10H9.5L5 19v-3.5H4v-10Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProgressIcon({ className = DEFAULT_CLASS }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M5 19V11" />
        <path d="M12 19V5" />
        <path d="M19 19v-6" />
      </g>
    </svg>
  );
}

export function MistakesIcon({ className = DEFAULT_CLASS }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M9.5 12.5 11.2 14.2 14.8 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AdminIcon({ className = DEFAULT_CLASS }: IconProps): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3.5 19 6v5.5c0 4.2-2.9 7.4-7 8.5-4.1-1.1-7-4.3-7-8.5V6l7-2.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
