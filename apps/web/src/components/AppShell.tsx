import { useAuth } from "../features/auth/AuthContext.js";
import { trpc } from "../lib/trpc.js";

import { FlameIcon } from "./FlameIcon.js";
import { ThemeToggle } from "./ThemeToggle.js";

export type View = "practice" | "dashboard" | "mistakes" | "conversation" | "admin";

const NAV_ITEMS: { view: View; label: string }[] = [
  { view: "practice", label: "Practice" },
  { view: "conversation", label: "Talk" },
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

  const streak = dashboard.data?.currentStreak ?? 0;
  const practicedToday = dashboard.data?.practicedToday ?? false;

  const navItems = user?.role === "admin" ? [...NAV_ITEMS, { view: "admin" as View, label: "Admin" }] : NAV_ITEMS;

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-10 border-b border-ink/8 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3.5 px-6 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky font-serif text-sm font-extrabold text-white shadow-sm">
            A1
          </div>
          <span className="font-serif text-lg font-extrabold">English Line</span>

          <nav className="ml-auto hidden gap-0.5 sm:flex" aria-label="Main navigation">
            {navItems.map((item) => (
              <NavPill key={item.view} active={view === item.view} onClick={() => onNavigate(item.view)}>
                {item.label}
              </NavPill>
            ))}
          </nav>

          <div
            className="ml-auto flex items-center gap-1 sm:ml-3"
            title={
              practicedToday
                ? `${streak} day streak — practiced today`
                : `${streak} day streak — practice today to keep it`
            }
          >
            <FlameIcon className={`h-4 w-4 ${practicedToday ? "text-sky" : "text-ink/25"}`} />
            <span className="font-mono text-sm font-semibold tabular-nums text-ink">{streak}</span>
          </div>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => void logout()}
            className="text-xs font-semibold text-ink/50 transition hover:text-ink"
          >
            Log out
          </button>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-6 pb-3 sm:hidden" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavPill key={item.view} active={view === item.view} onClick={() => onNavigate(item.view)}>
              {item.label}
            </NavPill>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">{children}</main>
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
      className={`shrink-0 rounded-xl px-3.5 py-2 text-sm font-bold transition ${
        active ? "bg-sky-tint text-ink" : "text-ink/55 hover:bg-sky-tint/60 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
