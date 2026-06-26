# Phase 3C.2 Reference Data Cache Analysis

## Summary

Four candidate reference-data tiers were analyzed: shifts, settings, leave types, and notification rules. All are low-risk, read-heavy, reference/static configuration data suitable for TanStack Query caching. The safest next implementation target is **shifts**, with only 3 call sites, a clean `useEffect` pattern identical to the branches migration, and existing mutation invalidation patterns.

## Candidate 1: Shifts

### Call Sites

| File | Function | Fetch Pattern | Usage |
|------|----------|---------------|-------|
| `EmployeeDrawer.tsx` | `getActiveShifts()` | `useEffect` on `open` (drawer) | Dropdown for shift assignment |
| `RotationPatterns.tsx` | `getActiveShifts()` | `useEffect` on mount (sequential) | Dropdown for rotation step form |
| `ShiftManagement.tsx` | `getShifts()` | `useEffect` on mount | Table + edit dialog |

### Analysis

- **Data type**: Reference / static — shifts are configured by admins and rarely change
- **Read-only in component**: Yes — shifts are only used for display (table rows, dropdown options)
- **Mutation invalidation**: `ShiftManagement.tsx` already calls `fetchShifts()` after create/update/delete. `RotationPatterns.tsx` and `EmployeeDrawer.tsx` rely on remount for refresh
- **Hook location**: `Frontend/src/hooks/useShifts.ts` (new file)
- **Suggested staleTime**: 10 minutes (same as branches)
- **Suggested gcTime**: 30 minutes
- **Query key pattern**: `["shifts", "active"]` for active, `["shifts", "all"]` for admin

**Risk: Low**

### Hook Design

```typescript
export const useActiveShifts = () =>
  useQuery({
    queryKey: ["shifts", "active"],
    queryFn: getActiveShifts,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

export const useShifts = () =>
  useQuery({
    queryKey: ["shifts", "all"],
    queryFn: getShifts,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
```

---

## Candidate 2: Settings

### Call Sites

| File | Function | Fetch Pattern | Usage |
|------|----------|---------------|-------|
| `CompanyTimezoneSettings.tsx` | `getSetting("company_timezone")` | `useEffect` on mount | Single dropdown, immediate save on change |
| `EmployeeCodeSettings.tsx` | `getAllSettings()` | `useEffect` on mount | Form with 5+ fields, save per field or bulk |
| `CompanyBranding.tsx` | `getAllSettings()` | `useEffect` on mount | Branding configuration form |
| `AttendanceSettings.tsx` | `getSetting("enable_web_clock_in_out")` | `useEffect` on mount | Toggle switch (already behind `useWebClockSetting` hook) |
| `Dashboard.tsx` | `getSetting("enable_web_clock_in_out")` | Already migrated | Already behind `useWebClockSetting` hook |

### Analysis

- **Data type**: Reference / static — company configuration, set by admins
- **Read-only in component**: Partially — most components also mutate settings via `updateSetting`, but the setting **value** is read-only (the mutation writes a new value)
- **Mutation invalidation**: Components use optimistic local state updates, not refetch — so no invalidation needed immediately
- **Hook location**: `Frontend/src/hooks/useSettings.ts` (new file)
- **Setting granularity**: Individual settings use `getSetting(key)` while some components need `getAllSettings()`. Two hooks needed:
  - `useSetting(key)` — cached per-key
  - `useAllSettings()` — cached collection
- **Suggested staleTime**: 5 minutes (settings change more often than shifts)
- **Suggested gcTime**: 15 minutes

**Risk: Low** (but requires more hooks and careful per-key caching)

### Hook Design

```typescript
export const useSetting = (key: string, enabled = true) =>
  useQuery({
    queryKey: ["settings", key],
    queryFn: () => getSetting(key),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled,
  });

export const useAllSettings = (enabled = true) =>
  useQuery({
    queryKey: ["settings", "all"],
    queryFn: getAllSettings,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled,
  });
```

---

## Candidate 3: Leave Types

### Call Sites

| File | Function | Fetch Pattern | Usage |
|------|----------|---------------|-------|
| `LeaveDrawer.tsx` | `getEnabledLeaveTypes()` | `useEffect` on mount | Dropdown for leave type selection |
| `EmployeeCreditsTable.tsx` | `getEnabledLeaveTypes()` | `useEffect` on mount | Table header column mapping |
| `LeaveTable.tsx` | `getEnabledLeaveTypes()` | `useEffect` on mount | Filter dropdown for leave type |
| `LeaveTypeSettings.tsx` | `getAllLeaveTypesAdmin()` | `useEffect` on mount | Full table with CRUD |
| `LeaveConversionSettings.tsx` | `getLeaveTypes()` | `useEffect` on mount | Dropdown for conversion type mapping |

### Analysis

- **Data type**: Reference / static — leave types are configured by admins
- **Read-only in component**: Yes — displayed as dropdown options, table rows, or filter values
- **Mutation invalidation**: `LeaveTypeSettings.tsx` uses optimistic local state updates on create/update/toggle/delete with a "Refresh" button fallback. No automatic refetch needed.
- **Hook location**: `Frontend/src/hooks/useLeaveTypes.ts` (new file)
- **Three separate endpoints**: `getEnabledLeaveTypes`, `getAllLeaveTypesAdmin`, `getLeaveTypes` — 3 separate hooks needed
- **Suggested staleTime**: 10 minutes
- **Suggested gcTime**: 30 minutes

**Risk: Low** (more endpoints to wrap but same pattern)

### Hook Design

```typescript
export const useEnabledLeaveTypes = () =>
  useQuery({
    queryKey: ["leave-types", "enabled"],
    queryFn: getEnabledLeaveTypes,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

export const useAllLeaveTypesAdmin = () =>
  useQuery({
    queryKey: ["leave-types", "all"],
    queryFn: getAllLeaveTypesAdmin,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

export const useLeaveTypes = () =>
  useQuery({
    queryKey: ["leave-conversion", "types"],
    queryFn: getLeaveTypes,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
```

---

## Other Candidates

| Candidate | Call Sites | Data Type | Risk | Notes |
|-----------|-----------|-----------|------|-------|
| Notification Rules (`getAllRules`) | 1 (`NotificationSettings.tsx`) | Reference / static | Low | Single component, form with toggles, optimistic local updates |
| SMTP Settings | 0 | — | — | Not found in frontend code |
| Email Templates | 0 | — | — | Not found in frontend code |

Notification rules are a valid candidate but with only 1 call site, the benefit is lower than other candidates.

---

## Risk Ranking

| Rank | Candidate | Call Sites | Complexity | Benefit | Risk |
|------|-----------|-----------|-----------|---------|------|
| 1 (safest) | **Shifts** | 3 | Low — same pattern as branches | Medium — shift dropdowns on every drawer/modal open | Low |
| 2 | **Leave Types** | 5 | Medium — 3 endpoints to wrap | High — used in leave drawer, credits table, table filters, settings | Low |
| 3 | **Settings** | 4 | Medium — per-key vs all distinction | High — settings loaded across many components | Low |
| 4 | **Notification Rules** | 1 | Low | Low — single component | Low |

## Recommended Migration Order

1. **Shifts first** — closest analog to the completed branches migration. Same pattern: standalone `useEffect`, reference data, dropdown/form usage. 3 call sites only. Mutation invalidation already partially in place.

2. **Leave types second** — 5 call sites across leave module, all reference data. Three endpoints to wrap but each is a simple `useQuery` call.

3. **Settings third** — requires more thought (per-key vs all, dynamic key parameter). The `useAllSettings` hook needs an `enabled` guard since some settings pages only load when their tab is active.

## Do Not Cache Yet

- **Leave credits per user** (`leaveService.getLeaveCredits()`) — already partially cached behind `useLeaveCredits` in Dashboard. For employee-level use, needs user-specific query keys.
- **Employee list queries** — paginated, filter-dependent data. Phase 3D target.
- **Personal leave lists** — mutation-heavy, Phase 3D target.
- **Dashboard today-status** — real-time data, 15s stale time already applied. No further caching needed.

## Suggested Phase 3C.2 Implementation Target

**Shifts** — implement `useActiveShifts` and `useShifts` hooks, migrate `EmployeeDrawer.tsx`, `RotationPatterns.tsx`, and `ShiftManagement.tsx`.

## Validation Notes

- `npx tsc --noEmit` must pass after each migration
- Each hook should follow the same pattern as `useBranches.ts`
- Inline types in `.map()` callbacks (follow existing pattern)
- No shared type files unless required by TypeScript
- Mutations (`createShift`, `updateShift`, `deleteShift`) should have `onSuccess` invalidation added as a follow-up (Phase 3E), not required for Phase 3C.2
