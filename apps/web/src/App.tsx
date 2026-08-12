import { useState } from "react";

import { AppShell } from "./components/AppShell.js";
import type { View } from "./components/AppShell.js";
import { AdminPage } from "./features/admin/AdminPage.js";
import { useAuth } from "./features/auth/AuthContext.js";
import { LoginPage } from "./features/auth/LoginPage.js";
import { ConversationPage } from "./features/conversation/ConversationPage.js";
import { DashboardPage } from "./features/dashboard/DashboardPage.js";
import { MistakesPage } from "./features/mistakes/MistakesPage.js";
import { DailyPracticePage } from "./features/practice/DailyPracticePage.js";
import type { PracticeParams } from "./features/practice/practice-params.js";
import { PracticePage } from "./features/practice/PracticePage.js";

const DEFAULT_PRACTICE_PARAMS: PracticeParams = { mode: "balanced" };

export function App(): React.JSX.Element {
  const { user, isLoading } = useAuth();
  const [view, setView] = useState<View>("practice");
  const [practiceParams, setPracticeParams] = useState<PracticeParams>(DEFAULT_PRACTICE_PARAMS);

  function startPractice(params: PracticeParams): void {
    setPracticeParams(params);
    setView("practice");
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="text-ink/50">Loading…</p>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <AppShell view={view} onNavigate={setView}>
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
      {view === "admin" && user.role === "admin" && <AdminPage key="admin" />}
    </AppShell>
  );
}
