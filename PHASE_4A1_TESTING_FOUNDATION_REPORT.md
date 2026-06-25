# Phase 4A.1 Testing Foundation Report

## Summary

Phase 4A.1 established a production-readiness testing foundation for the UnivoHR backend. The existing test infrastructure (Jest 30.4.2, 3 test suites, 122 tests) was already functional, covering payroll formula helpers, input sanitization, and password validation. This phase added **4 new test suites** with **41 new tests** for uncovered critical areas: branch access normalization, device key generation/validation, permission/role constant consistency, and the ValidationError class.

Total: **7 test suites, 163 tests, all passing** in 0.7s.

## Current Testing Setup Found

- **Test runner:** Jest 30.4.2 (already installed as devDependency)
- **Test script:** `npm test` → `jest --runInBand` (already configured)
- **No jest.config.js** — Jest auto-discovers `tests/*.test.js` using defaults
- **No babel config needed** — all source files use CommonJS (`require`/`module.exports`)
- **3 existing test files** (122 tests):
  - `tests/payrollFormula.test.js` — comprehensive coverage of `utils/payrollFormula.helper.js` (all 15 exported functions)
  - `tests/inputSanitizer.test.js` — covers `utils/inputSanitizer.js` (all 4 exported functions)
  - `tests/passwordValidator.test.js` — covers `utils/passwordValidator.js` (`validatePassword`)
- **1 test plan:** `tests/PAYROLL_TEST_PLAN.md` — documents 14 payroll test cases that require extracting logic from `models/payroll.model.js` or a test database

## Packages Added or Reused

- **No new packages added.** Jest 30.4.2 was already in `devDependencies`.

## Test Scripts Added

- **No new scripts added.** `"test": "jest --runInBand"` was already in `Backend/package.json`.

## Tests Created

### 1. `tests/branchAccess.test.js` — `normalizeBranchId` (10 tests)

**Source:** `utils/branchAccess.js` — a pure function that validates and normalizes branch IDs.

**Why safe:** Pure function. No database or external dependencies. Tests cover:
- Returns `null` for `undefined`, `null`, empty string, `"all"`
- Parses numeric strings and numbers to integers
- Throws `Error` for non-integer strings, floats, zero, negative numbers

**No database required.**

### 2. `tests/deviceKey.test.js` — device key crypto functions (14 tests)

**Source:** `utils/deviceKey.js` — three pure functions: `generateDeviceKey`, `hashDeviceKey`, `validateDeviceKey`.

**Why safe:** Pure functions using only Node.js `crypto` module. Tests cover:
- `generateDeviceKey`: returns `dev_`-prefixed string, minimum length, unique on each call
- `hashDeviceKey`: returns 64-char hex SHA-256, deterministic, different for different inputs, handles empty string
- `validateDeviceKey`: valid pair returns `true`, invalid pair returns `false`, null/empty inputs return `false`

**No database required.**

### 3. `tests/permissions.test.js` — permission and role constants (11 tests)

**Source:** `constants/permissions.js` and `constants/roles.js` — static data exports.

**Why safe:** Pure data validation of constants. Tests cover:
- `ALL_PERMISSIONS`: is non-empty array, all entries use valid naming conventions, no duplicates
- `PERMISSION_GROUPS`: all groups are non-empty arrays, every group permission exists in `ALL_PERMISSIONS`, every `ALL_PERMISSIONS` entry appears in at least one group (bidirectional integrity check)
- `EMPLOYEE_DEFAULT_PERMISSIONS`: is subset of `ALL_PERMISSIONS`, no duplicates, smaller than full set
- `ROLES`: defines `ADMIN` and `EMPLOYEE` constants, exactly 2 roles

**No database required.**

### 4. `tests/validationError.test.js` — ValidationError class (6 tests)

**Source:** `utils/ValidationError.js` — a custom error class.

**Why safe:** Simple class test, no database. Tests cover:
- Is instance of both `Error` and `ValidationError`
- Has `status` property set to 400
- Stores and retrieves the error message
- Can be thrown and caught with `toThrow`
- Has correct `name` property (bug fix applied)

**No database required.**

### Bug Fix Applied

A minor bug was found and fixed in `utils/ValidationError.js`:

- **Issue:** `ValidationError.name` returned `"Error"` instead of `"ValidationError"` because ES6 subclasses of `Error` do not automatically set the `name` property.
- **Fix:** Added `this.name = "ValidationError"` in the constructor.
- **Impact:** Enables correct `instanceof`-independent identification via `err.name`, consistent with JavaScript's built-in error subclass convention.
- **Safety:** Not a business logic change; it is a class definition fix for proper error identification.

## Critical Areas Covered

| Area | Status | Tests |
|------|--------|-------|
| Auth password validation | ✅ Previously covered | 12 tests in `passwordValidator.test.js` |
| Input sanitization | ✅ Previously covered | 29 tests in `inputSanitizer.test.js` |
| Payroll formula helpers | ✅ Previously covered | 81 tests in `payrollFormula.test.js` |
| Branch access helper (pure) | ✅ **New** | 10 tests in `branchAccess.test.js` |
| Device key generation/validation | ✅ **New** | 14 tests in `deviceKey.test.js` |
| Permission constants consistency | ✅ **New** | 11 tests in `permissions.test.js` |
| Error class behavior | ✅ **New** (bug fix) | 6 tests in `validationError.test.js` |

## Critical Areas NOT Covered (Priority 1 Gaps)

1. **Role guard middleware behavior** (`middleware/role.middleware.js`) — Requires mock `req`/`res`/`next` objects. Safe to add as a unit test with mocks, but there is no test-double library installed (no `sinon`, no `jest.fn()` — actually Jest has built-in mocks). Could add with Jest function mocks.

2. **Permission helper / hasPermission service** (`services/permission.service.js`) — Requires mocking `permissionModel.hasUserPermission` which calls the database. Can be tested with Jest mocking but depends on understanding the model interface.

3. **Branch access middleware logic** (`middleware/branchAccess.middleware.js`) — Requires DB access. Only the `normalizeBranchId` helper is testable without DB.

4. **Leave type / settings pure helpers** — No pure helpers found. Leave type logic is embedded in models with SQL. Settings are read from `system_settings` table via DB queries.

5. **API integration tests** (health endpoint, auth login failure) — These require either a running server or Supertest with a test database. The backend structure currently connects to PostgreSQL at import time (`config/db.js`), meaning any test that requires the server would hit the real database. This is **risky** without a separate test database or connection mocking.

## Code Quality Observations During Review

- The 3-layer backend (Controller → Service → Model) is cleanly separated, but most business logic lives in Model files with inline SQL, making it hard to unit test without a database.
- `utils/` contains 16 files, of which only 5 had pure/testable functions before this phase.
- `middleware/` contains Express middleware that wraps most of its logic around `req.user`, making unit testing require mocks.
- `services/` and `models/` almost entirely depend on `pool.query()`, which connects to the real database.

## Validation Commands and Results

```
> npm test
Test Suites: 7 passed, 7 total
Tests:       163 passed, 163 total
Time:        0.736 s
```

All 163 tests pass. No linting commands were found/run (no `.eslintrc` or lint script in Backend `package.json`).

## Risks / Blockers

1. **No test database or DB mocking.** Any test that imports a model or service will trigger a real database connection. This is the single biggest blocker for integration tests.

2. **Backend connects to PostgreSQL at module load time.** `config/db.js` creates a pool when imported. Without a `.env` with valid credentials or a mock, tests that touch models/services will attempt a real connection.

3. **No `.eslintrc` or lint command** in the backend. Code style is not enforced.

4. **Payroll calculation logic** is embedded in `models/payroll.model.js` (~1660 lines) as inline SQL inside the `generatePayroll` function. Cannot unit test without extracting pure functions or creating a test DB.

5. **The `ValidationError` `this.name` bug** existed in production code, meaning error handlers relying on `err.name` would not distinguish `ValidationError` from a generic `Error`. Now fixed.

## Recommended Phase 4A.2

### Next testing phase should focus on:

1. **Add Jest mock for `config/db.js`** — Create a `__mocks__/db.js` that provides a mock `pool.query()` function. This would unlock testing for services and middleware.

2. **Test `role.middleware.js` with Jest mocks** — The `authorize` middleware is a pure Express middleware (no DB calls) that only inspects `req.user.role`. Easy to test with Jest mock functions.

3. **Test `errorHandler.js`** — The error handler middleware is pure (no DB calls). Can test with mocked `req`, `res`, `next`.

4. **Test `validate.middleware.js`** — The Joi validation middleware can be tested with mock Joi schemas and mock `req.body`.

5. **Test `permission.middleware.js`** — After adding DB mocks, test the `requirePermission` middleware with mocked `permission.service`.

6. **Add Supertest for health endpoint** — After DB mocking, test `GET /api/health` without hitting a real database.

7. **Extract payroll calculation pure functions** from `models/payroll.model.js` into `utils/payrollFormula.helper.js` (where 15 are already extracted) to enable the 14 test cases documented in `PAYROLL_TEST_PLAN.md`.
