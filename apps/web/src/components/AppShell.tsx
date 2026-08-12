import { useAuth } from "../features/auth/AuthContext.js";
import { computeLevel, computeXp } from "../lib/gamification.js";
import { trpc } from "../lib/trpc.js";

import { FlameIcon } from "./FlameIcon.js";
import { LevelBadge } from "./LevelBadge.js";

export type View = "practice" | "dashboard" | "mistakes" | "conversation" | "admin";

const NAV_ITEMS: { view: View; label: string }[] = [
  { view: "practice", label: "Practice" },
  { view: "conversation", label: "Conversation" },
  { view: "dashboard", label: "Progress" },
  { view: "mistakes", label: "Mistakes" },
];

export function AppShell({
  view,
  onNavigate,
  children,
}: {
  view: View;
  onNavigate: (view: View) => void;
  children: React.ReactNode;
}): React.JSX.Element {
  const { user, logout } = useAuth();
  const dashboard = trpc.progress.getDashboard.useQuery();

  const totalCorrect = dashboard.data?.concepts.reduce((sum, c) => sum + c.correct, 0) ?? 0;
  const conceptsMastered =
    dashboard.data?.concepts.filter((c) => c.priority === "maintenance").length ?? 0;
  const level = computeLevel(computeXp(totalCorrect, conceptsMastered));
  const streak = dashboard.data?.currentStreak ?? 0;
  const practicedToday = dashboard.data?.practicedToday ?? false;

  const navItems = user?.role === "admin" ? [...NAV_ITEMS, { view: "admin" as View, label: "Admin" }] : NAV_ITEMS;

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-10 bg-ink text-paper">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-6">
            <span className="font-serif text-lg font-semibold tracking-tight">English A1</span>
            <nav className="hidden gap-1 sm:flex" aria-label="Main navigation">
              {navItems.map((item) => (
                <NavPill key={item.view} active={view === item.view} onClick={() => onNavigate(item.view)}>
                  {item.label}
                </NavPill>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1 text-gold"
              title={
                practicedToday
                  ? `${streak} day streak — practiced today`
                  : `${streak} day streak — practice today to keep it`
              }
            >
              <FlameIcon className={`h-4 w-4 ${practicedToday ? "" : "opacity-40"}`} />
              <span className="font-mono text-sm font-medium tabular-nums text-paper">{streak}</span>
            </div>
            <LevelBadge level={level.level} size="sm" />
            <button
              type="button"
              onClick={() => void logout()}
              className="text-xs font-medium text-paper/60 transition hover:text-paper"
            >
              Log out
            </button>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-6 pb-2 sm:hidden" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavPill key={item.view} active={view === item.view} onClick={() => onNavigate(item.view)}>
              {item.label}
            </NavPill>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">{children}</main>
    </div>
  );
}

function NavPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-gold text-ink" : "text-paper/70 hover:bg-white/10 hover:text-paper"
      }`}
    >
      {children}
    </button>
  );
}
