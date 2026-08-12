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

The domain (`learning`, `exercise`) has zero dependency on React, Prisma, or OpenRouter — it's plain data in, plain data out, so it's unit-tested without a database or network call. `apps/api` is the composition root that wires everything together and exposes it over tRPC, organized into modules: `auth`, `exercises`, `evaluation`, `progress`, `conversation`, `admin`.

### Auth

Email + 6-digit PIN (bcrypt-hashed), open self-registration — anyone can create an account; new accounts default to role `user`. Sessions are opaque server-side tokens with a 90-day sliding expiry (bearer token in the `Authorization` header, not cookies, since web and api live on separate Railway subdomains). 5 failed logins locks an account for 15 minutes. `admin` and `user` have identical app access — the only difference is `admin` also gets an Admin tab showing every user's stats with role-toggle and PIN-reset actions. The seed script bootstraps one admin account on every deploy; see [DEPLOYMENT.md](./DEPLOYMENT.md) for retrieving its PIN.

### Design system

Semantic color tokens (`ink`, `paper`, `surface`, `sky`, `berry`, `gold`, `mint`) defined as CSS custom properties in `apps/web/src/index.css`, mapped in `apps/web/tailwind.config.js`. `sky` (blue) is the primary/brand color, `berry` (red) marks errors and "needs practice", `gold` marks near-mastery, `mint` marks mastery — deliberately not orange/purple, to avoid the generic AI-app look. Dark mode is a real `class`-strategy theme (not just `prefers-color-scheme`): an inline anti-flash script in `index.html` sets the `dark` class on `<html>` before first paint based on saved preference or OS default, and `ThemeToggle` in the header lets you override and persist the choice.

### Versioning

One app-wide version (root `package.json`), semantic (`MAJOR.MINOR.PATCH`): patch = fixes, minor = new capability, major = a structural change to how the app works. Every version bump gets an entry in [`CHANGELOG.md`](./CHANGELOG.md) (English, dev-facing) and a matching bilingual entry in `apps/web/src/lib/release-notes.ts`, which drives the in-app release notes page — reachable by tapping the version number in the header. Keep both in sync when shipping a versioned change.

## Requirements

- Node.js 20+
- pnpm 10+ (`corepack enable` if you don't have it)
- PostgreSQL 14+ (local install or Docker)
- An [OpenRouter](https://openrouter.ai/keys) API key (optional — the app grades with exact-match rules if you skip this, and automatically falls back to rules if the AI call fails)

## Setup

```bash
pnpm install
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/english_a1?schema=public"
OPENROUTER_API_KEY="sk-or-..."          # optional
LLM_MODEL="meta-llama/llama-3.1-8b-instruct"  # cheap default, override freely
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

## Data model, for analysis

Every attempt is captured at sentence and error granularity — `ExerciseAttempt` → `SentenceResult` → `Error` (typed via the `ErrorType` enum: `grammar`, `verb_tense`, `word_order`, `preposition`, `article`, ...) — so patterns in what a user gets wrong can be queried directly instead of re-derived. `Error.type` is the reliable dimension to group by; `Error.category` is a free-form snake_case label the model generates per error and isn't normalized, so treat it as detail text, not a bucket to aggregate on. `User.currentLevel` (CEFR) already drives exercise selection, ready for A2+ content whenever it's seeded — today everything is A1.

Exercises a user skips instead of answering are captured separately in `ExerciseSkip` (not `ExerciseAttempt` — a skip isn't an attempt and doesn't touch `UserConceptProgress`), so skip counts don't dilute accuracy stats but are still queryable per user or per exercise. Totals show on the Dashboard (your own) and Admin (everyone's); a per-type/per-topic breakdown isn't built yet but is directly queryable via `ExerciseSkip.exercise.type`/`grammarTopic`.

## Known simplifications (documented, not accidental)

- **Concept progress is exercise-level, not sentence-level.** An exercise's target concepts all get credited/debited together based on whether the _whole_ answer was correct, since seed content doesn't yet tag individual sentences with concepts. Also means a single error can't be attributed to one specific concept when an exercise targets several.
- **Recurring mistakes ranking uses concept accuracy**, not raw AI-generated error-category strings — those are free-form text from the model and don't carry a reliable attempt denominator. (`aggregateErrors` in `packages/learning` is still available for a raw error-type breakdown if useful later.)
- **`gradedBy` and `LLMRequest.userId` are null on attempts/requests recorded before those columns existed** (added 2026-08-12) — historical rows predate the field rather than having a guessed value.
