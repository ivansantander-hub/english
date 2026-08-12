import { LevelBadge } from "../../components/LevelBadge.js";
import { computeLevel, computeXp } from "../../lib/gamification.js";
import type { ProfileAnalysis } from "../../lib/trpc-types.js";
import { trpc } from "../../lib/trpc.js";
import { useAuth } from "../auth/AuthContext.js";

const GRADED_BY_LABEL: Record<ProfileAnalysis["gradedBy"], string> = {
  ai: "AI analysis",
  rules: "Quick check (no AI)",
};

function formatDate(date: string | Date): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return value.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function ProfilePage(): React.JSX.Element {
  const { user } = useAuth();
  const dashboard = trpc.progress.getDashboard.useQuery();
  const analysesQuery = trpc.profile.list.useQuery();
  const utils = trpc.useUtils();
  const generate = trpc.profile.generate.useMutation({
    onSuccess: () => void utils.profile.list.invalidate(),
  });

  const totalCorrect = dashboard.data?.concepts.reduce((sum, c) => sum + c.correct, 0) ?? 0;
  const conceptsMastered =
    dashboard.data?.concepts.filter((c) => c.priority === "maintenance").length ?? 0;
  const level = computeLevel(computeXp(totalCorrect, conceptsMastered));

  return (
    <div className="space-y-8">
      <section className="flex items-center gap-4 rounded-[22px] bg-sky-tint p-6">
        <LevelBadge level={level.level} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-serif text-xl font-extrabold text-ink">{user?.email}</p>
          <p className="mt-1 text-sm text-ink/60">
            Level {level.level} &middot; {dashboard.data?.currentStreak ?? 0} day streak
          </p>
        </div>
      </section>

      <section>
        <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Practice analysis</p>
        <p className="mt-1 max-w-md text-sm text-ink/60">
          Get recommendations grounded in your real practice data — what to focus on, why, and how
          to practice it.
        </p>
        <button
          type="button"
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="mt-4 rounded-xl bg-sky px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
        >
          {generate.isPending ? "Analyzing…" : "Analyze my practice"}
        </button>
        {generate.isError && (
          <p className="mt-2 text-sm text-berry">Couldn&rsquo;t generate an analysis. Try again.</p>
        )}
      </section>

      <section className="space-y-4">
        {analysesQuery.isLoading && <p className="text-sm text-ink/50">Loading history…</p>}
        {analysesQuery.data?.length === 0 && (
          <p className="text-sm text-ink/50">
            No analysis yet — tap &ldquo;Analyze my practice&rdquo; to get your first one.
          </p>
        )}
        {analysesQuery.data?.map((analysis) => (
          <AnalysisCard key={analysis.id} analysis={analysis} />
        ))}
      </section>
    </div>
  );
}

function AnalysisCard({ analysis }: { analysis: ProfileAnalysis }): React.JSX.Element {
  return (
    <div className="space-y-4 rounded-2xl bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-md bg-ink/5 px-1.5 py-0.5 text-xs font-bold text-ink/70">
          {GRADED_BY_LABEL[analysis.gradedBy]}
        </span>
        <span className="text-xs text-ink/45">{formatDate(analysis.createdAt)}</span>
      </div>

      {analysis.strengths.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-mint">Strengths</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-ink/75">
            {analysis.strengths.map((strength, index) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm italic text-ink/55">
            {analysis.strengthsEs.map((strength, index) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.focusAreas.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-berry">Focus areas</p>
          <ul className="mt-1.5 space-y-3">
            {analysis.focusAreas.map((area, index) => (
              <li key={index} className="rounded-xl bg-berry-tint p-3">
                <p className="font-semibold text-ink">{area.concept}</p>
                <p className="mt-1 text-sm text-ink/75">{area.why}</p>
                <p className="text-sm italic text-ink/55">{area.whyEs}</p>
                <p className="mt-1.5 text-sm font-medium text-ink/80">{area.howTo}</p>
                <p className="text-sm italic text-ink/55">{area.howToEs}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="text-sm text-ink/75">{analysis.summary}</p>
        <p className="text-sm italic text-ink/55">{analysis.summaryEs}</p>
      </div>
    </div>
  );
}
