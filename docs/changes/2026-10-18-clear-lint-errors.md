# Change Log — Clear all lint errors

- **Date:** 2026-10-18
- **Branch:** `refactor/fix-lint-errors` (branched from `main`)
- **Type:** Refactor + bug fix
- **Resolves:** the Definition of Done gate in `AGENT.md` §4

---

## 1. Problem

`main` inherited **39 lint errors and 54 warnings**, so the documented
Definition of Done (`tsc --noEmit && npm run lint && npm run build`) could not
pass. The errors fell into four unrelated categories:

| Category | Count | Files |
| --- | --- | --- |
| `@typescript-eslint/no-explicit-any` | 26 | hooks + API routes + 5 components |
| `react-hooks/rules-of-hooks` | 5 | `app/page.tsx`, `update-password-form` |
| `react/no-unescaped-entities` | 5 | contact, dashboard-layout, dashboard-header, verify-email |
| `react-hooks/set-state-in-effect` | 3 | settings, navbar, footer |
| `@next/next/no-html-link-for-pages` | 1 | footer |

---

## 2. Changes

### 2.1 New shared types (`lib/types.ts`)

Rather than sprinkling one-off `interface`s, added a single module describing
the data that crosses the network boundary: `Task`, `TaskLabel`, `Category`,
`Label`, `SubscriptionPlan`, `UserSubscription`, `SessionUser`,
`UserWithOAuth`, `Analytics`, `TaskSummary`, plus the API response envelopes.

The important subtlety it documents: **route handlers serialise Prisma records
with `NextResponse.json`, so every `DateTime` arrives on the client as an ISO
string**. Dates in these types are `string`, not `Date`. It also records the
`taskLabels` → `labels` rename that the task routes perform, and the
PRO-only fields that are always null for FREE subscribers.

`stores/analytics-store.ts` now re-exports `Analytics` from here rather than
declaring its own copy, so the definition exists in exactly one place and
existing imports keep working.

### 2.2 `any` removed (26 errors)

- **`hooks/use-dashboard-data.ts`** — the cache is now typed per key
  (`CacheData<T>`), each `response.json()` is cast to its real response type,
  and `SessionUser` is used for the user.
- **`app/api/analytics/route.ts`** — the two `Record<string, any>` accumulators
  are now `Record<string, Analytics["categories"][number]>` /
  `[...["labels"][number]]`, which also makes the derived value types checked
  rather than asserted. The `taskLabel` callback lost its annotation and gained
  a null guard, because the serialised `label` is genuinely nullable.
- **`app/api/cron/email-reminders/route.ts`** — all three annotations were
  unnecessary; the Prisma `include` already gives TypeScript the shape.
- **`app/dashboard/page.tsx`**, **`app/settings/page.tsx`**,
  **`components/user/{profile-image-upload,subscription-history,task/edit}`** —
  typed against the shared module.
- **`components/user/subscription-history.tsx`** deleted its local
  `SubscriptionPlan` / `UserSubscription` duplicates in favour of the shared
  ones.

Two places needed care:

- **Cloudinary callbacks.** `next-cloudinary` does not export its callback
  types, but they are derivable from the widget's own props:
  ```ts
  type UploadWidgetProps = ComponentProps<typeof CldUploadWidget>;
  type UploadSuccessHandler = NonNullable<UploadWidgetProps["onSuccess"]>;
  ```
  This guarantees the handlers stay assignable *and* contextually type their
  parameters. It also surfaced that `result.info` is
  `string | CloudinaryUploadWidgetInfo`, so a `typeof info === "object"` guard
  was added.

- **`components/user/task/edit.tsx`.** The task page parses the API's ISO date
  strings into `Date` objects before storing them, and its local `Task`
  interface does not declare `categoryId`. Forcing the network-shaped `Task`
  here produced a type error that revealed the page's interface is inaccurate.
  Rather than propagate that inaccuracy, `EditTaskProps` now declares the
  structural subset the form actually reads.

### 2.3 Three genuine defects fixed

These were not cosmetic — the linter surfaced real bugs.

1. **`update-password-form.tsx` — conditional hook.**
   `useForm` was called *after* an early `if (isOAuthOnly) return ...`. If
   `isOAuthOnly` flipped between renders (e.g. the server action resolved),
   React would see a different hook order and throw. The hook now runs
   unconditionally above the guard; `getPasswordFormSchema` already relaxes
   `currentPassword` for OAuth users, so behaviour is unchanged.

2. **`app/dashboard/page.tsx` — store mutation during render.**
   ```diff
   - {analytics?.labels?.sort((a, b) => b.count - a.count)
   + {[...(analytics?.labels ?? [])].sort((a, b) => b.count - a.count)
   ```
   `Array.prototype.sort` sorts in place, so this was mutating the array held
   in the Zustand store during render. Now sorts a copy. Same output, no
   mutation.

3. **`register-form.tsx` — prop leaking to the DOM.**
   `openEmailVerification` was declared as a prop but never used. Removing it
   from the type alone would have let it fall into `...props` and be spread
   onto a `<div>` as an unknown DOM attribute. No caller passes it
   (`app/signup/page.tsx` renders `<RegisterForm />`), so it was deleted.

4. **`app/settings/page.tsx` — cascading render.**
   `setLoading(false)` was called synchronously in an effect body. The
   unauthenticated branch moved inside the async fetcher, preserving behaviour
   (loading still clears) without the extra render pass.

### 2.4 `useMounted` hook (new)

`setMounted(true)` in an effect was duplicated in **three** components
(`navbar`, `footer`, `mode-toggle`) and flagged by
`react-hooks/set-state-in-effect`. Added `hooks/use-mounted.ts` built on
`useSyncExternalStore`, which returns the server snapshot during SSR and the
client snapshot afterwards — the same hydration-safe behaviour, without the
extra render pass. All three now call it.

### 2.5 Mechanical cleanups

- Unescaped apostrophes → `&apos;` (5).
- Unused imports and variables removed (~40), including dead
  `ActionButton` / `ActionButtonSimple` / `Button` imports in
  `components/user/profile.tsx` and an unused `Audiowide` font declaration in
  both `navbar` and `footer`.
- Unused `catch` bindings → optional catch binding, `catch (err)` → `catch`
  (7 files).
- `app/page.tsx`: `export default function page()` → `HomePage()`. The
  lowercase name made React treat the file as a non-component, which is what
  produced four `rules-of-hooks` errors.
- `footer.tsx`: plain `<a href="/">` → `<Link>`.
- Four `<img>` → `next/image` with explicit dimensions (navbar logo,
  navbar avatar and fallback, footer logo), removing the LCP warnings.
- `register-form.tsx`: unused `openEmailVerification` prop removed (see above).

---

## 3. Verification

| Gate | Before | After |
| --- | --- | --- |
| `npx tsc --noEmit` | PASS | PASS |
| `npm run lint` | **FAIL** — 39 errors, 54 warnings | **PASS (exit 0)** — 0 errors, 2 warnings |
| `npm run build` | PASS | **PASS** — all 30 routes |

---

## 4. The two remaining warnings — deliberately not "fixed"

Both are suppressed in neither code nor config, on purpose.

**1. `components/ui/data-table.tsx` — `react-hooks/incompatible-library`.**
TanStack Table's `useReactTable()` returns functions that cannot be memoised
safely, so the React Compiler skips memoising the component. There is no code
change that resolves this; the only options are migrating off TanStack Table or
adding an `eslint-disable` with a justification. Documented instead of silenced.

**2. `hooks/use-dashboard-data.ts` — `exhaustive-deps` on `fetchUserData`.**
The effect intentionally runs once on mount:

```ts
useEffect(() => { fetchUserData(); }, []);   // warns: missing 'fetchUserData'
```

Adding the dependency as the rule suggests would cause an **infinite refetch
loop**: `fetchUserData` → `fetchWithCache` → depends on the `cache` state →
which changes on every successful fetch → new callback identity → effect re-runs.

The correct fix is to stop `fetchWithCache` depending on component state (hold
the cache in a `useRef`), which is a behavioural refactor of the caching layer
and is out of scope for a lint cleanup. Left as-is and recorded.

---

## 5. Files changed

29 modified, 2 added:

- **Added:** `lib/types.ts`, `hooks/use-mounted.ts`

---

## 6. Follow-ups

1. **`refactor/cache-with-ref`** — move `useDashboardData`'s cache into a ref
   so the effect dependencies can be declared honestly, clearing the last
   actionable warning.
2. **`refactor/dedupe-components`** — the remaining `AGENT.md` §5 debt:
   `ActionButton` vs `ActionButtonSimple`, the three KPI grids,
   `PricingCards` vs `SubsPlan`, the six duplicated date-picker triggers, and
   the triple `isPro` lookup. Now that types are centralised these are much
   safer to consolidate.
3. **`refactor/single-form-system`** — pick `ui/form.tsx` or `ui/field.tsx`.
4. **`chore/address-npm-audit`** — 45 vulnerabilities remain (1 critical,
   27 high). Untouched, as `--force` applies breaking changes.
5. **`chore/prune-pnpm-lockfile`** — the stale `pnpm-lock.yaml` is still present
   alongside `package-lock.json`.
