# Change Log — Introduce `AGENT.md` agent guidelines

- **Date:** 2026-10-18
- **Branch:** `docs/agent-guidelines`
- **Base:** `main` @ `52c24f2` ("Fix cron job time")
- **Author:** Codex (AI agent), reviewed by project owner
- **Type:** Documentation only — **zero runtime code changed**

---

## 1. Goal

The repository had no agent-facing contribution rules. Every AI or human
contributor was free to invent their own conventions, which in practice led to
inconsistent component structure, duplicated UI, and commits landing on `main`.

Deliver a single authoritative `AGENT.md` that encodes:

1. Write code the way a senior developer would.
2. Analyse before implementing.
3. Reuse existing components; never create a parallel one.
4. Never commit to `main` — branch first, always.
5. Write for performance, not just correctness.
6. Summarise the work and record it in a doc.

---

## 2. What was done

### 2.1 Full codebase analysis (read-only)

Three parallel deep-exploration passes were run across the repository before a
single line was written. Scope covered:

- **`app/`** — App Router routes, Server Actions (`app/action/`), Route
  Handlers (`app/api/`), metadata conventions, auth gating.
- **`components/`** — all 61 files: 28 `ui/` primitives, feature folders
  (`analytics/`, `dashboard/`, `shared/`, `user/`), root-level auth and button
  components, loaders, dev artifacts.
- **`lib/`, `hooks/`, `stores/`, `prisma/`** — auth config, email templates,
  validation schemas, Prisma schema and migrations, Zustand stores, cache
  config, third-party integrations (Stripe, Arcjet, Cloudinary).
- **Config** — `package.json`, `tsconfig.json`, `next.config.ts`,
  `eslint.config.mjs`, `components.json`, `.env.example`, `vercel.json`.

### 2.2 Created `AGENT.md`

A single root-level ruleset, ~330 lines, structured so it is scannable in
under a minute and enforceable line by line:

| Section                     | Content                                                                  |
| --------------------------- | ------------------------------------------------------------------------ |
| **1. Non-negotiable rules** | Branch-first (never `main`), analyse-before-implementing, reuse-first, performance. Each with concrete commands and rationale. |
| **2. Architecture**         | Stack table, directory map, 10-model data model summary, and the traps (no Prisma enums; `UserSubscription` unique constraint; PRO-only task fields). |
| **3. Conventions**          | Server/client split, auth + ownership rules, route handler shape, validation, styling, components, forms, state, migrations. |
| **4. Environment**          | Node/npm, env vars, commands, and an explicit **Definition of Done** checklist. |
| **5. Known debt**           | 18 concrete, verified anti-patterns with file references — framed as "do not copy, do not spread". |
| **6. Agent workflow**       | 9-step loop from branch creation to commit, plus conventional-commit format. |

### 2.3 Branch discipline applied to this task itself

Per the rule being introduced, this work was done on a dedicated branch rather
than on `main`:

```bash
git checkout -b docs/agent-guidelines
```

`main` was left untouched.

---

## 3. Key findings that shaped the guidelines

These are the codebase facts that most directly informed the rules. Each is
cited with a file path so a reviewer can verify.

### 3.1 Auth is enforced in two non-overlapping places

- `proxy.ts` (Next.js 16's renamed `middleware.ts`) only checks for the
  **presence** of the Better Auth session cookie — it cannot reach Prisma at the
  edge. Comment in the file says so explicitly.
- Therefore **every** route handler and Server Action must independently call
  `auth.api.getSession({ headers: await headers() })` *and* scope the query by
  `userId`. 20+ call sites do this correctly; the rule now makes it mandatory
  rather than folklore.
- **Gap:** `/task` is absent from `PROTECTED_ROUTES` in `proxy.ts` and relies
  solely on a client-side check.

### 3.2 Reuse is currently the weakest area — hence the strict rule

Verified duplication found:

- `action-button.tsx` vs `action-button-simple.tsx` — the first is a strict
  superset; ~120 lines of inline provider SVG duplicated.
- `dashboard-header.tsx` vs `dashboard-layout.tsx` — byte-identical header JSX.
- `dashboard-stats.tsx` vs `analytics-summary.tsx` vs an inline third copy in
  `analytics-dashboard.tsx` — the same 4-card KPI grid.
- `pricing-cards.tsx` vs `subs-plan.tsx` — same Free/Pro card markup.
- The "PRO" gradient pill class string appears verbatim in two files; it should
  be a `badgeVariants` entry.
- The calendar date-picker trigger appears **6 times** across
  `user/task/create.tsx` and `user/task/edit.tsx`.
- UTC-midnight date normalisation is copy-pasted in the same two files.
- The `isPro` subscription lookup is inlined in **three** places.
- Four different spinners exist: `<Spinner/>`, `<LoadingSwap/>`, hand-rolled
  `<Loader2>` in `action-button.tsx`, `animate-pulse` divs.
- Two form systems coexist: `ui/form.tsx` (RHF) and `ui/field.tsx`, mixed
  together in `login-form.tsx` and `register-form.tsx`.

### 3.3 Layering violations

`components/ui/category-selector.tsx` and `components/ui/label-selector.tsx`
call `/api/categories` and `/api/labels` from inside the `ui/` folder, which is
reserved for domain-agnostic shadcn primitives. Rule §3 now states the boundary
explicitly.

### 3.4 Data-model traps

- The Prisma schema declares **zero enums**. Plan name, subscription status, and
  notification type are plain `String`s — string comparisons are error-prone
  and the guidelines call this out.
- `UserSubscription` has `@@unique([userId, status])`.
- PRO-only task fields (`reminderDate`, `categoryId`, labels) are nulled on
  write by `createTaskAction` and `updateTask`. Any *new* task mutation must
  replicate that gating — now written down.

### 3.5 Two independent analytics pipelines

`hooks/use-dashboard-data.ts` and `stores/analytics-store.ts` both fetch
`/api/analytics` with their own separate caching (a hand-rolled 5-minute TTL vs
none). They can silently drift. Documented as known debt rather than fixed here.

### 3.6 Correct-but-unused infrastructure

- `lib/cache-config.ts` is **documentation only** — it configures nothing.
- `components/ui/error-boundary.tsx` and `page-error-boundary.tsx` are
  implemented but imported nowhere.
- `action-button-demo.tsx` and `action-button-usage.md` are dev artifacts
  shipped inside `components/`.

---

## 4. Files changed

| File | Change | Lines |
| ---- | ------ | ----- |
| `AGENT.md` | **created** | ~330 |
| `docs/changes/2026-10-18-agent-guidelines.md` | **created** (this file) | ~180 |

Nothing else. No source file, no config, no schema, no dependency was touched.

---

## 5. Verification

```bash
git status --short   # only the two new files above
git diff main...HEAD --stat
```

Documentation-only changes cannot regress runtime, so the build/typecheck gate
(`npx tsc --noEmit && npm run lint && npm run build`) was not required to run.
It **is** required for any subsequent code change made under these guidelines.

---

## 6. What was deliberately NOT done

To keep this change reviewable and safe, no cleanups were performed, even
though several were identified:

- No duplication in `action-button.tsx`, `dashboard-*`, `pricing-cards.tsx`,
  or the date-picker JSX was refactored.
- `/task` was **not** added to `PROTECTED_ROUTES`.
- The broken `/verify-email` link in `app/action/user.ts` was **not** fixed.
- `app/page.tsx` was **not** converted from `"use client"` to a Server
  Component to enable `metadata` export.
- `Category.name`'s conflicting unique constraints were **not** changed — that
  needs a migration and a product decision.
- Dead code (`error-boundary.tsx`, `action-button-demo.tsx`,
  `cache-config.ts`) was **not** deleted.
- Stale branding ("GoTask") and placeholder `mailto:` links were **not** fixed.

All of the above are listed in `AGENT.md` §5 so they surface naturally the next
time a developer touches the affected file. Each warrants its own branch and PR.

---

## 7. Recommended follow-ups

Ordered by value per unit of risk. Each should be its own branch.

1. **`fix/auth-task-route-protection`** — add `/task` to `PROTECTED_ROUTES`.
2. **`fix/broken-verify-email-link`** — create the route or remove the link.
3. **`refactor/action-button`** — delete `ActionButtonSimple`, inline the rest.
4. **`refactor/date-utils`** — extract `toUtcMidnight()` and `DatePickerField`.
5. **`refactor/kpi-cards`** — single `StatsCards` component, three call sites.
6. **`perf/use-subscription-hook`** — de-duplicate the `isPro` lookup; unify the
   two analytics pipelines behind one cache.
7. **`refactor/forms`** — pick `Form` **or** `Field` and delete the other.
8. **`perf/landing-page-metadata`** — convert `app/page.tsx` to a Server
   Component to restore `metadata` export.
9. **`chore/relocate-ui-components`** — move the two selectors out of `ui/`;
   delete or relocate the dev artifacts.
10. **`docs/readme`** — point the README at `AGENT.md` so human contributors
    see the rules too.

---

## 8. Verification checklist for reviewers

- [ ] Did the agent create a branch before editing? (`git branch --show-current`)
- [ ] Does `main` remain free of this work?
- [ ] Were existing components reused rather than new ones added?
- [ ] Does every new mutation verify session **and** ownership server-side?
- [ ] Does `npx tsc --noEmit && npm run lint && npm run build` pass?
- [ ] Are new files kebab-case, typed, dark-mode aware, with loading/empty/error states?
- [ ] Was a summary produced and recorded under `docs/changes/`?
