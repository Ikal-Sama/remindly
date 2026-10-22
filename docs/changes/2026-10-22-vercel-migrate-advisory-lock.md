# 2026-10-22 — Vercel deploy failed with `P1002` (migration advisory lock)

## Symptom

The production deployment of `main` failed while applying migrations:

```
> prisma migrate deploy
Datasource "db": PostgreSQL database "task-reminder-db", schema "public" at
  "ep-nameless-base-b4so6u9u-pooler.c-6.us-east-2.aws.neon.tech"
Error: P1002
The database server was reached but timed out.
Timed out trying to acquire a postgres advisory lock (SELECT pg_advisory_lock(72707369)).
Timeout: 10000ms.
Error: [BUILD_UTILS_SPAWN_1] Command "npm run db:migrate && next build && npm run db:seed" exited with 1
```

Because the build failed, the deployment never went out — which is also why
the analytics fix from PR #17 was not visible on the production site.

## Root cause

Two independent problems combined.

### 1. Migrations ran through the Neon connection pooler

`DATABASE_URL` points at the pooled endpoint
(`ep-xxx-pooler.<region>.<provider>`, PgBouncer in transaction mode).
Prisma Migrate takes a Postgres **session** advisory lock
(`SELECT pg_advisory_lock(72707369)`) before applying migrations.

A transaction-mode pooler cannot hold a session-level lock: the statement is
handed to whichever backend connection happens to be free, the lock stays
attached to that backend after the pooled session is returned to the pool,
and the next migration that lands on the same backend waits for a lock nobody
will ever release. Neon requires migrations to run over the **direct**
endpoint; the runtime client keeps using the pooled one.

### 2. Concurrent deployments raced for the lock

The pull-request preview build and the production build both run
`npm run db:migrate` against the same database. They overlap, so the second
one waits for the lock, Prisma's schema engine gives up after 10 seconds and
the whole deployment fails. Prisma's lock timeout is not configurable, and
the failing step ran before `next build`, so nothing was ever deployed.

## Changes

| File | Change |
| --- | --- |
| `prisma/direct-url.ts` | New. Resolves the direct (non-pooled) URL from `DATABASE_URL` by stripping `-pooler.` from the host, or from `DIRECT_DATABASE_URL` when set. |
| `prisma.config.ts` | The Prisma CLI datasource URL now uses `resolveMigrationUrl()`. |
| `prisma/migrate-deploy.ts` | New. Runs `prisma migrate deploy` and retries when the output shows lock contention (`P1002` / `advisory lock`), up to 6 attempts 10 s apart. Any other failure is reported immediately. |
| `package.json` | `db:migrate` now runs `tsx prisma/migrate-deploy.ts`. |
| `.env.example` | Documents the optional `DIRECT_DATABASE_URL`. |
| `AGENT.md` | Records both rules under *Migrations* and *Environment*. |

## Verification

Against the real Neon database (same credentials as production):

1. `npx prisma migrate status` now reports the **direct** host
   (`ep-nameless-base-b4so6u9u.c-6.us-east-2.aws.neon.tech`, no `-pooler.`)
   and "Database schema is up to date!".
2. `npm run db:migrate` → exit 0, "No pending migrations to apply."
3. **Retry path**: with the advisory lock held by another session for 35 s,
   `npm run db:migrate` printed `Error: P1002 … Timed out trying to acquire a
   postgres advisory lock`, logged `could not acquire the migration lock
   (attempt 1/6) … retrying in 10s`, and finished with exit 0 and
   "No pending migrations to apply." once the lock was released.

## Notes / not done

- Preview deployments still migrate the production database. That is a
  pre-existing decision (the preview needs a current schema) and is left
  alone, but it means every pull request can mutate production. Worth
  revisiting with a separate preview database.
- `npm run db:seed` still runs after `next build`. It is idempotent
  (`SubscriptionPlan` upsert) and was left untouched.
