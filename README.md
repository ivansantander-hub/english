# English A1

A personal, daily-use English learning app for a Spanish speaker studying Present Simple. Real exercises, AI-backed evaluation with bilingual sentence-by-sentence feedback, a Duolingo-style practice map, and an adaptive engine that tracks weaknesses and picks what to practice next. Deployed on Railway; see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Architecture

Modular monorepo (pnpm workspaces), strict TypeScript throughout.

```
apps/
  web/        React + Vite + Tailwind — practice map, dashboard, conversation, mistakes, admin
  api/        Node + Express + tRPC — the only place Prisma/OpenRouter get touched
packages/
  db/         Prisma schema, migrations, seed data loader
  shared/     Zod schemas + types shared across every package (evaluation result, error taxonomy, exercise types)
  ai/         LLMProvider port + OpenRouterProvider adapter + AIService (evaluation prompts, JSON validation, retry)
  learning/   Pure domain: concept accuracy, weakness detection, selection strategies, daily practice composition
  exercise/   Pure domain: exercise filtering, sentence splitting, seed exercise/concept content
```

The domain (`learning`, `exercise`) has zero dependency on React, Prisma, or OpenRouter — it's plain data in, plain data out, so it's unit-tested without a database or network call. `apps/api` is the composition root that wires everything together and exposes it over tRPC, organized into modules: `auth`, `exercises`, `evaluation`, `progress`, `conversation`, `profile`, `admin`.

### Auth

Email + 6-digit PIN (bcrypt-hashed), open self-registration — anyone can create an account; new accounts default to role `user`. Sessions are opaque server-side tokens with a 90-day sliding expiry (bearer token in the `Authorization` header, not cookies, since web and api live on separate Railway subdomains). 5 failed logins locks an account for 15 minutes. `admin` and `user` have identical app access — the only difference is `admin` also gets an Admin tab showing every user's stats with role-toggle and PIN-reset actions. The seed script bootstraps one admin account on every deploy; see [DEPLOYMENT.md](./DEPLOYMENT.md) for retrieving its PIN.

### Design system

Semantic color tokens (`ink`, `paper`, `surface`, `sky`, `berry`, `gold`, `mint`) defined as CSS custom properties in `apps/web/src/index.css`, mapped in `apps/web/tailwind.config.js`. `sky` (blue) is the primary/brand color, `berry` (red) marks errors and "needs practice", `gold` marks near-mastery, `mint` marks mastery — deliberately not orange/purple, to avoid the generic AI-app look. Dark mode is a real `class`-strategy theme (not just `prefers-color-scheme`): an inline anti-flash script in `index.html` sets the `dark` class on `<html>` before first paint based on saved preference or OS default, and `ThemeToggle` in the header lets you override and persist the choice.

### Versioning

One app-wide version (root `package.json`), semantic (`MAJOR.MINOR.PATCH`): patch = fixes, minor = new capability, major = a structural change to how the app works. Every version bump gets an entry in [`CHANGELOG.md`](./CHANGELOG.md) (English, dev-facing) and a matching bilingual entry in `apps/web/src/lib/release-notes.ts`, which drives the in-app release notes page — reachable by tapping the version number in the footer. Keep both in sync when shipping a versioned change.

### App shell

`AppShell.tsx` treats the app as a mobile-app-like experience at every screen size, not a responsive website: a thin sticky header holds only the brand (click it to go home), streak, theme toggle, and an account menu (avatar → email + Log out); primary navigation lives in a fixed bottom tab bar (`apps/web/src/components/NavIcons.tsx` has the icon set); a footer below page content holds the version link. In-page "back" links (e.g. exiting a practice session) are separate from this and stay on their own pages.

## Requirements

- Node.js 20+
- pnpm 10+ (`corepack enable` if you don't have it)
- PostgreSQL 14+ (local install or Docker)
- An [OpenRouter](https://openrouter.ai/keys) API key (optional — the app grades with exact-match rules if you skip this, and automatically falls back to rules if the AI call fails)
- A [YouTube Data API v3](https://console.cloud.google.com/) key (optional — without it, video recommendations simply don't appear; nothing else is affected). See "How video recommendations work" below for how to get one.

## Setup

```bash
pnpm install
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/english_a1?schema=public"
OPENROUTER_API_KEY="sk-or-..."          # optional
LLM_MODEL="meta-llama/llama-3.1-8b-instruct"  # bootstrap default only — see "How AI model selection works"
YOUTUBE_API_KEY=""                      # optional — see "How video recommendations work"
```

### Database

**Option A — you already have Postgres running locally.** Just point `DATABASE_URL` at it (password `postgres`/`admin` or whatever you use) and skip to migrations below. Note: if a native Postgres install is already listening on port 5432, `docker compose` will start a _second_, unused Postgres — check `docker ps` / `Get-NetTCPConnection -LocalPort 5432` (Windows) if you're unsure which one your app is actually talking to.

**Option B — no local Postgres.**

```bash
docker compose up -d
```

This starts Postgres 16 on `localhost:5432` with user/password `postgres`/`postgres`, database `english_a1` — matching the `.env.example` default.

### Migrate + seed

```bash
pnpm db:migrate   # creates schema, runs the seed automatically
pnpm db:seed      # re-run any time to re-seed without a fresh migration
```

The seed creates ~17 concepts and 135+ Present Simple exercises (translation, fill-blank, correct-the-sentence, paragraph translation), plus one bootstrap admin account — see [DEPLOYMENT.md](./DEPLOYMENT.md#admin-account) for how its PIN is generated and retrieved. Everyone else registers themselves from the login screen.

### Run it

```bash
pnpm dev:api   # http://localhost:4000
pnpm dev:web   # http://localhost:5173
```

Open http://localhost:5173 and register an account (or log in as the seeded admin).

## Scripts

| Command                             | What it does                                                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `pnpm lint` / `pnpm lint:fix`       | ESLint across the whole workspace                                                                                        |
| `pnpm format` / `pnpm format:check` | Prettier                                                                                                                 |
| `pnpm typecheck`                    | `tsc --noEmit` in every package                                                                                          |
| `pnpm test`                         | Vitest in every package (includes one Postgres-backed integration test in `apps/api` — needs a reachable `DATABASE_URL`) |
| `pnpm build`                        | Compiles every package + builds the web bundle                                                                           |
| `pnpm db:migrate`                   | Prisma migration (dev)                                                                                                   |
| `pnpm db:seed`                      | Re-run the seed                                                                                                          |
| `pnpm db:studio`                    | Prisma Studio                                                                                                            |

## How evaluation works

1. `evaluation.submitAnswer` loads the exercise's reference answer.
2. If `OPENROUTER_API_KEY` is set, it calls the configured model, asking for structured JSON scored sentence-by-sentence (valid paraphrases score full marks; only real grammar/vocabulary/meaning errors count against you; "naturalness" notes never reduce score). Every error comes back with both an English and a Spanish explanation (`explanation` / `explanationEs`).
3. The response is validated against a Zod schema. Malformed JSON gets one retry with a stricter instruction; if it still fails, the app **falls back to rule-based exact-match grading** rather than erroring — every submission gets a result. Which grading path was used is recorded on the attempt as `gradedBy: "ai" | "rules"`, since the two aren't comparably strict and should be distinguished in any later analysis.
4. Every AI call (success or failure) is logged to the `LLMRequest` table with the user, latency, token usage, and error message, for auditing cost/quality/failure patterns per user later.
5. `UserConceptProgress` is updated per concept targeted by the exercise, which feeds the adaptive engine (`packages/learning`): concepts under 60% accuracy are "high priority," 60–80% "medium," 80–90% "review," 90%+ "maintenance." Weakness/Balanced/NewConcept/Review are separate `SelectionStrategy` implementations composed into the 15-exercise daily practice session (5 review-weak / 5 normal / 3 new-concept / 2 writing).

## How practice analysis works

On-demand (Profile page, "Analyze my practice"), not automatic. `ProfileAnalysisService.generateAnalysis` aggregates per-concept accuracy/priority (reusing `getConceptProgress`), a type-level breakdown of recent errors (`aggregateErrors` from `packages/learning`, collapsed from type+category to type), which topics get skipped, and a sample of ~15 recent real errors with their explanations — never raw answers — into one JSON payload sent to the model. Same discipline as evaluation: structured output validated against a Zod schema, one retry with a stricter instruction, and a deterministic fallback (lowest-accuracy concepts via `detectWeaknesses`, no narrative) if no provider is configured or the AI call fails, so there's always a result. Every run is persisted (`ProfileAnalysis` + `ProfileAnalysisFocusArea`), never overwritten, so the Profile page shows full history.

## How AI model selection and cost tracking works

The model each AI feature (evaluation, conversation, practice analysis) uses is **not** fixed at deploy time. `LLM_MODEL`/`EVALUATION_MODEL`/`CONVERSATION_MODEL`/`ANALYSIS_MODEL` env vars are only the bootstrap default, read once if no `AISettings` row exists yet. From then on, `AISettingsService` (`apps/api/src/modules/admin/ai-settings-service.ts`) is the source of truth — editable from the Admin panel, takes effect on the very next AI call, no redeploy. The Admin picker is populated from OpenRouter's real model catalog (`packages/ai/src/services/model-catalog.ts`, cached in memory for an hour, bounded by a 5s timeout so a slow catalog fetch never blocks a real request), filtered to models that accept text input and return text-only output, sorted cheapest-first with live per-model pricing shown.

Cost (`LLMRequest.costUsd`) is computed once, at log time, from that same catalog — never recomputed later, so historical numbers don't drift if OpenRouter reprices a model. All three AI features share one logger (`apps/api/src/lib/llm-usage.ts`) instead of each keeping its own copy. The Admin panel's "AI usage" section surfaces all of this: total spend, a breakdown by feature and by model, and the last 50 requests.

**Known gap**: conversation (Talk) calls stream token-by-token and never obtain a token-usage count from OpenRouter, so their `costUsd` is always `null` — cost tracking is currently accurate for evaluation and practice analysis only.

## How video recommendations work

When a Practice answer has an error, or a Profile analysis flags a focus area, the app can surface real YouTube lesson videos about that exact topic — embedded, playable without leaving the app. This requires a `YOUTUBE_API_KEY`; without one the feature is silently absent, same as `OPENROUTER_API_KEY`.

**Getting a key** (free, takes a couple of minutes):

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) and create or select a project.
2. Search "YouTube Data API v3" in the API library and enable it.
3. Go to Credentials → Create Credentials → API key. Optionally restrict it to just that API.
4. Add it to your local `.env` as `YOUTUBE_API_KEY=...`, and to the `api` service's variables in Railway for production.

**How it works**: `VideoRecommendationService.getVideosFor(topicType, topicKey, language)` (`apps/api/src/modules/videos/video-recommendation-service.ts`) looks up a shared `RecommendedVideo` cache keyed by topic *and* language — `topicType` is `"concept"` (keyed by the real `Concept.key`) or `"error_type"` (keyed by an `ErrorType` value); `language` is `"es"` or `"en"`. On a cache miss or after 30 days, it calls the real YouTube search API (`youtube-client.ts`) and caches up to 3 results per (topic, language) pair, preferring known channels for that language without being limited to them — English-taught: BBC Learning English, English with Lucy, JenniferESL, EnglishClass101, VOA Learning English, lingoni ENGLISH; Spanish-taught: Profesor Diego, Francisco Ochoa, Mr. Salas. The cache is shared across all users — a topic's best lesson in a given language doesn't depend on who's asking — so a real search happens at most once per (topic, language) per month, well inside YouTube's free daily quota.

**Language resolution** (`apps/api/src/modules/videos/router.ts`): `User.videoLanguagePreference` is `"auto"` by default. Auto resolves from `User.currentLevel` — A1/A2 gets Spanish-taught lessons (comprehensible for a real beginner), everything else gets English-taught. Setting the preference explicitly to `"es"` or `"en"` (Profile → Settings) overrides the level-based guess.

The AI's practice analysis (`profile-analysis-service.ts`) is prompted to return a `topicKey` copied exactly from the concept keys it's given, never invented — this is what makes the lookup reliable instead of guessing from the AI's free-text display name.

**Resuming and progress**: every recommendation returned to a user is enriched with that user's own `VideoWatchEvent` (watched seconds, completed) for it, so the embedded player (`apps/web/src/components/VideoPlayer.tsx`) opens at the last watched position via the YouTube IFrame API's `start` player var — wherever the video appears (Practice, Profile, or Watch history). Watch history is split into "in progress" and "completed" and every row replays inline from where it left off.

Watch time is tracked precisely via the YouTube IFrame Player API (`apps/web/src/components/VideoPlayer.tsx`), polled every 5 seconds while playing, saved as a `VideoWatchEvent` per (user, video) pair using a max-value upsert — rewatching a portion never decreases the recorded time, and `completed` is sticky once true. Two independent toggles (Profile → Settings) let a user turn recommendations off in Practice and/or in Profile.

## Data model, for analysis

Every attempt is captured at sentence and error granularity — `ExerciseAttempt` → `SentenceResult` → `Error` (typed via the `ErrorType` enum: `grammar`, `verb_tense`, `word_order`, `preposition`, `article`, ...) — so patterns in what a user gets wrong can be queried directly instead of re-derived. `Error.type` is the reliable dimension to group by; `Error.category` is a free-form snake_case label the model generates per error and isn't normalized, so treat it as detail text, not a bucket to aggregate on. `User.currentLevel` (CEFR) already drives exercise selection, ready for A2+ content whenever it's seeded — today everything is A1.

Exercises a user skips instead of answering are captured separately in `ExerciseSkip` (not `ExerciseAttempt` — a skip isn't an attempt and doesn't touch `UserConceptProgress`), so skip counts don't dilute accuracy stats but are still queryable per user or per exercise. Totals show on the Dashboard (your own) and Admin (everyone's); a per-type/per-topic breakdown isn't built yet but is directly queryable via `ExerciseSkip.exercise.type`/`grammarTopic`.

## Known simplifications (documented, not accidental)

- **Concept progress is exercise-level, not sentence-level.** An exercise's target concepts all get credited/debited together based on whether the _whole_ answer was correct, since seed content doesn't yet tag individual sentences with concepts. Also means a single error can't be attributed to one specific concept when an exercise targets several.
- **Recurring mistakes ranking uses concept accuracy**, not raw AI-generated error-category strings — those are free-form text from the model and don't carry a reliable attempt denominator. (`aggregateErrors` in `packages/learning` is still available for a raw error-type breakdown if useful later.)
- **`gradedBy` and `LLMRequest.userId` are null on attempts/requests recorded before those columns existed** (added 2026-08-12) — historical rows predate the field rather than having a guessed value.
