# Phase 3B Remaining Branch Calls Risk Analysis

## Summary

Four `getActiveBranches` call sites remain across 4 files. All four use branches as **filter/selector dropdown data** only — no mutation, no business logic depends on the raw fetch. Every site is a straightforward `useState` + `useEffect` pattern that can be replaced with `useActiveBranches()`.

| # | File | Module | Usage | Fetch Pattern | Risk |
|---|------|--------|-------|---------------|------|
| 1 | `PayRollPage.tsx` | Payroll | Branch filter for payroll records | Standalone `useEffect` | Low |
| 2 | `PayrollGenerate.tsx` | Payroll | Branch selector in generate form | Standalone `useEffect` | Low |
| 3 | `EmployeeDrawer.tsx` | Employee | Branch selector in create/edit form | Standalone `useEffect` guarded by `if (!open)` | Low |
| 4 | `ApplicantDetailPage.tsx` | Recruitment | Branch selector in convert-to-employee dialog | Inside `fetchAll` `Promise.all` | Low–Medium |

## Remaining Call Sites

### 1. PayRollPage.tsx

**File:** `Frontend/src/features/payroll/pages/PayRollPage.tsx`

**Where `getActiveBranches()` is called:**
- Import: line 55
- Fetch: lines 91-95 — standalone `useEffect(() => { getActiveBranches().then(setBranches).catch(() => {}) }, [])` on mount
- State: `const [branches, setBranches] = useState<any[]>([])` (line 87)
- Usage: `branches.map((b) => ...)` at line 426 inside a `<Select>` branch filter dropdown
- No custom types — uses `any[]`

**Analysis:** Simple branch filter dropdown to narrow payroll records by branch. The fetched `branches` array is completely independent of the payroll data fetching pipeline (`fetchPayroll` uses `branchFilter` state, not the `branches` array). Replacing with `useActiveBranches()` requires only import swap, state→hook, and useEffect removal.

**Behavior to preserve:**
- Branch filter dropdown populated with active branch names
- `branchFilter` state and its usage in `getPayroll()` and `getPayrollSummary()` unchanged
- Empty array fallback during loading

**Risk: Low**

---

### 2. PayrollGenerate.tsx

**File:** `Frontend/src/features/payroll/pages/PayrollGenerate.tsx`

**Where `getActiveBranches()` is called:**
- Import: line 15
- Fetch: lines 45-49 — standalone `useEffect(() => { getActiveBranches().then(setBranches).catch(() => {}) }, [])` on mount
- State: `const [branches, setBranches] = useState<Branch[]>([])` (line 41) with `interface Branch { id: number; name: string; code: string }` (lines 26-30)
- Usage: `branches.map((b) => ...)` at line 191 inside a `<Select>` branch selector for payroll generation

**Analysis:** Branch selector in the "Generate Payroll" form. Same simple pattern as PayRollPage. The local `Branch` interface (with `code`) should be checked — if `useActiveBranches()` returns a compatible shape, no additional typing is needed. The interface is only used here; the hook returns `branches` as data via the service which already includes `code`.

**Behavior to preserve:**
- Branch selector populated with all active branches
- "All Branches" option preselected
- Branch ID passed to `generatePayroll()` (line 60: `selectedBranch && selectedBranch !== "all" ? selectedBranch : ""`)
- Empty array fallback during loading

**Risk: Low**

---

### 3. EmployeeDrawer.tsx

**File:** `Frontend/src/features/employees/components/EmployeeDrawer.tsx`

**Where `getActiveBranches()` is called:**
- Import: line 15
- Fetch: lines 208-218 — inside `useEffect(() => { if (!open) return; ... fetchBranches() ... }, [open])` — guarded by `open` state (only fetches when drawer opens)
- State: `const [branches, setBranches] = useState<{ id: number; name: string; code: string }[]>([])` (lines 172-174)
- Usage:
  - Line 333-334: Auto-select first branch for new employees: `if (mode === "create" && branches.length > 0 && !form.branch_id) { setForm({ ...form, branch_id: branches[0].id }) }`
  - Line 564: Form submission: `branch_id: form.branch_id ? Number(form.branch_id) : null`
  - Line 1710: `<select>` dropdown: `branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)`

**Analysis:** This is the most nuanced migration. The branch fetch is inside a `useEffect` guarded by `if (!open) return` and runs every time the drawer opens. This means:
- Currently branches are re-fetched on every drawer open (redundant)
- With `useActiveBranches()`, branches will be served from cache after first fetch (better)
- The auto-select logic at lines 333-334 runs during form initialization, which happens after the effect. With TanStack Query, `branches` would be `[]` during initial load and populate after. The auto-select should still work because it runs during render and depends on `branches.length`.

**Behavior to preserve:**
- Branch dropdown populated with active branches showing "Name (Code)"
- Auto-select first branch for create mode when no branch_id is set
- `branch_id` properly cast to Number in form submission
- Empty array fallback during loading (auto-select won't fire until branches arrive — matches current behavior since async fetch completes after mount)

**Risk: Low**

---

### 4. ApplicantDetailPage.tsx

**File:** `Frontend/src/features/recruitment/pages/ApplicantDetailPage.tsx`

**Where `getActiveBranches()` is called:**
- Import: line 48
- Fetch: line 332 — inside `fetchAll` via `Promise.all`: `getActiveBranches().catch(() => [])`
- This `fetchAll` is called from `useEffect(() => { if (id) fetchAll(); }, [id])` at lines 322-324
- State: `const [branches, setBranches] = useState<{ id: number; code: string; name: string }[]>([])` (line 121)
- Usage: line 1953 — `branches.map((b) => ...)` inside a `<Select>` branch selector in the "Convert to Employee" dialog

**Analysis:** The branch fetch is embedded inside a `Promise.all` alongside applicant data, requirements, and interviews. This means:
- Branch loading currently blocks the entire `fetchAll` (on failure, `.catch(() => [])` provides empty array)
- Separating the branch fetch from `Promise.all` would speed up applicant detail loading (branches no longer block showing applicant info)
- The branch selector is only used in the convert-to-employee dialog, which is a user-initiated action — branches can safely load independently

**Behavior to preserve:**
- Branch selector in convert-to-employee dialog populated with active branches showing "Name (Code)"
- Branch selection passed as `branch_id` in the convert payload
- Empty array fallback during loading
- Applicant detail loading NOT blocked by branch fetch

**Risk: Low–Medium**
- The `Promise.all` context requires careful extraction — must not accidentally block applicant loading or break the convert dialog
- However, since `useActiveBranches()` loads independently and caches, the convert dialog will always have branch data available after first load (or show empty until it arrives — graceful degradation)
- The `.catch(() => [])` pattern must be preserved (handled by hook's default empty array)

## Risk Ranking

| Rank | File | Risk | Rationale |
|------|------|------|-----------|
| 1 (safest) | `PayrollGenerate.tsx` | Low | Standalone useEffect, simple selector, own local Branch interface — minimal coupling |
| 2 | `PayRollPage.tsx` | Low | Standalone useEffect, simple filter, `any[]` type — no special logic |
| 3 | `EmployeeDrawer.tsx` | Low | Standalone useEffect with `open` guard, but has auto-select logic that depends on branches array timing |
| 4 | `ApplicantDetailPage.tsx` | Low–Medium | Embedded in Promise.all with other data fetches; must extract carefully to avoid blocking applicant loading |

## Recommended Migration Order

**Next safest migration: PayrollGenerate.tsx**

Rationale:
1. Smallest file (229 lines) — simplest change surface
2. Standalone `useEffect` with no dependencies on other data fetches
3. Own `Branch` interface (id, name, code) — easy to verify type compatibility
4. No auto-select, no complex state interaction
5. Same module as PayRollPage but simpler — good warm-up before tackling PayRollPage

**Followed by: PayRollPage.tsx** — same module, similar pattern, slightly larger context.

**Then: EmployeeDrawer.tsx** — verify auto-select timing works with cached data.

**Lastly: ApplicantDetailPage.tsx** — requires careful extraction from `Promise.all`.

## Do Not Touch Yet

The following are intentionally excluded from this phase:
- **Backend** — not modified
- **Payroll data fetching** — `getPayroll`, `getPayrollSummary`, `getEmployeesForFinalPay`, `generatePayroll` remain untouched
- **Employee create/update** — `updateEmployee`, `createEmployee` remain untouched
- **Applicant convert-to-employee flow** — the conversion API call and form handling remain untouched
- **Device sync/import/mapping** — unchanged from Phase 3B.7
- **Attendance, database, migrations, API shapes, routes** — unchanged

## Suggested Next Phase

After all 4 remaining `getActiveBranches` sites are migrated (Phase 3B completion), the next reference data tier to cache is **shifts and settings**:
- `getActiveShifts()` — 3 call sites (EmployeeDrawer + Calendar + ShiftManagement)
- `getAllSettings()` / `getSetting(key)` — 5+ settings components
- `getEnabledLeaveTypes()` — leave type selectors

## Validation Notes

- `npx tsc --noEmit` must pass with 0 new errors after each migration
- `useBranches.ts` must be reused, never duplicated
- Inline types in `.map()` callbacks (or reuse existing local types) — no new `Branch` interface files
- For `Promise.all` extraction (ApplicantDetailPage): move `getActiveBranches` out into a separate non-blocking fetch, or replace entirely with hook call before the Promise.all
