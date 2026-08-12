import { useState } from "react";

import { useAuth } from "../features/auth/AuthContext.js";
import { RELEASE_NOTES } from "../lib/release-notes.js";
import { trpc } from "../lib/trpc.js";

import { FlameIcon } from "./FlameIcon.js";
import { AdminIcon, MistakesIcon, PracticeIcon, ProgressIcon, TalkIcon } from "./NavIcons.js";
import { ThemeToggle } from "./ThemeToggle.js";

export type View =
  | "practice"
  | "dashboard"
  | "mistakes"
  | "conversation"
  | "admin"
  | "release-notes";

const APP_VERSION = RELEASE_NOTES[0]?.version ?? "0.0.0";

const NAV_ITEMS: { view: View; label: string; icon: (props: { className?: string }) => React.JSX.Element }[] = [
  { view: "practice", label: "Practice", icon: PracticeIcon },
  { view: "conversation", label: "Talk", icon: TalkIcon },
  { view: "dashboard", label: "Progress", icon: ProgressIcon },
  { view: "mistakes", label: "Mistakes", icon: MistakesIcon },
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

  const navItems = user?.role === "admin"
    ? [...NAV_ITEMS, { view: "admin" as View, label: "Admin", icon: AdminIcon }]
    : NAV_ITEMS;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="sticky top-0 z-20 border-b border-ink/8 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-6 py-3.5">
          <button
            type="button"
            onClick={() => onNavigate("practice")}
            className="-m-1 flex items-center gap-2.5 rounded-lg p-1 transition hover:opacity-80"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-sky font-serif text-sm font-extrabold text-white shadow-sm">
              A1
            </span>
            <span className="font-serif text-lg font-extrabold text-ink">English Line</span>
          </button>

          <div className="flex items-center gap-1.5">
            <div
              className="flex items-center gap-1 px-1"
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
            {user && <AccountMenu email={user.email} onLogout={() => void logout()} />}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">{children}</main>

      <footer className="mx-auto w-full max-w-2xl px-6 pb-24 pt-2 text-center">
        <button
          type="button"
          onClick={() => onNavigate("release-notes")}
          className="font-mono text-xs font-semibold text-ink/40 transition hover:text-ink"
        >
          v{APP_VERSION} · What&rsquo;s new
        </button>
      </footer>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/8 bg-paper/95 backdrop-blur"
        aria-label="Main navigation"
      >
        <div className="mx-auto flex max-w-2xl items-stretch justify-between px-2">
          {navItems.map((item) => (
            <TabButton
              key={item.view}
              active={view === item.view}
              label={item.label}
              icon={item.icon}
              onClick={() => onNavigate(item.view)}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}

function TabButton({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: (props: { className?: string }) => React.JSX.Element;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold transition ${
        active ? "text-sky" : "text-ink/45 hover:text-ink"
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

function AccountMenu({
  email,
  onLogout,
}: {
  email: string;
  onLogout: () => void;
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const initial = email.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Account menu"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-tint text-sm font-bold text-ink transition hover:opacity-80"
      >
        {initial}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 top-10 z-20 w-52 rounded-xl border border-ink/10 bg-surface p-2 shadow-lg">
            <p className="truncate px-2 py-1.5 text-xs text-ink/50">{email}</p>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-sm font-semibold text-berry transition hover:bg-berry-tint"
            >
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
