# Change Log — Consolidate Stripe client, fix API version type error

- **Date:** 2026-10-18
- **Branch:** `fix/stripe-api-version`
- **Type:** Bug fix + refactor
- **Resolves:** `AGENT.md` §5 known debt — "Two Stripe clients with divergent API versions"

---

## 1. Problem

`npm install` was run to make the project work. The committed
`package-lock.json` turned out to be badly stale — it was **missing `stripe`
entirely** (588 packages recorded vs 775 actually required). The fresh install
therefore resolved `stripe@20.4.1`, whose types pin the API version literal.

That surfaced a hard type error that the stale lockfile had been masking:

```
lib/auth/auth.ts(10,3): error TS2322:
  Type '"2025-11-17.clover"' is not assignable to type '"2026-02-25.clover"'.
```

Investigating further revealed **three** separate Stripe client constructions
with three different API version behaviours:

| Location                | Pinned API version            | Notes                          |
| ----------------------- | ----------------------------- | ------------------------------ |
| `lib/stripe.ts`         | `"2024-06-20" as any`         | `as any` silenced the mismatch; also a lint error |
| `lib/auth/auth.ts`      | `"2025-11-17.clover"`         | caused TS2322 under stripe@20.4.1 |
| `app/api/webhooks/stripe/route.ts` | none (SDK default) | third client, undocumented drift |

The divergent pins were not merely untidy — a Stripe account pinned to one
API version can silently return different response shapes depending on which
client made the call.

---

## 2. Change

Collapsed all three onto the single existing client in `lib/stripe.ts`,
per `AGENT.md` §1.3 (reuse the thing that already exists rather than adding a
fourth copy).

### `lib/stripe.ts`
- Pinned `apiVersion` to `"2026-02-25.clover"`, matching `LatestApiVersion` in
  the installed SDK. Verified directly against
  `node_modules/stripe/types/apiVersion.d.ts`.
- **Removed the `as any` cast.** This was both a lint error
  (`@typescript-eslint/no-explicit-any`) and the reason this file silently
  drifted out of sync with the SDK.
- Added a comment explaining why the version is pinned explicitly and that it
  must be kept in sync with the SDK.

### `lib/auth/auth.ts`
- Deleted the local `new Stripe(...)` construction and the now-unused
  `import Stripe from "stripe"`.
- Imports the shared client as `stripeClient` to preserve the existing local
  name used in the Better Auth plugin config — zero changes at the call site.

### `app/api/webhooks/stripe/route.ts`
- Deleted the third client construction.
- Changed `import Stripe from "stripe"` to `import type Stripe from "stripe"`.
  The file still uses `Stripe.Subscription` as a type only, so a type-only
  import is correct and keeps the runtime import out of the bundle.

---

## 3. Verification

| Gate                        | Before                    | After                       |
| --------------------------- | ------------------------- | --------------------------- |
| `npx tsc --noEmit`          | **FAIL** (TS2322)         | **PASS** (exit 0)           |
| `npm run lint`              | 40 errors, 54 warnings    | 39 errors, 54 warnings      |
| `npm run build`             | n/a (blocked by env)      | **PASS** (exit 0, 30 routes)|

The single remaining lint delta is the `@typescript-eslint/no-explicit-any`
error at `lib/stripe.ts:8`, removed as part of this change. The other 39 errors
are pre-existing and unrelated.

---

## 4. A note on the build and missing secrets

`npm run build` initially failed:

```
Error: STRIPE_SECRET_KEY is not set in environment variables
> Build error occurred
Error: Failed to collect page data for /api/categories
```

**This is pre-existing and was not introduced by this change.** The repository
has no `.env.local` (it is gitignored). Evidence:

1. The Stripe constructor throws on an undefined key regardless of version
   pinning — verified directly:
   ```
   node -e "new Stripe(undefined, {apiVersion:'2026-02-25.clover'})"
   → THROWS: Neither apiKey nor config.authenticator provided
   ```
   So the pre-change `lib/auth/auth.ts` (which used `STRIPE_SECRET_KEY!` with a
   non-null assertion) threw at module evaluation too, just with a different
   message.
2. `app/api/subscription/checkout/route.ts` already imported the throwing
   `lib/stripe.ts` before this change, so `/api/subscription/checkout` failed
   page-data collection independently of the change.

The build was re-run with dummy values for `DATABASE_URL`,
`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `STRIPE_SECRET_KEY` and
`NEXT_PUBLIC_APP_URL` and succeeded — compiling all 30 routes, static
prerendering, and the `proxy.ts` middleware. This confirms the refactor itself
is sound and the sole blocker is the absence of real secrets.

**Implication worth acting on:** `next build` cannot succeed without
`STRIPE_SECRET_KEY` set, because Stripe is instantiated at module scope and
Next.js evaluates route modules during page-data collection. Vercel sets env
vars at build time so production is unaffected, but local and CI builds need a
`.env.local` (even with dummy values). See follow-up #2 below.

---

## 5. Files changed

| File                                  | Change                                    |
| ------------------------------------- | ----------------------------------------- |
| `lib/stripe.ts`                       | API version corrected; `as any` removed   |
| `lib/auth/auth.ts`                    | Reuses shared client; local client deleted |
| `app/api/webhooks/stripe/route.ts`    | Reuses shared client; third client deleted; `import type` |
| `package.json`                        | `allowScripts` block added (see change log `2026-10-18-agent-guidelines.md`) |
| `package-lock.json`                   | Refreshed — 588 → 775 packages, `stripe` added |

---

## 6. Follow-ups

1. **`refactor/fix-remaining-lint`** — 39 pre-existing errors remain, mostly
   `no-explicit-any` in `hooks/use-dashboard-data.ts` plus an unescaped-entity
   error in `components/verify-email.tsx`.
2. **`refactor/lazy-stripe-client`** — make the Stripe client lazy so module
   import never throws, decoupling `next build` from the presence of secrets.
   Would convert `export const stripe` to a memoised `getStripe()` across the
   three call sites.
3. **`chore/prune-pnpm-lockfile`** — a `pnpm-lock.yaml` coexists with
   `package-lock.json` and is now stale. `AGENT.md` §4 says prefer npm; either
   delete the pnpm lockfile or standardise on pnpm.
4. **`chore/address-npm-audit`** — `npm install` reported 45 vulnerabilities
   (1 critical, 27 high, 16 moderate, 1 low). Not auto-fixed, as
   `npm audit fix --force` applies breaking changes and needs triage.
