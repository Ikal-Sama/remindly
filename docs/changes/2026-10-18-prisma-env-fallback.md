# Change Log — Prisma CLI env fallback

- **Date:** 2026-10-18
- **Branch:** `fix/prisma-env-fallback` (branched from `main`)
- **Type:** Bug fix

---

## 1. Problem

After `npm install` completed, the app was configured via a `.env` file. The
Next.js build succeeded, but **every Prisma CLI command failed**:

```
$ npx prisma migrate status
Failed to load config file "..." as a TypeScript/JavaScript module.
Error: PrismaConfigEnvError: Missing required environment variable: DATABASE_URL
```

Root cause: `prisma.config.ts` loaded exactly one path.

```ts
config({ path: ".env.local" });
```

The documented setup in `.gitignore` and `AGENT.md` §4 is
`.env.example` → `.env.local`, but a plain `.env` is equally valid for Next.js
and is the more common convention. Because `prisma.config.ts` hardcoded the one
filename, any developer using `.env` had a **silently broken Prisma toolchain** —
`generate`, `migrate`, `db:seed`, and `studio` would all fail.

This also explains why the lockfile could go stale unnoticed: `prisma` commands
were unavailable, so dependency-affecting Prisma changes were easy to miss.

---

## 2. Change

Single file, `prisma.config.ts`:

```diff
-// Load .env.local explicitly
-config({ path: ".env.local" });
+// Load env files explicitly, mirroring the precedence Next.js itself uses:
+// .env.local wins over .env, and earlier paths are never overridden.
+// Passing only ".env.local" broke every Prisma CLI command for anyone whose
+// local env file is named ".env".
+config({ path: [".env.local", ".env"] });
```

### Why an array is the correct fix

`dotenv` (v17, already a dependency) accepts an ordered array of paths. Files
are processed in order and **values from earlier files are never overwritten by
later ones**. This reproduces exactly the precedence Next.js applies at runtime
(`.env.local` > `.env`), so the Prisma CLI and the running app now agree on
which value wins.

The alternative — duplicating `loadEnv` logic, or switching to
`prisma.config.ts` with no dotenv call at all — would have risked the CLI and the
runtime reading *different* values, which is worse than the current bug.

---

## 3. Verification

```
$ npx prisma migrate status
[dotenv@17.2.3] injecting env (20) from .env.local,.env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "task-reminder-app" ...
```

Before: `PrismaConfigEnvError: Missing required environment variable: DATABASE_URL`
— the config never loaded.

After: config loads, **20 env vars injected**, the schema parses, and Prisma
opens a connection to Neon. The command now reaches the database and fails only
on credentials (see below), which is the correct and expected behaviour.

`npx tsc --noEmit` on this branch reports only the one pre-existing
`lib/auth/auth.ts` TS2322 error (expected — this branch is based on `main` and
does not include the Stripe fix from `fix/stripe-api-version`). No new errors
were introduced by this change.

---

## 4. Outstanding: database credentials

Prisma now reaches Neon but is rejected:

```
Error: P1000: Authentication failed against database server, the provided
database credentials for `(not available)` are not valid.
```

The connection string was inspected structurally (without printing the
password) and is well-formed:

| Property      | Value                                          |
| ------------- | ---------------------------------------------- |
| scheme        | `postgresql`                                   |
| host          | `ep-misty-cloud-a1mejbyj-pooler.ap-southeast-1.aws.neon.tech` |
| database      | `task-reminder-app`                            |
| user          | `default`                                      |
| password      | present                                        |
| special chars | none unencoded (no `@ / #`)                    |
| URL-encoded   | no `%XX` sequences present                     |
| `sslmode`     | set                                            |

Because the password contains no characters requiring percent-encoding, this is
**not** a URL-escaping problem. It is an incorrect password, most likely a
rotated Neon credential or a password that was mangled when pasted into `.env`
(e.g. a trailing quote or whitespace).

### To resolve

Recopy the connection string from the Neon console (**Connection Details →
prisma**) and replace `DATABASE_URL` in `.env`. Neon pooled and direct hosts use
the same credentials, so either will work once the password is correct.

This is a local environment issue only — no code change is required, and nothing
is committed to git.

---

## 5. Files changed

| File              | Change                          |
| ----------------- | ------------------------------- |
| `prisma.config.ts` | Loads `.env.local` then `.env`  |

## 6. Follow-up

- **`docs/readme`** — document the `.env` vs `.env.local` convention explicitly
  so the fix is understood rather than merely working.
- Consider adding `npm run db:generate` and `npm run db:migrate` scripts to
  `package.json`; the current scripts cover only `db:seed`.
