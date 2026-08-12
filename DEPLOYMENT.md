# Deployment

Hosted on [Railway](https://railway.app), project **english-a1**, environment `production`. Three services:

| Service    | What it runs                                | Notes                                                    |
| ---------- | -------------------------------------------- | --------------------------------------------------------- |
| `web`      | Static build of `apps/web` (Vite)            | Public URL: `https://web-production-81f3a7.up.railway.app` — this is the link to share |
| `api`      | `apps/api` (Node + Express + tRPC)           | `https://api-production-cad5.up.railway.app`, health check at `/health` |
| `postgres` | PostgreSQL with a persistent volume          | —                                                          |

`web` and `api` are both connected to the GitHub repo (`https://github.com/ivansantander-hub/english.git`) and auto-deploy on every push to `main`. There is no GitLab remote — GitHub is the only source of truth.

## Migrations and seeding

The `api` service's `preDeployCommand` runs `prisma migrate deploy && tsx prisma/seed.ts` on every deploy. This means:

- New Prisma migrations committed to `packages/db/prisma/migrations/` apply automatically — no manual migration step.
- The seed script re-runs every deploy. It's idempotent: it upserts grammar concepts, exercises, and one bootstrap admin account, so re-running it doesn't duplicate data or reset progress.

## Admin account

The seed upserts `ivansantander2020@gmail.com` as `role: admin`. On the very first run it generates a random 6-digit PIN and prints it once to the deploy logs (search the `api` service's deployment logs for `Admin PIN:`). Later runs leave the PIN untouched since the row already exists — the PIN is stored only as a bcrypt hash and can't be recovered. To reset it, either update the row directly or delete it so the seed reprints a fresh PIN on the next deploy.

## Gotchas

- Railway's manual "redeploy" can reuse a stale cached build plan even after service config looks updated in the dashboard. If a redeploy doesn't seem to pick up a config change, push a new commit (even an empty one) to force a fresh build plan instead of debugging the cache.
- Commits are authored with `ivan.santander@mail.com` (`git config user.email`) — keep using that identity for this repo.
