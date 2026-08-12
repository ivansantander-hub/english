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
import { PracticeMapPage } from "./features/practice/PracticeMapPage.js";
import { PracticePage } from "./features/practice/PracticePage.js";

export function App(): React.JSX.Element {
  const { user, isLoading } = useAuth();
  const [view, setView] = useState<View>("practice");
  const [practiceParams, setPracticeParams] = useState<PracticeParams | null>(null);

  function startPractice(params: PracticeParams): void {
    setPracticeParams(params);
    setView("practice");
  }

  function handleNavigate(next: View): void {
    if (next === "practice") setPracticeParams(null);
    setView(next);
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
    <AppShell view={view} onNavigate={handleNavigate}>
      {view === "practice" &&
        (practiceParams === null ? (
          <PracticeMapPage
            key="map"
            onStartConcept={(conceptKey) => startPractice({ mode: "balanced", conceptKey })}
            onStartDaily={() => startPractice({ mode: "daily" })}
          />
        ) : practiceParams.mode === "daily" ? (
          <DailyPracticePage key="daily" onExit={() => setPracticeParams(null)} />
        ) : (
          <PracticePage
            key={`${practiceParams.mode}:${practiceParams.conceptKey ?? ""}`}
            params={practiceParams}
            onExit={() => setPracticeParams(null)}
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
