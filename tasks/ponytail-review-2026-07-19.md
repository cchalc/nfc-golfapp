# Ponytail Review — 2026-07-19

Repo-wide over-engineering audit via the `ponytail` plugin
(github.com/DietrichGebert/ponytail), applied with the ponytail-audit ruleset.
Scope: complexity / over-engineering only (correctness, security, perf are
separate passes).

## Audit findings (ranked, biggest cut first)

| # | Tag | Finding | Replacement | File |
|---|-----|---------|-------------|------|
| 1 | delete | 270-line perf-instrumentation module, **0 importers** | nothing | `src/lib/performance.ts` |
| 2 | delete | perf budget constants + `getBudget()`, **0 importers** | nothing | `src/lib/performance-budgets.ts` |
| 3 | delete | prefetch/warmup helper, **0 importers** | nothing | `src/lib/trip-warmup.ts` |
| 4 | delete | 1-line `<div className="animate-reveal">` wrapper, **0 callers** | inline if ever needed | `src/components/ui/PageTransition.tsx` |
| 5 | yagni | `useDialogState` wraps `useState(false)` with an unused `_dialogId` "for API compatibility" (no external API) + pointless `useCallback` | shrink to one line / use `useState` at call sites | `src/hooks/useDialogState.ts` |
| 6 | shrink | `useToast` re-wraps `useToastContext()` for `{ showToast }` (2 callers) | use `useToastContext()` directly | `src/hooks/useToast.ts` |

**net: ~-620 lines, -0 deps.**

Not flagged (justified): `errors.ts` (classes used cohesively by `wrapMutation`),
`validation.ts` (4 callers, real logic), `ClientOnly` (SSR guard, minimal).

## Parallel work plan (wt worktrees off `main`/`trunk()`)

Files are disjoint per branch → safe to run in parallel, merge back with `wt merge`.

- [x] **branch `ponytail/dead-code`** — findings 1–4. Deleted the four dead files.
      Verified no references remain. Merged to main (-452 lines). commit `bd29167`.
- [x] **branch `ponytail/dialog-hook`** — finding 5. Shrank `useDialogState` to
      `useState(false)`, dropped the dead arg at all 10 call sites (2 more than the
      6 estimated — some files had multiple). Merged (+14/-43). commit `ea967e7`.
- [x] **branch `ponytail/toast-hook`** — finding 6. `useToast` had **1** caller (not 2 —
      Toast.tsx already used useToastContext directly). Inlined into EditTripDialog,
      deleted the hook. Merged (+2/-8). commit `57ee311`.

## Verification (each branch, before merge)

- ⚠️ **Environment is offline** (`ECONNREFUSED` to registry.npmjs.org) and
  `node_modules` was never installed, so `pnpm check` / `tsc` / `test` could not
  run. Verified statically instead: grepped for every dangling import/symbol,
  confirmed hook return-type shape matches call sites, confirmed
  `useToastContext()` exposes `showToast`. **Re-run `pnpm install && pnpm check`
  once network is available before pushing.**

## Result

All 3 branches merged to `main` via `wt merge`; jj imported the commits.
main is 3 commits ahead of origin. **net so far: -487 lines, 4 files deleted.**

## Conventions honored (from CLAUDE.md)

- jj only (repo now colocated: `jj git init --colocate` done). Never `git`.
- Fish shell syntax when giving the user commands.
- Ponytail lazy-but-not-negligent: keep validation / error handling / a11y.
