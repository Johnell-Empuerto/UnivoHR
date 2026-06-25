# Phase 3B.10 EmployeeDrawer Branch Cache Report

## Summary

`EmployeeDrawer.tsx` was migrated from direct `getActiveBranches()` calls to the cached `useActiveBranches()` hook. The branch dropdown in the employee create/edit form now reads branch data from TanStack Query's cache (staleTime: 10min, gcTime: 30min) instead of fetching via a standalone `useEffect` on every drawer open.

## Files Changed

| File | Change |
|------|--------|
| `Frontend/src/features/employees/components/EmployeeDrawer.tsx` | 3 edits (see diff below) |

## Component Migrated

- **Component**: `EmployeeDrawer.tsx` — branch dropdown in employee create/edit form, including auto-select-first-branch for create mode
- **Previously**: `useState<{ id: number; name: string; code: string }[]>` + `useEffect` guarded by `if (!open) return` calling `getActiveBranches()` directly
- **Now**: `const { data: branches = [] } = useActiveBranches()` — reads from shared cache

## Behavior Preservation

- Branch dropdown works identically — same data, same `Name (Code)` label format
- Auto-select-first-branch for create mode preserved (line 333: `if (mode === "create" && branches.length > 0 && !form.branch_id)`)
  - Previously: branches fetched on drawer open, populated async → re-render triggers auto-select
  - Now: branches from cache (or empty during initial load), populated async → re-render triggers auto-select
  - Same timing behavior since both are async
- `form.branch_id` and form submission payload (`branch_id: Number(form.branch_id)`) unchanged
- Employee create/update API calls (`createEmployee`, `updateEmployee`) untouched
- Shifts fetch (`getActiveShifts`) in the same `useEffect` is preserved and unchanged
- Rest day fetching, family/education/experience sections — all untouched
- Drawer open/close behavior unchanged
- UI design, fields, and layout unchanged
- `useBranches.ts` was reused, not duplicated
- Backend was not touched

## Auto-Select Branch Verification

The auto-select logic at line 332-336:
```tsx
useEffect(() => {
  if (mode === "create" && branches.length > 0 && !form.branch_id) {
    setForm((prev) => ({ ...prev, branch_id: branches[0].id }));
  }
}, [branches, mode]);
```

This effect fires when `branches` changes from `[]` to populated data, which happens after the cache resolves. Previously it fired when the async fetch resolved. Behavior is identical.

## Diff Summary

```
- import { getActiveBranches } from "@/services/branchService";
+ import { useActiveBranches } from "@/hooks/useBranches";

- const [branches, setBranches] = useState<
-   { id: number; name: string; code: string }[]
- >([]);
+ const { data: branches = [] } = useActiveBranches();

  useEffect(() => {
    if (!open) return;
-   const fetchBranches = async () => {
-     try {
-       const data = await getActiveBranches();
-       setBranches(data);
-     } catch {
-       // silently fail - branches are optional for the form
-     }
-   };
-   fetchBranches();
    const fetchShifts = async () => {
      ...
    };
    fetchShifts();
  }, [open]);
```

3 hunks: import swap, state→hook, branch fetch removal from shared useEffect.

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

- **Low risk.** The branch fetch was previously guarded by `if (!open) return`, meaning branches were only fetched when the drawer opened. With `useActiveBranches()`, the query fires on component mount (whenever `EmployeeDrawer` is rendered in the tree). If the parent always renders `EmployeeDrawer` but hides it with CSS, branches would be fetched on initial page load rather than on first drawer open. This is acceptable — cached reference data loading earlier is a net positive.
- The auto-select effect depends on `branches` changing from `[]` to populated. With the cache, if branches were already loaded by another component, `branches` will already be populated on first render and the auto-select will fire immediately. This is correct behavior.

## Next Recommended Migration

**ApplicantDetailPage.tsx** — the last remaining `getActiveBranches` call site. Requires careful extraction from `Promise.all` inside `fetchAll`, but follows the same pattern.
