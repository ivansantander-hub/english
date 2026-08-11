import { useState } from "react";

import { ConversationPage } from "./features/conversation/ConversationPage.js";
import { DashboardPage } from "./features/dashboard/DashboardPage.js";
import { MistakesPage } from "./features/mistakes/MistakesPage.js";
import { DailyPracticePage } from "./features/practice/DailyPracticePage.js";
import type { PracticeParams } from "./features/practice/practice-params.js";
import { PracticePage } from "./features/practice/PracticePage.js";

type View = "practice" | "dashboard" | "mistakes" | "conversation";

const DEFAULT_PRACTICE_PARAMS: PracticeParams = { mode: "balanced" };

export function App(): React.JSX.Element {
  const [view, setView] = useState<View>("practice");
  const [practiceParams, setPracticeParams] = useState<PracticeParams>(DEFAULT_PRACTICE_PARAMS);

  function startPractice(params: PracticeParams): void {
    setPracticeParams(params);
    setView("practice");
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <header className="mb-10 flex items-baseline justify-between border-b border-stone-200 pb-4">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">English A1</h1>
        <nav className="flex gap-1" aria-label="Main navigation">
          <NavButton
            label="Practice"
            active={view === "practice"}
            onClick={() => startPractice(DEFAULT_PRACTICE_PARAMS)}
          />
          <NavButton
            label="Conversation"
            active={view === "conversation"}
            onClick={() => setView("conversation")}
          />
          <NavButton
            label="Progress"
            active={view === "dashboard"}
            onClick={() => setView("dashboard")}
          />
          <NavButton
            label="Mistakes"
            active={view === "mistakes"}
            onClick={() => setView("mistakes")}
          />
        </nav>
      </header>

      <main>
        {view === "practice" &&
          (practiceParams.mode === "daily" ? (
            <DailyPracticePage key="daily" />
          ) : (
            <PracticePage
              key={`${practiceParams.mode}:${practiceParams.conceptKey ?? ""}`}
              params={practiceParams}
            />
          ))}
        {view === "conversation" && <ConversationPage key="conversation" />}
        {view === "dashboard" && (
          <DashboardPage
            onPracticeWeaknesses={() => startPractice({ mode: "weakness" })}
            onDailyPractice={() => startPractice({ mode: "daily" })}
          />
        )}
        {view === "mistakes" && (
          <MistakesPage
            onPracticeConcept={(conceptKey) => startPractice({ mode: "balanced", conceptKey })}
          />
        )}
      </main>
    </div>
  );
}

function NavButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`rounded px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-stone-900 text-stone-50" : "text-stone-600 hover:bg-stone-200"
      }`}
    >
      {label}
    </button>
  );
}
