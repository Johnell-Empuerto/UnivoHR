# Phase 4A.2 Middleware Testing Report

## Summary

Phase 4A.2 added **4 new middleware test suites** with **51 new tests**, covering all 4 critical Express middleware files in the UnivoHR backend. A `jest.mock()` strategy was applied to safely test the permission middleware without connecting to a real database. No new npm packages were added. No production business logic was changed. Total: **11 test suites, 192 tests, all passing in 1.1s**.

## Current Test Baseline

Before Phase 4A.2:
- 7 test suites, 163 tests, 0.6s

After Phase 4A.2:
- **11 test suites, 192 tests, 1.1s**
- All 192 tests pass without any real database connection

## Tests Added

### 1. `tests/roleMiddleware.test.js` — Role guard (7 tests)

**Source:** `middleware/role.middleware.js` — `authorize(allowedRoles)` middleware factory.

**DB mocking:** None needed. The middleware only imports `constants/roles.js` (static data).

**Pattern:** Jest mock functions for `req`, `res`, `next`.

| Test | Scenario |
|------|----------|
| allows ADMIN when ADMIN is required | ADMIN → next() called |
| blocks EMPLOYEE when only ADMIN is required | EMPLOYEE → 403 |
| returns 401 when req.user is missing | No user → 401 |
| calls next() when role is allowed | EMPLOYEE in [ADMIN, EMPLOYEE] → next() |
| returns 403 with correct structure | Verifies message, required, yourRole |
| allows any role in allowedRoles | MANAGER in [MANAGER, ADMIN] → next() |
| ROLES constants are correct | Sanity check on constants/roles.js |

### 2. `tests/errorHandler.test.js` — Error handler (7 tests)

**Source:** `middleware/errorHandler.js` — Express error-handling middleware.

**DB mocking:** None needed. Pure middleware with no external imports.

**Pattern:** Jest mock functions for `req`, `res`, `next`.

| Test | Scenario |
|------|----------|
| returns 400 for ValidationError | ValidationError(err) → status 400 |
| returns 500 for generic Error | Error → status 500 |
| includes stack in development | NODE_ENV=development → stack property |
| suppresses stack in production | NODE_ENV=production → no stack |
| falls back to Internal Server Error | err with no message → "Internal Server Error" |
| preserves custom status codes | err.status = 422 → status 422 |
| suppresses full stack in production | NODE_ENV=production → only message |

### 3. `tests/validateMiddleware.test.js` — Joi validation middleware (6 tests)

**Source:** `middleware/validate.middleware.js` — `validate(schema)` middleware factory.

**DB mocking:** None needed. Pure middleware with no external imports.

**Pattern:** Mock schema object with `validate` method.

| Test | Scenario |
|------|----------|
| calls next() when body passes | Valid → next() called |
| returns 400 when body is invalid | Invalid → 400 with first error message |
| only validates req.body | query/params not validated |
| does not mutate req.body on pass | req.body unchanged |
| picks first error from multiple Joi details | Multiple errors → first message shown |
| handles null body gracefully | null body → 400 |

### 4. `tests/permissionMiddleware.test.js` — Permission guard (9 tests)

**Source:** `middleware/permission.middleware.js` — `requirePermission(...keys)` middleware factory.

**DB mocking:** `jest.mock("../services/permission.service")` at module level. This intercepts the `require()` call in the middleware and replaces `hasPermission` with a `jest.fn()`. The real permission service (and its `permission.model.js` → `config/db.js` chain) never executes, so no database connection is attempted.

**Pattern:** Jest mock function for `hasPermission` with `mockResolvedValue(true/false)`.

| Test | Scenario |
|------|----------|
| returns 401 when req.user is missing | No user → 401 |
| allows ADMIN without permission check | ADMIN → next(), hasPermission NOT called |
| blocks EMPLOYEE when hasPermission returns false | Not allowed → 403 |
| allows EMPLOYEE when hasPermission returns true | Allowed → next() |
| calls hasPermission with correct args | Verifies (user, key) signature |
| checks multiple permission keys | Two keys → hasPermission called twice |
| returns required as array for multiple keys | 403 response uses array format |
| returns 500 on hasPermission rejection | Exception → 500 |
| handler is reusable across multiple calls | Multiple invocations work correctly |

## Middleware Covered

| Middleware | File | Tested? | Tests | DB Mock Needed? |
|------------|------|---------|-------|-----------------|
| Role guard | `middleware/role.middleware.js` | ✅ | 7 | No |
| Error handler | `middleware/errorHandler.js` | ✅ | 7 | No |
| Joi validation | `middleware/validate.middleware.js` | ✅ | 6 | No |
| Permission guard | `middleware/permission.middleware.js` | ✅ | 9 | Yes (jest.mock) |

## DB Mocking Approach

### Strategy: `jest.mock()` at test module level

For the permission middleware, the import chain is:
```
permission.middleware.js → services/permission.service.js → models/permission.model.js → config/db.js (real PG Pool)
```

In `tests/permissionMiddleware.test.js`:
```js
jest.mock("../services/permission.service");
```

This single line:
1. Tells Jest to replace `../services/permission.service` with an auto-mock when the middleware module imports it
2. The real `permission.service.js` (and its entire dependency chain to `config/db.js`) never executes
3. `hasPermission` is replaced with `jest.fn()` that returns `undefined` by default
4. Test cases then call `hasPermission.mockResolvedValue(true)` or `.mockResolvedValue(false)` to control behavior

### Verification that no real DB was used

- Tests run in **0.736s** (Phase 4A.1) → **1.115s** (Phase 4A.2) — no slow DB connection attempts
- No `ECONNREFUSED` errors, no `connect ECONNREFUSED 127.0.0.1:5432` errors
- All 192 tests pass without PostgreSQL being available
- No `__mocks__/` directory was created — the mock is entirely test-local

## Validation Commands and Results

```
> npm test

Test Suites: 11 passed, 11 total
Tests:       192 passed, 192 total
Snapshots:   0 total
Time:        1.115 s
```

All 192 tests pass. No real database connection was used during tests.

## Bugs Found / Fixed

**No bugs found** during Phase 4A.2. All four middleware files behaved as expected:

- `role.middleware.js`: Correctly returns 401 for missing user, 403 for wrong role, calls `next()` for allowed role
- `errorHandler.js`: Correctly suppresses stack traces in production, preserves them in development, handles ValidationError status 400
- `validate.middleware.js`: Correctly delegates to Joi, returns 400 with first error message, does not touch query/params
- `permission.middleware.js`: Correctly bypasses permission checks for ADMIN, delegates to `hasPermission` for non-ADMIN, returns appropriate status codes

## Areas Still Not Covered

1. **Branch access middleware** (`middleware/branchAccess.middleware.js`) — Requires DB queries. Needs `jest.mock()` on `../utils/branchAccess` or `../config/db`.

2. **Auth middleware** (`middleware/auth.middleware.js`) — Verifies JWT tokens against a token blacklist in Redis. Requires mocking `jsonwebtoken` and `redis`. Higher complexity.

3. **Rate limit middleware** (`middleware/rateLimit.middleware.js`) — Express rate-limit integration. Mostly configured via express-rate-limit package.

4. **Upload middleware** (`middleware/upload.middleware.js`, `middleware/employeeUpload.middleware.js`) — File upload via Multer. Requires mocking file system operations.

5. **Payroll lock middleware** (`middleware/payrollLock.middleware.js`) — Checks payroll lock status in database. Requires DB mock.

6. **Device auth middleware** (`middleware/perDeviceAuth.middleware.js`) — Validates device API keys. Requires crypto mocking or test fixtures.

7. **Logger middleware** (`middleware/logger.js`) — Morgan-based HTTP logging. Low priority.

8. **API integration tests** (health endpoint, auth login, etc.) — Still blocked by `config/db.js` connecting to PostgreSQL at import time. Even with `jest.mock()` on specific services, any test that requires the Express app instance (`Backend/index.js`) will need a comprehensive mocking strategy for all DB-dependent modules, or a `jest.mock('pg')` at the config level.

## Risks / Blockers

1. **Permission middleware tests rely on `jest.mock()` being hoisted.** The `jest.mock()` call must be at the top of the file and Jest's hoisting mechanism handles it. This is standard Jest behavior but means the mock strategy must be understood before writing similar tests for other middleware.

2. **`errorHandler.test.js` mutates `process.env.NODE_ENV`.** The test changes `process.env.NODE_ENV` temporarily and restores it in `afterEach`. If other middleware or code paths depend on `NODE_ENV` during test setup, this could cause flakiness. Currently no issues, but worth noting.

3. **`validate.middleware.test.js` uses a mock schema object.** This works because the middleware only calls `schema.validate(body)`. It does NOT test the actual Joi integration — just the middleware's handling of the return value. True Joi schema validation testing would require real Joi schemas.

## Recommended Phase 4A.3

### Next testing phase should focus on:

1. **Add branch access middleware tests** — Test `middleware/branchAccess.middleware.js` using `jest.mock()` on `../utils/branchAccess` to intercept the DB-dependent functions (`getUserBranchIds`, `canAccessBranch`).

2. **Extract and test `auth.middleware.js`** — The auth middleware verifies JWT tokens. Most of its logic is pure (token decoding, header parsing) but it calls a Redis-based token blacklist. Extract the pure token parsing logic or mock Redis.

3. **Test `payrollLock.middleware.js`** — A simple middleware that checks a boolean in the database. Can be tested with `jest.mock()` on its model dependency.

4. **Add a `config/__mocks__/db.js`** — Create a Jest manual mock for `config/db.js` that exports a mock `pool` with `jest.fn()` for `query()` and `connect()`. This would unlock testing of any model or service that imports the pool directly, without needing to mock each service individually.

5. **Add Supertest for health endpoint** — After the DB mock foundation is solid, add `supertest` as a dev dependency and test `GET /api/health` with a mocked DB pool.

6. **Test `inputSanitizer.js` edge cases** — While already tested (Phase 4A.1), additional edge cases like deeply nested HTML, very long strings, or unicode normalization could be added.
