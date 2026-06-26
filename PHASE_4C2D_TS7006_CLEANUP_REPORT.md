# Phase 4C.2D TS7006 Cleanup Report

## Summary

Phase 4C.2D typed the local `leaveTypes` array in `LeaveConversionSettings.tsx`, allowing all callbacks over that array to inherit a single narrow item type.

- TypeScript errors: **42 → 32**
- TS7006 errors: **17 → 7**
- Ten grouped TS7006 diagnostics were resolved by one local array type.
- Rendering and application logic were unchanged.

## Files Changed

- `Frontend/src/features/leaves/components/LeaveConversionSettings.tsx`
- `PHASE_4C2D_TS7006_CLEANUP_REPORT.md`

## TS7006 Errors Fixed

The local `LeaveTypeConfig` interface now describes only the fields already used by this component:

- `id`
- `name`
- `code`
- `is_paid`
- `is_convertible`
- `max_convertible_days`

Typing `leaveTypes` as `LeaveTypeConfig[]` resolved:

1. The `index` parameter in the main `leaveTypes.map` callback.
2. Nine `t` parameters used by `filter`, `map`, and `find` callbacks in the configuration summary and preview.

## Local Validation

### `npm run build`

**Result:** Still fails during `tsc -b`, as expected.

- Before: 42 TypeScript errors
- After: 32 TypeScript errors
- Reduction: 10
- Remaining TS7006 errors: 7

### `npx vite build`

**Result:** Passed.

- 3,809 modules transformed
- Production assets generated successfully
- Existing large-chunk warnings remain

## Remaining First 10 TypeScript Errors

1. `AttendanceTable.tsx:172` — TS2345: nullable string passed to a parameter that does not accept `null`.
2. `AttendanceTable.tsx:190` — TS2345: nullable string passed to a parameter that does not accept `null`.
3. `AttendancePage.tsx:145` — TS18047: `user` is possibly `null`.
4. `Calendar.tsx:1311` — TS2339: `skipped` is missing from the declared result type.
5. `BulkImportDialog.tsx:476` — TS2339: `filename` is missing from `ImportHistoryItem`.
6. `HrFormAssignmentsPage.tsx:51` — TS2554: a required function argument is missing.
7. `HrFormAssignmentsPage.tsx:102` — TS2353: `assign_all_matching` is absent from the declared request type.
8. `SelfEvaluationPage.tsx:48` — TS2554: function is called with too many arguments.
9. `MyManHoursReport.tsx:494` — TS2322: callback detail types are incompatible.
10. `PayrollGenerate.tsx:179` — TS7006: callback parameter `b` implicitly has type `any`.

## What Was Not Changed

- No other frontend source file
- No nullable user/session errors
- No missing-property, wrong-argument-count, or request/response shape errors
- No API calls or service functions
- No backend code
- No payroll, attendance, leave, recruitment, employee, permission, authentication, device, route, UI, database, or migration behavior
- No Docker, PostgreSQL, Redis, dependency fixes, commits, or pushes

## Recommended Next Step

Run another separately authorized TS7006-only batch for the seven remaining callback parameters, beginning with the branch callback in `PayrollGenerate.tsx`.
