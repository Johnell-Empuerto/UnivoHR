# Phase 4A.7 — App Extraction Plan

## Summary

`Backend/index.js` (344 lines) currently interleaves Express app setup with server startup concerns. Extracting a `Backend/app.js` is architecturally sound and safe for production **provided the extraction is purely mechanical** — no logic changes, no reordering, no refactoring. The extraction enables Supertest integration tests against the real route tree without triggering server startup (Socket.IO, DB connection, Redis queues, scheduler, workers).

However, route files import controllers/services that themselves import `config/db` (creates a Pool), `config/redis` (connects to Redis at require time), and `services/queue.service` (creates Bull queues that connect to Redis). Any test that imports `app.js` **must** `jest.mock()` these modules first.

---

## Current `index.js` Responsibilities (line ranges)

| Lines   | Responsibility                                                                   | Category              |
| ------- | -------------------------------------------------------------------------------- | --------------------- |
| 1–2     | Express app creation                                                             | App setup             |
| 3       | `pool = require("./config/db")` — creates PG Pool object (harmless `new Pool()`) | App setup (import)    |
| 4       | `port` constant                                                                  | Startup               |
| 6–7     | `http.createServer(app)`, `server.timeout`                                       | Startup               |
| 8–11    | `cors`, `helmet`, `compression` requires                                         | App setup (import)    |
| 12–14   | `initSocket(server)` — attaches Socket.IO to HTTP server                         | Startup               |
| 19–44   | Middleware: `helmet()`, `compression()`, `cors()`, body parsers                  | App setup             |
| 49–56   | `GET /api/health` inline route                                                   | App setup             |
| 59–108  | All route module requires (38 files)                                             | App setup (imports)   |
| 110–117 | Middleware requires (authenticate, logger, rate limiter, errorHandler)           | App setup (imports)   |
| 122     | `app.use(logger)`                                                                | App setup             |
| 127     | `app.use("/api/auth", authRoutes)` — public routes                               | App setup             |
| 135–138 | Rate limiter middleware                                                          | App setup             |
| 146–253 | All protected route mounts with `authenticate`                                   | App setup             |
| 255–256 | `queueService` + `deviceProcessingQueue` requires (creates Bull queues → Redis)  | Startup (side effect) |
| 259–260 | `scheduler.startScheduler()`                                                     | Startup               |
| 263–267 | Device processing worker start                                                   | Startup               |
| 272–277 | Root `GET /`                                                                     | App setup             |
| 282–284 | 404 handler                                                                      | App setup             |
| 289     | Error handler                                                                    | App setup             |
| 291–304 | Graceful shutdown handlers (SIGTERM/SIGINT)                                      | Startup               |
| 309–337 | `pool.connect()` then admin permission seeding                                   | Startup               |
| 342–344 | `server.listen(port)`                                                            | Startup               |

---

## Safe App Setup Sections (can move to `app.js`)

Everything marked "App setup" above can move:

1. **Imports that have no runtime side effects** — `express`, `cors`, `helmet`, `compression`, route modules (the `require()` call itself only registers routes; side effects are from the modules' own transitive deps — see Risks)
2. **Middleware registration** — `app.use(helmet())`, `app.use(compression())`, `app.use(cors(...))`, body parsers, logger
3. **Route mounting** — all `app.use("/api/...", ...)` calls
4. **Error/404 handlers** — `app.use((req, res) => {...})`, `app.use(errorHandler)`

---

## Server Startup Sections (must stay in `index.js`)

1. `http.createServer(app)` — needs the `app` object from `app.js`
2. `initSocket(server)` — needs the `server` object
3. `const pool = require("./config/db")` — used for DB connection check + seed
4. `require("./services/queue.service")` — creates Bull queues (Redis)
5. `require("./services/deviceProcessing.queue")` — creates Bull queues (Redis)
6. `scheduler.startScheduler()` — starts cron jobs
7. Device worker start
8. Graceful shutdown handlers
9. `pool.connect()` + admin seed
10. `server.listen(port)`

---

## Side Effects Found

Module-level side effects triggered at `require()` time:

| Module                               | Side Effect                                                                                                                                    |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `config/db.js`                       | `new Pool(poolConfig)` — creates PG pool (harmless; no connect)                                                                                |
| `config/redis.js`                    | `createClient()` + `await redisClient.connect()` — **connects to Redis immediately**                                                           |
| `services/queue.service.js`          | `new Queue("payslip-emails", {redis: ...})`, `new Queue("hr-form-assignments", {redis: ...})` — creates Bull queues, attempts Redis connection |
| `services/deviceProcessing.queue.js` | `new Queue("device-processing", {redis: ...})` — creates Bull queue, attempts Redis connection                                                 |

Any test importing `app.js` (which imports routes → controllers → services → these modules) **must** `jest.mock()` these four modules before the import chain executes.

---

## Proposed File Structure

```
Backend/
├── app.js              ← NEW: Express app creation, middleware, route mounting
├── index.js            ← MODIFIED: imports app, creates server, Socket.IO, startup
├── config/
│   ├── __mocks__/      ← EXISTING: manual Jest mocks
│   ├── db.js
│   ├── redis.js
│   └── socket.js
├── services/
│   ├── queue.service.js
│   └── deviceProcessing.queue.js
├── middleware/
├── routes/
├── controllers/
├── tests/
│   ├── TESTING_GUIDE.md
│   └── *.test.js
```

---

## Proposed `app.js` Content

A new file at `Backend/app.js` containing:

```js
const express = require("express");
const app = express();
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

// ── Security headers ──
app.use(helmet());

// ── Compression ──
app.use(compression());

// ── CORS ──
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
  : ["http://localhost:5173", "http://192.168.0.110:5173"];
app.use(cors({ origin: allowedOrigins, credentials: true }));

// ── Body parser ──
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Logger ──
const logger = require("./middleware/logger");
app.use(logger);

// ── Rate limiter ──
const {
  readOnlyLimiter,
  writeLimiter,
} = require("./middleware/rateLimit.middleware");
app.use((req, res, next) => {
  if (req.method === "GET") return readOnlyLimiter(req, res, next);
  return writeLimiter(req, res, next);
});

// ── Routes ──
const authenticate = require("./middleware/auth.middleware");
const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

// Public health check
app.get("/api/health", (req, res) => {
  /* same as today */
});

// Protected routes
const employeeRoutes = require("./routes/employee.routes");
app.use("/api/employees", authenticate, employeeRoutes);
// ... all 40+ route mounts ...

// Root
app.get("/", (req, res) => {
  /* same as today */
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

module.exports = app;
```

Exactly **no logic changes** — pure mechanical extraction of app.use() statements.

---

## Proposed `index.js` Content

```js
const app = require("./app");
const http = require("http");
const server = http.createServer(app);
server.timeout = Number(process.env.SERVER_TIMEOUT) || 120000;
const port = 3002;

// Socket.IO
const { initSocket } = require("./config/socket");
initSocket(server);

// Queues
const queueService = require("./services/queue.service");
const deviceProcessingQueue = require("./services/deviceProcessing.queue");

// Scheduler
const scheduler = require("./scheduler");
scheduler.startScheduler();

// Worker
const { startWorker } = require("./workers/deviceProcessing.worker");
startWorker().catch((err) => {
  /* ... */
});

// Graceful shutdown
const shutdown = async (signal) => {
  /* same as today */
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// DB connection + admin seed
const pool = require("./config/db");
pool
  .connect()
  .then(async () => {
    /* same as today */
  })
  .catch(/* ... */);

// Start
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
```

---

## Testing Strategy After Extraction

### Current approach (Phase 4A.1–4A.6)

- Inline Express apps in test files
- Each test file duplicates middleware setup

### Future approach (post-extraction)

- Import the real `app.js` after mocking DB/Redis/queue modules
- Tests gain the complete route tree automatically
- No need to maintain inline app definitions

### Required mocks in any test importing `app.js`

```js
jest.mock("../config/db", () => require("./config/__mocks__/db"));
jest.mock("../config/redis", () => ({
  on: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
  get: jest.fn(),
  set: jest.fn(),
  quit: jest.fn(),
}));
jest.mock("../services/queue.service", () => ({
  payslipQueue: { close: jest.fn().mockResolvedValue() },
  hrFormQueue: { close: jest.fn().mockResolvedValue() },
  addPayslipToQueue: jest.fn(),
  addBulkPayslipsToQueue: jest.fn(),
  addBulkAssignmentJob: jest.fn(),
}));
jest.mock("../services/deviceProcessing.queue", () => ({
  deviceProcessingQueue: {
    process: jest.fn(),
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(),
  },
  isReady: jest.fn().mockResolvedValue(false),
}));
```

---

## Risks

| Risk                                                                                                                                                    | Impact                                                                                                   | Mitigation                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Route files transitively import modules with side effects (Redis, Bull queues)                                                                          | Test imports of `app.js` would try to connect to Redis/PostgreSQL                                        | Mandatory `jest.mock()` for `config/db`, `config/redis`, `queue.service`, `deviceProcessing.queue` in all `app.js` tests |
| `payrollRuleRoutes` is `require()`d at line 252, after many route mounts — this ordering anomaly must be preserved                                      | Route ordering changes could affect behavior in production                                               | Keep the `require()` + `app.use()` pair exactly where it is, in the same order                                           |
| `pool` is currently `require()`d at line 3 in `index.js`; after extraction, `app.js` won't import it but other modules may still transitively import it | No impact — route modules that use DB already `require("../config/db")` independently                    | Ensure `app.js` tests mock `config/db` which will catch all transitive usages                                            |
| `require("./config/redis")` has a top-level `await redisClient.connect()` call                                                                          | If any route/controller/service chain imports redis.js (even indirectly), the test fails without mocking | Audit which route files transitively touch Redis; add `jest.mock("../config/redis")` proactively                         |
| Reordering imports from `index.js` to `app.js` could accidentally change execution order                                                                | Subtle bugs if middleware/route order changes                                                            | Use exact mechanical extraction — copy-paste, no reordering                                                              |

---

## Safe Implementation Steps

1. **Create `Backend/app.js`** by copying all "App setup" lines from `index.js`
2. **Modify `Backend/index.js`** to require `./app` and strip moved lines
3. **Run `npm test`** — confirm 0 regressions (all 18 suites / 270 tests pass)
4. **Start the server** — confirm `GET /` and `GET /api/health` return same responses
5. **Verify a protected route** — confirm middleware chain works the same

---

## Validation Plan

| Check           | Command / Action                                         | Expected                                      |
| --------------- | -------------------------------------------------------- | --------------------------------------------- |
| Unit tests pass | `cd Backend && npm test`                                 | 18 suites, 270 tests                          |
| Server starts   | `node Backend/index.js` (briefly)                        | `Server running on http://localhost:3002`     |
| Health endpoint | `curl http://localhost:3002/api/health`                  | `{ status: "ok", ... }`                       |
| Root endpoint   | `curl http://localhost:3002/`                            | `{ message: "Welcome...", version: "1.0.0" }` |
| 404 route       | `curl http://localhost:3002/nonexistent`                 | `{ message: "Route not found" }`              |
| Socket.IO init  | Server log should show Socket.IO initialization messages | No crash                                      |
| Scheduler start | Server log should show scheduler messages                | No crash                                      |

---

## Recommendation

**Extraction IS safe and recommended, but with caveats.**

### Should we extract `app.js` now?

**Yes** — it is a purely mechanical extraction with zero logic changes. The code moves from one file to another without any behavioral modification.

### What files would change?

- **`Backend/app.js`** (NEW) — ~250 lines of Express setup
- **`Backend/index.js`** (MODIFIED) — reduced from 344 lines to ~80 lines of startup logic

No other files change. No frontend, no DB schema, no payroll, no attendance, no leave, no recruitment, no employee logic — nothing.

### What risks exist?

1. **Transitive import side effects** — route → controller → service chains that import `config/db`, `config/redis`, or queue services will trigger real connections when `app.js` is loaded in a non-mocked test. Mitigation: all tests importing `app.js` must `jest.mock()` these four modules.
2. **Route ordering preservation** — line 252 (`payrollRuleRoutes`) is loaded after other routes are already mounted; this exact ordering must be preserved.

### What tests must pass after extraction?

1. `npm test` — all 18 suites / 270 tests
2. Manual smoke test: start server, hit `/api/health`, `/`, and a 404 route

### How to confirm production behavior is unchanged?

1. Output of `GET /api/health` and `GET /` must match pre-extraction responses
2. Server startup log messages must be identical
3. No new console errors during startup

---

## Phase 4A.8 Recommendation

Proceed with **Phase 4A.8: `Backend/tests/app.integration.test.js`** — a Supertest integration test file that imports the real `app.js`, mocks `config/db`, `config/redis`, and queue services, and tests all public routes (health, root, 404) plus the full middleware chain for protected routes.

This phase should be done immediately after a successful extraction in Phase 4A.7.
