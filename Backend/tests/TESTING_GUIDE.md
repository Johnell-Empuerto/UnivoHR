# Backend Testing Guide

## Stack

| Tool | Version / Config |
|---|---|
| **Jest** | `jest --runInBand` via `Backend/package.json` |
| **Supertest** | HTTP assertion library for endpoint tests |
| **msnodesqlv8** (mocked) | Database driver, never called in tests |

---

## Test Categories

### 1. Pure Utility Tests (no mocks needed)

Require the module directly; test pure functions with `describe`/`it`/`test` blocks.

| File | Module Under Test | Lines |
|---|---|---|
| `payrollFormula.test.js` | `utils/payrollFormula.helper` | 477 |
| `inputSanitizer.test.js` | `utils/inputSanitizer` | 125 |
| `passwordValidator.test.js` | `utils/passwordValidator` | 94 |
| `branchAccess.test.js` | `utils/branchAccess` (normalizeBranchId only) | 43 |
| `deviceKey.test.js` | `utils/deviceKey` | 78 |
| `permissions.test.js` | `constants/permissions` + `constants/roles` | 77 |
| `validationError.test.js` | `utils/ValidationError` | 36 |

**Pattern:**
```js
const { fn } = require("../utils/module");

describe("fn", () => {
  it("does something", () => {
    expect(fn(input)).toBe(expected);
  });
});
```

---

### 2. Middleware Unit Tests (mock `req`/`res`/`next`)

Create fresh `req`, `res` (with `jest.fn()` spies), and `next` in `beforeEach`. Some middleware also need `jest.mock()` for services or DB.

| File | Module Under Test | Mocks | Lines |
|---|---|---|---|
| `roleMiddleware.test.js` | `middleware/role.middleware` | None (depends on ROLES constant) | 90 |
| `errorHandler.test.js` | `middleware/errorHandler` | None (tests error shapes) | 94 |
| `validateMiddleware.test.js` | `middleware/validate.middleware` | Inline schema object | 108 |
| `permissionMiddleware.test.js` | `middleware/permission.middleware` | `jest.mock("../services/permission.service")` | 136 |
| `branchAccessMiddleware.test.js` | `middleware/branchAccess.middleware` | `jest.mock("../utils/branchAccess", …)` | 245 |
| `payrollLockMiddleware.test.js` | `middleware/payrollLock.middleware` | `jest.mock("../config/db", …)` | 111 |
| `authMiddleware.test.js` | `middleware/auth.middleware` | `jest.mock("jsonwebtoken")`, mock tokenBlacklist service | 148 |
| `perDeviceAuthMiddleware.test.js` | `middleware/perDeviceAuth.middleware` | `jest.mock("../config/db", …)`, `jest.mock("../utils/deviceKey")` | 234 |

**Pattern:**
```js
jest.mock("../services/dep");

const middleware = require("../middleware/module");

describe("middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: null, /* … */ };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it("calls next() on success", () => {
    req.user = { role: "ADMIN" };
    middleware(["ADMIN"])(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("returns 403 on failure", () => {
    req.user = { role: "USER" };
    middleware(["ADMIN"])(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
  });
});
```

---

### 3. Supertest Integration Tests (isolated Express app)

For every endpoint file, create a **dedicated Express app** with only the route(s) under test. Use `supertest(app)` to issue HTTP requests. Mock external services with `jest.mock()` at the top of the file.

| File | Under Test | Mocks | Lines |
|---|---|---|---|
| `healthEndpoint.test.js` | Inline GET `/api/health` | None | 68 |
| `rootEndpoint.test.js` | Inline GET `/` | None | 42 |
| `authEndpoint.test.js` | `controllers/auth.controller` | `jest.mock("../services/auth.service")`, `jest.mock("../services/audit.service")` | 263 |

**Pattern:**
```js
jest.mock("../services/dep");

const express = require("express");
const request = require("supertest");
const controller = require("../controllers/module");

function createApp() {
  const app = express();
  app.use(express.json());
  app.get("/api/route", controller.handler);
  return app;
}

describe("GET /api/route", () => {
  const app = createApp();

  it("returns 200", async () => {
    const res = await request(app).get("/api/route");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("key");
  });

  it("returns 400 for missing input", async () => {
    depService.mockReturnValue(false);
    const res = await request(app).get("/api/route");
    expect(res.status).toBe(400);
  });
});
```

---

## Mock Patterns

### Manual mock for `config/db`
`Backend/config/__mocks__/db.js` — auto-picked up by Jest when any test calls `jest.mock("../config/db", …)`:

```js
module.exports = {
  query: jest.fn(),
  connect: jest.fn().mockResolvedValue({ query: jest.fn(), release: jest.fn() }),
  end: jest.fn(),
};
```

### Inline factory mock for `utils/branchAccess`
Used when the real module has complex internals we want to replace partially:

```js
jest.mock("../utils/branchAccess", () => ({
  getUserBranchIds: jest.fn(),
  normalizeBranchId: jest.fn(),
}));
```

Some tests (e.g. `branchAccessMiddleware.test.js`) re-implement `normalizeBranchId` inline so negative/invalid cases throw real errors.

### Service mock
```js
jest.mock("../services/auth.service", () => ({
  login: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  refreshToken: jest.fn(),
  extractReqInfo: jest.fn(),
}));
```

---

## Running Tests

```bash
cd Backend
npm test          # jest --runInBand
npm run test:watch  # (not yet configured)
```

| Command | What it does |
|---|---|
| `npm test` | Runs all `Backend/tests/*.test.js` files sequentially |
| `npx jest --listTests` | Lists all test files Jest would run |
| `npx jest path/to/test` | Runs a single test file |

---

## Conventions

| Aspect | Convention |
|---|---|
| File location | `Backend/tests/<name>.test.js` |
| `describe` label | Module or function path, e.g. `"auth.middleware authenticate()"` |
| `it`/`test` label | Plain English: `"returns 401 when no token is provided"` |
| No `beforeAll`/`afterAll` with real resources | All dependencies are mocked; no real DB, no real HTTP server |
| `jest.clearAllMocks()` | Called in `beforeEach` when mocks are used |
| `afterEach` | Restore `NODE_ENV` or other globals if modified |

---

## Adding a New Test

1. Create `Backend/tests/<name>.test.js`
2. Add `jest.mock(...)` calls at the top if the module under test has external dependencies
3. For middleware tests: set up `req`/`res`/`next` in `beforeEach`
4. For endpoint tests: create a minimal Express app inline
5. Run `npm test` to confirm the new test passes and no existing tests are broken

---

## Real `app.js` Integration Tests

`Backend/app.js` exports the full Express application with all routes and middleware. It can be imported in tests to validate the real route tree without starting the backend server.

**`Backend/index.js` must never be imported in tests** — it creates HTTP server, Socket.IO, Bull queues, scheduler, workers, and calls `server.listen()`.

### Pattern

```js
// 1. Set required env vars before jest.mock()
process.env.JWT_SECRET = "test-secret";
process.env.DB_HOST = "localhost";
// ... other env vars ...

// 2. Mock all modules with import-time side effects
jest.mock("../config/db", () => ({
  query: jest.fn(),
  connect: jest.fn().mockResolvedValue({ query: jest.fn(), release: jest.fn() }),
  end: jest.fn(),
}));

jest.mock("../config/redis", () => ({
  on: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  quit: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../services/queue.service", () => ({
  payslipQueue: { close: jest.fn().mockResolvedValue(undefined) },
  hrFormQueue: { close: jest.fn().mockResolvedValue(undefined) },
  addPayslipToQueue: jest.fn(),
  addBulkPayslipsToQueue: jest.fn(),
  addBulkAssignmentJob: jest.fn(),
}));

jest.mock("../services/deviceProcessing.queue", () => ({
  deviceProcessingQueue: { process: jest.fn(), on: jest.fn(), close: jest.fn().mockResolvedValue(undefined) },
  isReady: jest.fn().mockResolvedValue(false),
}));

// uuid ships ESM-only and causes Jest parse errors when importing the route tree
jest.mock("uuid", () => ({ v4: jest.fn().mockReturnValue("00000000-0000-0000-0000-000000000000") }));

// 3. Import app after mocks (jest.mock is hoisted above require)
const request = require("supertest");
const app = require("../app");

// 4. Write tests against the real app
describe("GET /api/health", () => {
  it("returns 200", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
  });
});
```

### Why Each Mock Is Required

| Module | Reason |
|---|---|
| `../config/db` | Creates `new Pool()` at require time; routes transitevely import this |
| `../config/redis` | Calls `redisClient.connect()` at module load time |
| `../services/queue.service` | Creates Bull queues that attempt Redis connection |
| `../services/deviceProcessing.queue` | Creates Bull queue that attempts Redis connection |
| `uuid` | Ships ESM-only; Node.js `require()` fails on ESM syntax without transform |

### Currently Tested Routes via `app.js`

| Route | Auth | Expected Status |
|---|---|---|
| `GET /api/health` | None | 200 |
| `GET /` | None | 200 |
| `GET /api/does-not-exist` | None | 404 |
| `GET /api/employees` | None | 401 (rejected by auth middleware) |

See `appIntegration.test.js` for the reference implementation.

---

## Current Phase 4A Baseline

| Metric | Value |
|---|---|
| Test suites | 19 |
| Total tests | 286 |
| Real `app.js` integration test | `appIntegration.test.js` |
| Backend startup | Through `Backend/index.js` (not `app.js`) |
| Express app export | `Backend/app.js` |
| Real DB/Redis connections in tests | None (all mocked) |
| CI integration | Not yet configured (planned for Phase 4B) |
