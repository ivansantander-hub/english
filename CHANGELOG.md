# Changelog

All notable changes to English A1 are documented here, following [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH): patch = fixes, minor = new capability, major = a structural change to how the app works. The in-app "What's new" page (tap the version number in the header) shows a bilingual, learner-facing version of these same entries.

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
