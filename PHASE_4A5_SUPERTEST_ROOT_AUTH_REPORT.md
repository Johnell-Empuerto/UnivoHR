# Phase 4A.5 Supertest Root and Auth Report

## Summary

Phase 4A.5 added 2 new Supertest integration test files covering the root endpoint and auth validation/error paths. The root endpoint test follows the same inline-Express-app pattern as Phase 4A.4 (no production imports). The auth endpoint test uses `jest.mock()` with explicit factories for both `auth.service` and `audit.service` to safely import the real controller without triggering any DB, Redis, or server side effects.

Total: **18 test suites, 270 tests, all passing in 4.3s** — no PostgreSQL, no Redis, no server start, no `index.js` import.

## Current Test Baseline

Before Phase 4A.5:
- 16 test suites, 248 tests, 3.96s

After Phase 4A.5:
- **18 test suites, 270 tests, 4.3s**
- Zero real database connections
- Zero real Redis connections
- Clean Jest exit

## Root Endpoint Test Added

**File:** `tests/rootEndpoint.test.js`

**Source:** `Backend/index.js:272-277`

**Strategy:** Inline minimal Express app mirroring the production root endpoint.

```js
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Payroll and Attendance System",
    version: "1.0.0",
  });
});
```

**Tests (5):**

| Test | Verifies |
|------|----------|
| Returns 200 | HTTP status code |
| JSON content-type | `application/json` header |
| `message` field | Welcome string value |
| `version` field | "1.0.0" string value |
| Exactly 2 fields | `message` and `version` only |

## Auth Endpoint Analysis

### Dependency Chain

```
tests/authEndpoint.test.js
  → controllers/auth.controller.js
    → services/auth.service.js       ← MOCKED with jest.mock() + factory
    → services/audit.service.js       ← MOCKED with jest.mock() + factory
```

### Why mocking is required

The real `auth.service.js` has heavy side effects at module load time:

| Side Effect | File | Impact |
|-------------|------|--------|
| `const redisClient = require("../config/redis")` | `auth.service.js:12` | Eager Redis connection via IIFE |
| `if (!process.env.JWT_SECRET) throw ...` | `auth.service.js:18-20` | Process crash if env missing |
| `require("../models/auth.model")` | `auth.service.js:1` | Creates PG Pool |
| `require("../models/session.model")` | `auth.service.js:3` | Creates PG Pool |

The real `audit.service.js` imports `config/db.js` (creates lazy PG Pool). Both are safely intercepted by `jest.mock()` factories.

### Mocking Strategy

```js
jest.mock("../services/auth.service", () => ({
  login: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  refreshToken: jest.fn(),
  extractReqInfo: jest.fn(),
}));

jest.mock("../services/audit.service", () => ({
  auditLog: jest.fn(),
  fetchOldValues: jest.fn(),
  log: jest.fn(),
}));
```

Both use explicit factories — the real module files never execute. No DB Pool, no Redis connection, no JWT_SECRET check.

The controller (`controllers/auth.controller.js`) is a clean module with only two `require` statements and no IIFE or initialization side effects. It imports safely from the mocked modules.

The controller's handlers are mounted directly on a minimal Express app:
```js
const app = express();
app.use(express.json());
app.post("/api/auth/login", controller.login);
app.post("/api/auth/forgot-password", controller.forgotPassword);
app.post("/api/auth/reset-password", controller.resetPassword);
app.post("/api/auth/refresh", controller.refresh);
```

The auth route module (`routes/auth.routes.js`) is **not** imported — it would also pull in `middleware/rateLimit.middleware` and `middleware/auth.middleware`. Mounting the controller handlers directly is simpler and equally effective for testing request/response behavior.

## Auth Endpoint Tests Added

**File:** `tests/authEndpoint.test.js` — 4 describe blocks, 16 tests.

### POST /api/auth/login — error path (4 tests)

Tests the controller's catch-and-return-401 pattern.

| Test | Verifies |
|------|----------|
| Service throws → 401 with error message | Error passthrough |
| Body and req passed to service | Argument verification |
| 401 response is JSON with message | Response shape |
| Empty body passed through | Edge case |

### POST /api/auth/forgot-password — validation (4 tests)

Tests the controller's inline validation (`if (!username || !username.trim())`).

| Test | Verifies |
|------|----------|
| Missing username → 400 | Required field |
| Empty username → 400 | Trim check |
| Whitespace only → 400 | Trim check |
| Valid username → calls service | Happy path |

### POST /api/auth/reset-password — validation (6 tests)

Tests the controller's inline validation (`if (!user_id || !otp || !new_password)`).

| Test | Verifies |
|------|----------|
| Missing user_id → 400 | Required field |
| Missing otp → 400 | Required field |
| Missing new_password → 400 | Required field |
| All missing → 400 | Complete validation |
| All present → calls service | Happy path |
| Service error → 400 with message | Error passthrough |

### POST /api/auth/refresh — validation (3 tests)

Tests the controller's inline validation (`if (!refreshToken)`).

| Test | Verifies |
|------|----------|
| Missing token → 400 | Required field |
| Valid token → calls service with reqInfo | Happy path |
| Service error → 401 with message | Error passthrough |

## App Import Strategy

| File | Strategy | Imported? |
|------|----------|-----------|
| `Backend/index.js` | **Never imported** — starts server, Socket.IO, workers | ❌ |
| `routes/auth.routes.js` | **Not imported** — would pull in rate limit + auth middleware | ❌ |
| `controllers/auth.controller.js` | **Imported** — clean module, only `require` statements | ✅ |
| `services/auth.service.js` | **Mocked** — factory prevents Redis/DB/JWT_SECRET side effects | ✅ (mock) |
| `services/audit.service.js` | **Mocked** — factory prevents DB Pool creation | ✅ (mock) |

## Validation Commands and Results

```
> npm test

Test Suites: 18 passed, 18 total
Tests:       270 passed, 270 total
Time:        4.307 s
Ran all test suites.
```

- ✅ No real PostgreSQL connection
- ✅ No real Redis connection
- ✅ No backend server started
- ✅ `Backend/index.js` never imported
- ✅ All 270 tests pass
- ✅ Clean Jest exit

## Bugs Found / Fixed

**No bugs found** in production code during Phase 4A.5.

One **test issue** was fixed: `authService.extractReqInfo` auto-mock returned `undefined` by default, causing `refreshToken()` to receive `undefined` as its second argument instead of a reqInfo object. Fixed by providing a default mock return value in `beforeEach`. This is a test setup issue, not a production bug.

## Areas Still Not Covered

1. **Full auth integration** — Successful login flow (user lookup + password verify + session create + token issue) requires real DB, Redis, and bcrypt. Cannot be tested without a test database or extensive mocking of the entire auth service chain.

2. **Auth routes with rate limiting** — The `routes/auth.routes.js` module could not be imported safely without also mocking `middleware/rateLimit.middleware`. If rate limiter mocking is added, the full route wiring could be tested.

3. **Protected endpoint tests** — Routes behind `authenticate` middleware (`logout`, `changePassword`) need a valid JWT token. Could be tested by either: (a) using the real auth middleware with a JWT mock (already tested in Phase 4A.3), or (b) creating a test-only middleware that sets `req.user`.

4. **Remaining controllers** — Employee, payroll, leave, and other controllers all require heavy DB-dependent service mocking. Not yet attempted.

## Risks / Blockers

1. **Auth service is tightly coupled to Redis and DB.** The `login` function in `auth.service.js` directly accesses Redis (user cache, login attempts, token blacklist) and PostgreSQL (user lookup, sessions, permissions, audit). Extracting pure validation logic from the service would significantly improve testability.

2. **Controller tests test the mock layer, not the real service.** The auth endpoint tests verify:
   - Controller properly catches service errors → 401/400
   - Controller properly validates required fields
   - Controller passes correct arguments to service
   
   They do **not** verify the actual business logic (password comparison, token generation, session management). This is acceptable for now — the controller's orchestration logic is tested, while the service's business logic remains untested due to DB/Redis coupling.

3. **No test for successful login response shape.** Since we don't test success (it requires the real service), we don't verify the controller passes through the full success response. The `refresh` test does verify success shape because it only needs the mocked service.

## Recommended Phase 4A.6

### Next testing phase should focus on:

1. **Add a testing guide** — Create `Backend/tests/TESTING_GUIDE.md` documenting patterns from Phases 4A.1–4A.5:
   - Mocking `config/db` (manual mock + explicit factories)
   - Middleware unit tests (mock req/res/next)
   - Supertest with inline Express apps
   - Controller tests with mocked services
   - Preventing real DB/Redis connections
   - Naming conventions

2. **Refactor `Backend/index.js`** — Extract `app` creation into a separate `app.js` file that exports the Express app without calling `listen()`. This is the single biggest unlock for full integration tests. Requires careful extraction to not change behavior.

3. **Add more controller tests** — If the pattern from this phase is approved, apply it to other controllers that have inline validation logic (e.g., employee creation validation, leave request validation).

4. **Add a simple E2E smoke test** — If app extraction is done (step 2), add a single smoke test that imports the app, mocks config/db, and verifies the app starts without crashing.
