# AGENTS.md — Remindly

Operating rules for **any** human or AI agent working in this repository.
This file is the single source of truth for how code gets written here. Read it
**before** writing a line of code. If a rule here conflicts with your instinct,
the rule wins.

---

## 1. Non-negotiable rules

These are not preferences. Violating them means the work is not acceptable.

### 1.1 Never commit to `main`
`main` is protected. **Create a branch before you touch a single line of code.**

```bash
git status                      # must be clean-ish; note uncommitted work first
git checkout -b feat/task-reminder-email
```

Branch naming — pick the one that matches the work:

| Prefix      | Use for                                          |
| ----------- | ------------------------------------------------ |
| `feat/`     | new user-facing capability                       |
| `fix/`      | bug fix                                          |
| `refactor/` | behaviour-preserving restructuring                |
| `perf/`     | performance work                                  |
| `chore/`    | deps, config, tooling                            |
| `docs/`     | documentation only                                |
| `hotfix/`   | urgent production fix (still never on `main`)     |

Rules:
- One concern per branch. Do not mix a refactor with a feature.
- Never `git push` to `main`, never force-push a shared branch.
- Never commit secrets, `.env`, or `.env.local` (they are gitignored — verify).
- Before opening a PR: `git rebase` onto the latest base, re-run lint + build.
- Leave the working tree cleaner than you found it. Delete your scratch files.

```bash
# Verify before you finish
git status          # only intended files
git diff main...HEAD
```

---

### 1.2 Analyse before implementing
Do not start typing code because the request "sounds clear".

1. **Read the whole relevant surface.** Grep for every caller. A change to a
   component, schema, or action has blast radius you cannot guess.
2. **Find the existing pattern.** This codebase already solved similar problems.
   Match the pattern that is already there (see §3).
3. **State the plan in 3–5 lines before you edit.** If the request is
   ambiguous, ask one clarifying question rather than guessing.
4. **Verify your premise.** If the task says "there is no test for X", confirm it.
   Never assume the repo state matches the task description.
5. **Check for the data-shape trap.** In this repo, `taskLabels` → `labels`
   renaming, PRO vs FREE field gating, and ownership checks are all easy to
   break silently.

Time-box the analysis. The goal is a correct first attempt, not a research paper.

---

### 1.3 Reuse first — never duplicate
**Adding a new component is a last resort, not a first move.**

Before creating any file, you must be able to answer "no" to all of these:

- Does a component in `components/ui/` already do this? (`Button`, `Card`,
  `Dialog`, `AlertDialog`, `Select`, `Tabs`, `Table`, `DataTable`, `Form`,
  `Field`, `Skeleton`, `Spinner`, `LoadingSwap`, `PasswordInput`,
  `CategorySelector`, `LabelSelector`, `Badge`, `ErrorBoundary`, …)
- Does a component in `components/` already do this? (`ActionButton`,
  `VerifyEmail`, `SocialAuthButton`, `ModeToggle`, `PricingCards`, `DashboardStats`)
- Is there a **variant** to add to an existing component rather than a new one?
  (`buttonVariants`, `badgeVariants`, `fieldVariants` — extend these, don't copy
  the `cn()` string literal a 4th time.)
- Is there a **utility** for this? Check `@/lib/utils`. Add there, not at the
  call site.
- Is there a **hook** for this? Check `@/hooks` and `@/stores`.
- Is there a **schema** for this? Check `@/lib/validation`.

**Hard rule on styles:** repeated Tailwind class strings are a bug. Promote them
to a `cva` variant in the owning component. Repeated UI blocks are a bug.
Promote them into the existing component.

**Shadcn/ui is vendored, not a dependency.** Never `npm install` a shadcn
component — add it via the shadcn CLI into `components/ui/` and use it.

### 1.4 Write for performance
- Server Components by default. `"use client"` is a cost — never add it unless
  the file needs state, effects, event handlers, or a browser-only API.
- Push `"use client"` to the **leaf** of the tree. Never make a page client-side
  just because one child needs it.
- Fetch in **parallel** with `Promise.all`, never sequential `await` on
  independent requests.
- Select only the Prisma fields you need (`select`). Never `include` a whole
  relation tree for a count.
- Always paginate. Never unbounded `findMany` on a user-owned table.
- Only index what's queried. New index = new migration; justify it.
- `use cache` (`next.config.ts` has `cacheComponents: true`) for server
  components rendering non-user-specific data. **Never** for user-specific data.
- Memoize expensive work: `useMemo` / `useCallback` for derived arrays and
  handlers passed to memoised children; `React.memo` for heavy leaves
  (see `components/analytics/analytics-charts.tsx`).
- Images via `next/image`. Icons via `lucide-react`, never inline SVG.
- Register Chart.js modules **once at module scope**, never inside a component.

---

## 2. Architecture

Remindly is a task reminder SaaS with a FREE/PRO subscription tier.

### Stack
| Concern      | Choice                                      |
| ------------ | ------------------------------------------- |
| Framework    | Next.js 16 (App Router, React 19, RSC)      |
| Styling      | Tailwind CSS v4 (CSS-first, no config file) |
| Components   | shadcn/ui (`new-york`, vendored) + Radix    |
| Forms        | react-hook-form + Zod (`zodResolver`)       |
| Validation   | Zod v4                                      |
| Auth         | better-auth (email+password, Google OAuth)  |
| DB           | PostgreSQL via Prisma 7 (`@prisma/adapter-pg`) |
| Client state | Zustand                                     |
| Tables       | TanStack Table (`components/ui/data-table`) |
| Charts       | Chart.js + react-chartjs-2 (PRO analytics)  |
| Billing      | Stripe (Checkout + webhooks)                |
| Images       | Cloudinary (signed uploads)                 |
| Email        | Nodemailer (`lib/emails/`)                  |
| WAF/Rate limit | Arcjet (`lib/arcjet/`, enforced in `proxy.ts`) |
| Toasts       | sonner                                      |
| Dates        | date-fns                                    |
| Edge auth    | `proxy.ts` — **this is `middleware.ts`, renamed in Next 16** |

### Directory map
```
app/                    Routes (App Router)
  page.tsx              Landing (client component)
  about/ contact/ pricing/   Public marketing
  login/ signup/ reset-password/   Auth
  dashboard/ task/ settings/ subscription/ choose-plan/   App
  action/               Server Actions ("use server")
  api/                  Route Handlers (REST-ish JSON)
  robots.ts sitemap.ts  SEO metadata routes
  layout.tsx globals.css
components/
  ui/                   shadcn/ui primitives — ONLY generic, no domain logic
  analytics/ dashboard/ shared/ user/   Feature components
  <root>.tsx            Auth forms, ActionButton, verify-email, theme
hooks/                  Custom hooks (data fetching + store adapters)
lib/
  auth/                 better-auth server + client config
  emails/               Nodemailer sender + HTML templates
  validation/           Zod schemas
  arcjet/               WAF config + protection helpers
  generated/prisma/     GENERATED — never hand-edit
  prisma.ts utils.ts stripe.ts cache-config.ts
stores/                 Zustand stores (analytics, user)
prisma/
  schema.prisma         10 models — read before any data work
  migrations/           Never hand-edit an applied migration
  seed.ts               Idempotent SubscriptionPlan upsert
proxy.ts                Next 16 edge middleware (auth + Arcjet)
public/                 Static assets (images/, logos)
```

### Data model (10 models)
`User` → `Session`, `Account`, `UserSubscription` → `SubscriptionPlan`,
`Task` → `Category`, `EmailNotification`, `TaskLabel` → `Label`.
`Verification` is standalone.

Notes that matter:
- **There are no Prisma enums.** Plan names (`FREE`/`PRO`), subscription
  `status`, and notification `type` are plain `String`s. Be careful comparing.
- `UserSubscription` has `@@unique([userId, status])` — one row per status.
- `Task` is heavily indexed for dashboard queries; preserve those indexes.
- PRO-only task fields: `reminderDate`, `categoryId`, labels. FREE users must
  have these nulled on write. **Both** `createTaskAction` and `updateTask`
  enforce this — any new task mutation must too.

---

## 3. Conventions you must follow

### Server / client
- Data fetching lives in `app/api/*/route.ts` or `app/action/*.ts` — **not** in
  components. Components consume.
- Prefer Server Actions (`app/action/`) for mutations; Route Handlers for reads
  and third-party callbacks (webhooks, cron, signed uploads).
- Both patterns return a discriminated result (`{ error }` / `{ success }` or
  the entity). Keep that shape.
- Async request APIs are **awaited**: `await headers()`.

### Auth & authorization — every time
- **Proxy cookie check is not authorization.** `proxy.ts` only checks cookie
  presence. Every route handler and server action must independently verify:
  1. `const session = await auth.api.getSession({ headers: await headers() })`
  2. `if (!session) return 401`
  3. **Ownership:** scope the query with `userId` from the session, or
     `findFirst({ where: { id, userId } })`. Never trust an ID from the client.
- Tier gating is a separate concern: `plan.name === "PRO"` before touching
  analytics, custom reminders, categories, or labels.

### Route handlers
```
- Wrap the body in try/catch → console.error → 500 JSON.
- Normalise Dates with .toISOString() before returning.
- Map taskLabels → labels on the way out (existing API contract — keep it).
- Use `NextRequest` and `NextResponse`.
```

### Validation
- Zod schema in `lib/validation/`, or co-located and **exported** with the form
  (see `loginFormSchema`).
- Server-side validation is mandatory and cannot be skipped because the client
  validated. Never trust `FormData` or a request body.
- Enforce business rules (max tasks, reminder < due date, PRO gating) on the
  server. The client check is UX only.

### Styling
- Tailwind utility classes only. No CSS modules, no inline style objects
  (except dynamic values like a category's colour).
- `cn()` from `@/lib/utils` for conditional classes.
- Design tokens / CSS variables (`bg-background`, `text-muted-foreground`,
  `bg-primary`) — never hard-coded hex or `text-gray-500`.
- Support light **and** dark mode in every new component.
- Icons: `lucide-react`, sized with Tailwind (`h-4 w-4`).

### Components
- Files are **kebab-case**. One component per file (small helpers may sit
  alongside). Prefer **named exports**; do not add a second default export.
- `"use client"` only when required.
- Props typed with an exported `XxxProps` interface.
- No `any` in new code. No `React.FC`. No `props` spreading onto DOM elements.
- UI lives in `components/ui/`, and must be **domain-agnostic**. If a
  `components/ui/` file imports from `@/lib`, `@/stores`, or hits an API, it is
  in the wrong folder — move it to a feature folder.
- Loading: `<Skeleton />` for content, `<Spinner />` for standalone,
  `<LoadingSwap isLoading>` for in-place button/form swaps. Never hand-roll a
  `<Loader2>`.
- Errors: `toast.error(...)` for user-facing failures. `error-boundary.tsx` for
  render crashes.

### Forms
- react-hook-form + `zodResolver` + the `<Form>` primitives. **No raw
  `useState` form validation.** (`user/task/edit.tsx` is the known exception —
  do not copy it.)
- Submit state from `form.formState.isSubmitting`.
- Surface server errors with `toast.error(result.error)`.

### State
- Server data → fetch in the component/hook.
- Cross-component client state → Zustand (`stores/`). Read with selectors so
  components only re-render on the slice they use: `useAnalyticsStore(s => s.x)`.
- Local UI state → `useState`/`useReducer`.

### Migrations
- Never edit an applied migration. Never edit `prisma/schema.prisma` without a
  migration, or vice versa.
- Run migrations and commit both `schema.prisma` and `prisma/migrations/`.
- `npm run db:seed` seeds `SubscriptionPlan` (idempotent).

---

## 4. Environment

- **Node 22+.** Package manager: `npm` (a `pnpm-lock.yaml` also exists — prefer
  `npm` unless the team standardises otherwise; never mix).
- Copy `.env.example` → `.env.local`. **Never commit it.**
- `prisma.config.ts` loads `.env.local` explicitly.
- Required to run locally: `DATABASE_URL`, `BETTER_AUTH_SECRET`,
  `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`. Optional per-feature: `ARCJET_KEY`,
  Google OAuth, SMTP, Stripe, Cloudinary, `CRON_SECRET`.

### Commands
```bash
npm run dev        # dev server
npm run build      # production build  ← must pass
npm run lint       # eslint
npx tsc --noEmit   # typecheck        ← must pass
npm run db:seed    # seed subscription plans
npx prisma migrate dev
```

### Definition of Done
A change is done only when **all** of these pass:
```bash
npx tsc --noEmit && npm run lint && npm run build
```
Plus:
- [ ] On a branch, never `main`.
- [ ] No `any`, no `@ts-ignore`, no unused imports, no commented-out code.
- [ ] Every new file follows the naming and layering rules above.
- [ ] Server-side authz + ownership + validation on any new mutation.
- [ ] Loading, empty, and error states handled.
- [ ] Reused existing components instead of adding new ones.
- [ ] No duplicated logic or class strings.
- [ ] No secrets committed.

---

## 5. Known debt — do not copy, do not spread

Fix opportunistically when you touch the file. Do not do drive-by refactors
unless asked.

- `proxy.ts` duplicates the Arcjet deny→status mapping in
  `lib/arcjet/utils.ts`. Consolidate onto the helper.
- Two Stripe clients with divergent pinned API versions: `lib/stripe.ts`
  (`2024-06-20`) vs `lib/auth/auth.ts` (`2025-11-17.clover`).
- `ActionButton` and `ActionButtonSimple` duplicate ~120 lines of inline
  provider SVG. `ActionButton` is a strict superset.
- `DashboardHeader` and `DashboardLayout` render byte-identical header JSX.
- `DashboardStats` and `AnalyticsSummary` are the same KPI grid; the analytics
  dashboard inlines a third copy.
- `PricingCards` and `SubsPlan` duplicate the Free/Pro card markup.
- `isPro` is fetched inline in three places. → extract `useSubscription()`.
- UTC-midnight date normalisation is copy-pasted in `user/task/create.tsx` and
  `user/task/edit.tsx`. → `toUtcMidnight()` in `@/lib/utils`.
- The calendar date-picker trigger JSX appears 6 times. → a `DatePickerField`.
- Both `hooks/use-dashboard-data.ts` and `stores/analytics-store.ts` fetch
  `/api/analytics` with independent caching. They can drift.
- `ui/form.tsx` (RHF) and `ui/field.tsx` (newer) coexist and are mixed in
  `login-form.tsx`/`register-form-form.tsx`.
- `ui/category-selector.tsx` and `ui/label-selector.tsx` call APIs from the
  `ui/` folder — wrong layering.
- `lib/cache-config.ts` is documentation, not a working cache. It configures
  nothing.
- `Category.name` is `@unique` at field level **and** `@@unique([userId, name])`
  at composite level — names are effectively global, not per-user.
- `/task` is missing from `PROTECTED_ROUTES` in `proxy.ts`.
- `app/action/user.ts` links to `/verify-email`, **which does not exist**.
- `robots.ts` disallows `/admin/` (no such route) and omits `/task`,
  `/settings`, `/subscription`.
- `app/page.tsx` is `"use client"` so it cannot export `metadata` — the single
  highest-value SEO page. Fixing this is a welcome contribution.
- `components/action-button-demo.tsx` and `action-button-usage.md` are dev
  artifacts shipped in `components/`; the demo is imported nowhere.
- `Aurora.jsx` is vendored from React Bits, PascalCase, and missing
  `"use client"`.
- Stale branding string "GoTask" in `app/subscription/page.tsx`.
- Placeholder `mailto:contact@example.com` in `app/contact/page.tsx`.

---

## 6. Agent workflow (summary)

```
1. git checkout -b <type>/<slug>          # never main
2. Read this file. Read the code you're changing. Grep for callers.
3. Search components/ hooks/ stores/ lib/ for something that already solves it.
4. State a short plan.
5. Implement the smallest correct change, following §3.
6. Verify:  npx tsc --noEmit && npm run lint && npm run build
7. Summarise: what changed, why, files touched, how it was verified,
   anything deliberately left out.
8. If the work is non-trivial, record it in
   docs/changes/<yyyy-mm-dd>-<slug>.md and reference that path in the summary.
9. Commit on the branch with a conventional message:
      feat(scope): short imperative summary
   Never push to main.
```

Commit message format:
```
<type>(<scope>): <imperative summary under 72 chars>

<why, not what. Wrap at 72 chars.>
```
