import { RELEASE_NOTES } from "../../lib/release-notes.js";
import type { ReleaseNote, ReleaseType } from "../../lib/release-notes.js";

const TYPE_BADGE: Record<ReleaseType, { label: string; className: string }> = {
  major: { label: "Major", className: "bg-gold-tint text-ink" },
  minor: { label: "Minor", className: "bg-sky-tint text-ink" },
  patch: { label: "Patch", className: "bg-ink/5 text-ink/70" },
};

function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function ReleaseNotesPage({ onBack }: { onBack: () => void }): React.JSX.Element {
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-bold text-ink/60 hover:text-ink"
      >
        ← Back
      </button>

      <section>
        <p className="text-xs font-medium uppercase tracking-wide text-ink/50">What&rsquo;s new</p>
        <p className="mt-1 font-serif text-2xl font-extrabold text-ink">Release notes</p>
      </section>

      <ul className="space-y-8">
        {RELEASE_NOTES.map((entry) => (
          <ReleaseEntry key={entry.version} entry={entry} />
        ))}
      </ul>
    </div>
  );
}

function ReleaseEntry({ entry }: { entry: ReleaseNote }): React.JSX.Element {
  const badge = TYPE_BADGE[entry.type];

  return (
    <li className="rounded-2xl bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${badge.className}`}>
          {badge.label}
        </span>
        <span className="font-mono text-sm font-bold text-ink">v{entry.version}</span>
        <span className="text-xs text-ink/45">{formatDate(entry.date)}</span>
      </div>

      <h2 className="mt-2 font-serif text-lg font-extrabold text-ink">{entry.title}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/75">
        {entry.notes.map((note, index) => (
          <li key={index}>{note}</li>
        ))}
      </ul>

      <p className="mt-3 font-serif text-base font-bold italic text-ink/70">{entry.titleEs}</p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm italic text-ink/55">
        {entry.notesEs.map((note, index) => (
          <li key={index}>{note}</li>
        ))}
      </ul>
    </li>
  );
}
