# English A1

A personal, daily-use English learning app focused on Present Simple for Spanish speakers. Real exercises, AI-backed evaluation with sentence-by-sentence feedback, and an adaptive engine that tracks your weaknesses and picks what to practice next.

## Architecture

Modular monorepo (pnpm workspaces), strict TypeScript throughout.

```
apps/
  web/        React + Vite + Tailwind — practice UI, dashboard, mistakes page
  api/        Node + Express + tRPC — the only place Prisma/OpenRouter get touched
packages/
  db/         Prisma schema, migrations, seed data loader
  shared/     Zod schemas + types shared across every package (evaluation result, error taxonomy, exercise types)
  ai/         LLMProvider port + OpenRouterProvider adapter + AIService (evaluation prompts, JSON validation, retry)
  learning/   Pure domain: concept accuracy, weakness detection, selection strategies, daily practice composition
  exercise/   Pure domain: exercise filtering, sentence splitting, seed exercise/concept content
```

The domain (`learning`, `exercise`) has zero dependency on React, Prisma, or OpenRouter — it's plain data in, plain data out, so it's unit-tested without a database or network call. `apps/api` is the composition root that wires everything together and exposes it over tRPC.

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

The seed creates a single local user (this is a single-user personal app — no auth yet), ~17 concepts, and 135+ Present Simple exercises (translation, fill-blank, correct-the-sentence, paragraph translation).

### Run it

```bash
pnpm dev:api   # http://localhost:4000
pnpm dev:web   # http://localhost:5173
```

Open http://localhost:5173.

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
2. If `OPENROUTER_API_KEY` is set, it calls the configured model, asking for structured JSON scored sentence-by-sentence (valid paraphrases score full marks; only real grammar/vocabulary/meaning errors count against you; "naturalness" notes never reduce score).
3. The response is validated against a Zod schema. Malformed JSON gets one retry with a stricter instruction; if it still fails, the app **falls back to rule-based exact-match grading** rather than erroring — every submission gets a result.
4. Every AI call (success or failure) is logged to the `LLMRequest` table with latency, token usage, and error message, for debugging cost/quality later.
5. `UserConceptProgress` is updated per concept targeted by the exercise, which feeds the adaptive engine (`packages/learning`): concepts under 60% accuracy are "high priority," 60–80% "medium," 80–90% "review," 90%+ "maintenance." Weakness/Balanced/NewConcept/Review are separate `SelectionStrategy` implementations composed into the 15-exercise daily practice session (5 review-weak / 5 normal / 3 new-concept / 2 writing).

## Known simplifications (documented, not accidental)

- **Single user, no auth.** The seed creates one user; the API resolves "current user" to that row. Fine for a personal app; would need real auth before multi-user.
- **Concept progress is exercise-level, not sentence-level.** An exercise's target concepts all get credited/debited together based on whether the _whole_ answer was correct, since seed content doesn't yet tag individual sentences with concepts.
- **Recurring mistakes ranking uses concept accuracy**, not raw AI-generated error-category strings — those are free-form text from the model and don't carry a reliable attempt denominator. (`aggregateErrors` in `packages/learning` is still available for a raw error-type breakdown if useful later.)
