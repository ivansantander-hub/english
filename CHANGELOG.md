# Changelog

All notable changes to English A1 are documented here, following [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH): patch = fixes, minor = new capability, major = a structural change to how the app works. The in-app "What's new" page (tap the version number in the footer) shows a bilingual, learner-facing version of these same entries.

## [1.4.0] - 2026-08-12

### Added

- **Real YouTube video recommendations, tied to your actual mistakes**: when a practice answer has an error, or when a Profile analysis flags a focus area, you now get real English-lesson videos to watch about exactly that topic — right there, embedded, without leaving the app. Sourced live from the YouTube Data API (never invented links), preferring established teaching channels (BBC Learning English, English with Lucy, JenniferESL, EnglishClass101, VOA Learning English, lingoni ENGLISH) when relevant, but not limited to them. Results are cached per topic for 30 days so the same lesson isn't re-fetched constantly.
- Watch time is tracked precisely via the YouTube player itself (polled every 5s while playing) and saved per video — Profile now has a Watch history section showing what you watched, for how long, and whether you finished it.
- Two independent toggles in Profile → Settings let you turn these recommendations off in Practice and/or in Profile separately.
- Requires a `YOUTUBE_API_KEY` to actually fetch videos (see README) — without one, the app behaves exactly as before, nothing breaks.
- The AI's Profile analysis now returns a stable `topicKey` alongside each focus area's display name, so recommendations can be looked up reliably instead of guessing from free text.

## [1.3.0] - 2026-08-12

### Added

- **AI usage and cost, visible in Admin**: every `LLMRequest` row now gets a real `costUsd`, computed at log time from OpenRouter's live per-model pricing (never recomputed later, so historical numbers don't drift if pricing changes). The Admin panel shows total cost, request count, success rate, and a breakdown by feature and by model, plus the last 50 requests (who, what feature, which model, tokens, cost, latency, success/failure) — everything already being logged, finally visible.
- **Real model control from Admin, not just an env var**: a new `AISettings` row (default model + optional per-feature overrides for evaluation/Talk/Profile analysis) is editable from the Admin panel and takes effect immediately — no redeploy. The picker is populated from OpenRouter's real model catalog, sorted cheapest-first with live pricing shown per option, so a bad choice is visible before saving. `LLM_MODEL`/`EVALUATION_MODEL`/`CONVERSATION_MODEL`/`ANALYSIS_MODEL` env vars still work as the bootstrap default until the first time an admin saves a setting.
- A bad model choice degrades the same way an OpenRouter outage already does — evaluation falls back to rule-based grading, Profile analysis falls back to its deterministic summary. No new failure mode.

### Changed

- The three AI-backed features (evaluation, conversation, practice analysis) now share one audit-logging function instead of three near-identical copies.

## [1.2.0] - 2026-08-12

### Added

- **Profile page** (opened from the account menu): an on-demand, AI-generated analysis of your practice history. Aggregates per-concept accuracy/priority, a breakdown of recent error types, which topics you skip, and a sample of recent real errors — sends only that summary to the model, never raw answers — and asks for a structured, bilingual result: 1-3 strengths, 2-3 focus areas each with a *why* grounded in your real numbers and a concrete *how*, plus a short summary.
- Every analysis is saved with a timestamp, not overwritten — the Profile page shows the full history, newest first.
- If no AI provider is configured or the AI call fails, falls back to a deterministic analysis (your lowest-accuracy concepts, plainly stated, no narrative) so you always get something back — same philosophy as exercise grading's rule-based fallback. Marked `gradedBy: "rules"` so it's distinguishable in the data from a real AI analysis.
- New `analysis` request type in the `LLMRequest` audit log, same cost/latency/failure tracking as evaluation and conversation calls.

## [1.1.3] - 2026-08-12

### Fixed

- The 1.1.2 fix covered switching tabs inside the app, but switching to a different *browser* tab and back still reset Practice — caused by React Query's default `refetchOnWindowFocus`, which silently refetches every active query (including the not-idempotent `exercise.getNext`, which always picks anew) whenever the browser tab regains focus. Disabled globally: this is a single learner's personal app, not a multi-actor dashboard, so nothing changes server-side while the tab is unfocused — refetching on focus only risked discarding in-progress state.

## [1.1.2] - 2026-08-12

### Fixed

- Switching tabs (Talk, Progress, Mistakes) and coming back to Practice used to show a brand-new random exercise, discarding whatever you were working on — navigating to Practice unconditionally reset back to the map, and the whole Practice view unmounted whenever you left it, so even your draft answer was lost. The Practice view now stays alive in the background: your current exercise, draft answer, and (for daily practice) your position and XP all survive switching tabs. Only finishing an exercise or explicitly skipping it moves you to the next one.
- Skipping an exercise now also clears the answer box, instead of carrying the old draft over to the next question.

## [1.1.1] - 2026-08-12

### Changed

- Rebuilt the app shell: the header was cramped (logo, version link, 5 nav tabs, streak, theme toggle, and a bare "Log out" link all fighting for one row). Navigation moved to a fixed bottom tab bar (present at every screen size, not just mobile) with icon + label per destination. The header now holds only the brand (which finally links home), streak, theme toggle, and a proper account menu (avatar → email + Log out). The version link moved to a new footer.

## [1.1.0] - 2026-08-12

### Added

- Skip the current exercise in Practice without answering it. Skips are audited per user (`ExerciseSkip`) for later pattern analysis, and a just-skipped exercise no longer immediately resurfaces as "next".
- Skip counts are now visible on the Dashboard (your own total) and the Admin panel (every user's total).
- This release notes page, linked from the version number in the header.

## [1.0.0] - 2026-08-12

Retroactive baseline — the point formal version tracking starts. Summarizes everything shipped before it:

### Added

- Core learning loop: translation/fill-blank/correct-the-sentence/paragraph exercises, AI-backed sentence-by-sentence evaluation with a rule-based fallback, bilingual (English/Spanish) error explanations.
- Adaptive engine: per-concept accuracy tracking, weakness detection, a Duolingo-style practice map, and a composed daily-practice session.
- Email + PIN authentication with long-lived sessions and admin/user roles; an Admin panel for managing accounts.
- Level-aware exercise selection (`User.currentLevel`), ready for CEFR levels beyond A1 whenever that content exists.
- Visual identity: a light, warm design system (`sky`/`berry`/`gold`/`mint` tokens) with a real class-based dark mode (system-preference default, manual toggle, persisted).
- Database audit trail for pattern analysis: which grading method was used per attempt (`gradedBy`), and which user triggered each AI call (`LLMRequest.userId`).
- Deployed to Railway with automatic migrate-and-seed on every push to `main`.
