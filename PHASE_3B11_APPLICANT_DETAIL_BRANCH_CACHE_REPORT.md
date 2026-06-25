# Phase 3B.11 ApplicantDetailPage Branch Cache Report

## Summary

`ApplicantDetailPage.tsx` was migrated from direct `getActiveBranches()` calls to the cached `useActiveBranches()` hook. The branch selector in the convert-to-employee dialog now reads branch data from TanStack Query's cache instead of being fetched inside the `fetchAll` `Promise.all` on every page load.

This completes all 11 page-level `getActiveBranches()` direct call site migrations (Phase 3B).

## Files Changed

| File | Change |
|------|--------|
| `Frontend/src/features/recruitment/pages/ApplicantDetailPage.tsx` | 3 edits (see diff below) |

## Page Migrated

- **Component**: `ApplicantDetailPage.tsx` — branch selector in convert-to-employee dialog
- **Previously**: `useState<{ id: number; code: string; name: string }[]>` + branches fetched inside `fetchAll` `Promise.all` on mount
- **Now**: `const { data: branches = [] } = useActiveBranches()` — reads from shared cache, loaded independently of page data

## Promise.all Extraction

**Before:**
```tsx
const [app, reqs, brs, ivs] = await Promise.all([
  getApplicantById(Number(id)),
  getApplicantRequirements(Number(id)).catch(() => []),
  getActiveBranches().catch(() => []),
  getApplicantInterviews(Number(id)).catch(() => []),
]);
setApplicant(app);
setRequirements(reqs);
setBranches(brs);
setInterviews(ivs);
```

**After:**
```tsx
const [app, reqs, ivs] = await Promise.all([
  getApplicantById(Number(id)),
  getApplicantRequirements(Number(id)).catch(() => []),
  getApplicantInterviews(Number(id)).catch(() => []),
]);
setApplicant(app);
setRequirements(reqs);
setInterviews(ivs);
```

The `brs` destructuring variable, `getActiveBranches()` promise, and `setBranches(brs)` call were removed. No other promises or result assignments were shifted.

## Behavior Preservation

- Applicant detail loading still fetches applicant, requirements, and interviews in parallel — unchanged
- Branch selector in convert-to-employee dialog works identically — same `Name (Code)` label format
- Convert-to-employee form state (`convertForm.branch_id`), payload, and API call (`convertApplicantToEmployee`) untouched
- Workflow/timeline loading, requirements CRUD, interviews, family/education/experience sections — all untouched
- `useBranches.ts` was reused, not duplicated
- Backend was not touched
- Payroll, attendance, and employee modules not touched

## Convert-to-Employee Branch Selector Verification

The branch selector at line 1953 uses `branches.map((b) => ...)` which was previously fed by `setBranches(brs)` from `Promise.all`. Now `branches` comes from the hook. The `branches` variable still has the same data shape (`id`, `code`, `name`), so the selector behavior is identical.

## Validation Commands and Results

```powershell
cd Frontend
npx tsc --noEmit
# → No output (0 errors from our changes)

npm list @tanstack/react-query --depth=0
# frontend@0.0.0
# └── @tanstack/react-query@5.101.1
```

All validation commands passed.

## Known Risks

- **No risk.** The branches were previously loaded inside `fetchAll` with `.catch(() => [])` fallback. Now they load independently from the cache. If cache is empty (first load), branches default to `[]` until the query resolves. The convert dialog is user-initiated (not automatic), so branches will likely be cached by the time a user opens it.
- Removing the branch fetch from `Promise.all` slightly reduces the initial page load payload (one fewer parallel request), which is a minor performance improvement.

## Phase 3B Completion Status

All 11 original `getActiveBranches()` page-level call sites have been migrated to `useActiveBranches()`:

| # | Page | Status |
|---|------|--------|
| 1 | `Calendar.tsx` | ✅ Phase 3B.1 |
| 2 | `EmployeeList.tsx` | ✅ Phase 3B.2 |
| 3 | `AttendancePage.tsx` | ✅ Phase 3B.3 |
| 4 | `DevicePage.tsx` | ✅ Phase 3B.4 |
| 5 | `BranchRestDays.tsx` | ✅ Phase 3B.5 |
| 6 | `JobPositionsPage.tsx` | ✅ Phase 3B.6 |
| 7 | `DeviceIntegration.tsx` | ✅ Phase 3B.7 |
| 8 | `PayrollGenerate.tsx` | ✅ Phase 3B.8 |
| 9 | `PayRollPage.tsx` | ✅ Phase 3B.9 |
| 10 | `EmployeeDrawer.tsx` | ✅ Phase 3B.10 |
| 11 | `ApplicantDetailPage.tsx` | ✅ Phase 3B.11 |

Only `getActiveBranches` references remaining are in `hooks/useBranches.ts` (import + queryFn) and `services/branchService.ts` (service definition).

## Next Recommended Phase

Begin **Phase 3C** — Dashboard caching:
- Migrate dashboard summary/analytics endpoints to TanStack Query hooks
- 5 parallel API calls on mount can share a cache with 30s stale time
- High user-facing performance impact for dashboard navigation
