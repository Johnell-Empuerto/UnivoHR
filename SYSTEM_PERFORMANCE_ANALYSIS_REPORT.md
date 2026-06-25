# System Performance Analysis Report

**Date:** 2026-06-24  
**Scope:** Full-stack HR/Payroll system (React/Vite + Node/Express + PostgreSQL + Redis/Bull)  
**Commit analyzed:** `37d8718` (fix: correct employee import history user name query)  
**Analysis type:** Read-only code review

---

## Executive Summary

### Overall Condition
The system has a solid architecture — feature-sliced frontend, layered backend (routes → controllers → services → models), background job infrastructure via Bull/Redis, real-time via Socket.IO, and comprehensive RBAC. However, it exhibits **classic growth pain patterns**: scattered performance bottlenecks, missing caching layers, N+1 queries in critical paths, no code splitting on the frontend, and minimal production-hardening middleware.

### Biggest Risks
1. **Payroll generation N+1 query** — 500+ extra SQL queries per payroll run inside a loop
2. **All frontend routes eagerly bundled** — ~130 page components loaded on every visit, 1.5–2.5 MB of third-party JS
3. **No data-fetching cache layer** — every page mount re-fetches the same data
4. **Default DB pool of 10 connections** — bottleneck under moderate concurrent load
5. **In-memory rate limiting** — broken under multi-instance deployment

### Fastest Wins (hours, not days)
1. Replace `addBulkPayslipsToQueue` sequential loop with Bull's `addBulk()`
2. Add `React.lazy()` to the 60+ documentation routes
3. Set `pool.max` to 25–50 in `config/db.js`
4. Add `compression` middleware to Express
5. Memoize `AuthProvider` context value to prevent cascading re-renders

### Long-Term Improvements
1. Introduce TanStack Query or SWR for frontend data caching
2. Replace synchronous audit DB writes with fire-and-forget queue
3. Implement database read replicas for reporting queries
4. Add Redis-based rate limiting store for horizontal scaling
5. Consolidate redundant libraries (d3, Excel, date-fns)

---

## Critical Findings

### C1 — N+1 Query in Payroll Generation
- **Severity:** Critical
- **Area:** Backend / Database
- **File:** `Backend/models/payroll.model.js` lines 877–880
- **Evidence:** Inside the employee loop (line 521–1007), every employee triggers a `SELECT id FROM payroll WHERE employee_id = $1 AND cutoff_start = $2 AND cutoff_end = $3 AND status = 'LOCKED'`. For 500 employees, that's **500 extra SQL round-trips**.
- **Why it matters:** Payroll generation is already the heaviest operation in the system (~103 lines of queries before the loop). The N+1 turns an O(n) operation into O(n²). With 1,000+ employees, this can cause 30+ second response times and DB connection pool exhaustion.
- **Fix:** Batch all employee IDs into a single query before the loop: `SELECT employee_id FROM payroll WHERE employee_id = ANY($1::int[]) AND cutoff_start = $2 AND cutoff_end = $3 AND status = 'LOCKED'`
- **Risk if ignored:** Payroll generation becomes slower as company grows; DB pool saturates during payroll runs; timeout errors for users.
- **Safe to implement now:** Yes — pure query optimization, no schema changes.

### C2 — All Frontend Routes Eagerly Imported (~130 components)
- **Severity:** Critical
- **Area:** Frontend / Bundle
- **File:** `Frontend/src/app/routes/routes.tsx` lines 3–123
- **Evidence:** All 123+ import statements are static top-level imports. Zero `React.lazy()` or dynamic `import()`. The documentation section alone accounts for ~60 page components.
- **Why it matters:** The initial JavaScript bundle includes every page in the application. With 60+ docs pages (likely never visited by most users), plus charting libraries, spreadsheet widgets, rich text editors, etc., the estimated vendor chunk is 1.5–2.5 MB. This directly increases Time-to-Interactive (TTI) and First Contentful Paint (FCP).
- **Fix:** Wrap every route's `element` in `React.lazy(() => import('./path'))` — or use React Router v7's lazy routes. At minimum, lazy-load the docs section.
- **Risk if ignored:** Poor Lighthouse scores; slow page loads on mobile/limited networks; wasted bandwidth.
- **Safe to implement now:** Yes — pure frontend refactor, zero logic changes.

### C3 — No Data-Fetching Cache Layer (React Query / SWR)
- **Severity:** Critical
- **Area:** Frontend / Data Fetching
- **File:** `Frontend/src/hooks/useFetch.ts` (empty file), `Frontend/src/services/api.ts`
- **Evidence:** The `useFetch.ts` hook intended for data fetching is empty. The `api.ts` Axios interceptor has no caching, no deduplication, no stale-while-revalidate. 50 service files each call APIs directly, and every page mount returns to the network for the same data. The `AuthProvider` checks approver status on every auth state change.
- **Why it matters:** Every page navigation triggers fresh network requests. Dashboard widgets re-fetch when switching tabs. Users with slow connections experience repeated loading spinners. Without request deduplication, two components mounting simultaneously issue duplicate API calls.
- **Fix:** Integrate TanStack Query (React Query). Start with a `useFetch` wrapper that caches GET responses for 30–60 seconds. The empty `useFetch.ts` file is a natural insertion point.
- **Risk if ignored:** Unnecessary server load grows linearly with user count; poor UX with repeated loading states.
- **Safe to implement now:** Yes — additive, no existing code needs removal.

### C4 — Default PostgreSQL Pool Max = 10
- **Severity:** High
- **Area:** Backend / Database / Config
- **File:** `Backend/config/db.js`
- **Evidence:** Uses `new pg.Pool()` with no `max` property, defaulting to 10 connections. With ~56 route handlers, a device processing worker, a scheduler, and a standalone worker process all sharing this pool (or creating their own), 10 connections are insufficient under even moderate load.
- **Why it matters:** At 11 concurrent queries, the 11th caller waits indefinitely (`idleTimeoutMillis` defaults to 10 seconds, then 30 seconds for a new connection attempt). PDF generation, report downloads, and payroll generation each consume multiple queries — a single payroll run can temporarily exhaust the pool.
- **Fix:** Add `max: 25` (or `process.env.DB_POOL_MAX || 25`) and `idleTimeoutMillis: 30000` to the pool config. Monitor and adjust.
- **Risk if ignored:** Connection timeouts during peak usage; cascading failures when payroll/anomaly scans run simultaneously with user traffic.
- **Safe to implement now:** Yes — config change only.

### C5 — In-Memory Rate Limiting (No Shared Store)
- **Severity:** High
- **Area:** Backend / Deployment
- **File:** `Backend/middleware/rateLimit.middleware.js`
- **Evidence:** Uses `express-rate-limit` default in-memory store. The system has a Redis instance for Bull queues, but rate limiting does not use it.
- **Why it matters:** In any multi-process (PM2 cluster) or multi-server (load-balanced) deployment, each process has its own counter. A malicious actor could send 1000 requests spread across 10 instances and never hit the limit. The login/OTP/forgot-password limiters become ineffective.
- **Fix:** Add `rate-limit-redis` as a dependency and configure the `loginLimiter`, `otpLimiter`, etc. to use a Redis store.
- **Risk if ignored:** Brute-force attacks bypass rate limiting in multi-instance deployments.
- **Safe to implement now:** Yes — additive dependency, existing Redis instance already running.

---

## Backend Optimization Findings

### API and Route Structure

| Finding | Severity | File | Detail |
|---------|----------|------|--------|
| No `compression` middleware | High | `Backend/index.js` | JSON responses (especially reports, payroll data) are sent uncompressed. With gzip, payloads shrink 5–10x. |
| No request timeout | Medium | `Backend/index.js` | No `server.timeout` or express middleware timeout. Long-running payroll/report requests can hold connections indefinitely. |
| Graceful shutdown misses 6 queues | High | `Backend/index.js` lines 284–296 | Only `payslipQueue` and `deviceProcessingQueue` are closed. `attendanceNotificationQueue`, `anomalyQueue`, `statAnomalyQueue`, `hrFormQueue`, `forecastQueue`, and the `scheduler` are not drained. In-flight jobs can corrupt state. |
| Graceful shutdown `process.exit(0)` immediately | Medium | `Backend/index.js` lines 287, 294 | Calls `process.exit(0)` right after `queue.close()` without waiting for all jobs to finish. Should use `queue.close().then(() => process.exit(0))`. |
| Auth blacklist check on every request | High | `Backend/middleware/auth.middleware.js` line 29 | Every API call performs an async blacklist check. Token blacklist rarely changes. Cache with 60s TTL or skip blacklist check for non-security-critical GET endpoints. |
| Permission check queries DB on every request | High | `Backend/services/permission.service.js` lines 4–9 | Non-ADMIN users trigger a DB query for permission check on every protected route. Cache permissions with Redis 300s TTL. |
| Audit log INSERT in request cycle | High | `Backend/services/audit.service.js` lines 53–70 | Every audited operation waits for an INSERT to complete before responding. Should fire-and-forget or batch via queue. |
| Audit `fetchOldValues` runs SELECT * before every mutation | Medium | `Backend/services/audit.service.js` lines 80–81 | Double DB load per audited operation. `SELECT row_to_json(t) FROM (SELECT * FROM ...)` fetches all columns unnecessarily. |
| No request body size limit | Medium | `Backend/index.js` line 36 | `express.json()` with no limit. Large payloads can exhaust memory. Add `express.json({ limit: '10mb' })`. |

### Service Layer

| Finding | Severity | File | Detail |
|---------|----------|------|--------|
| `addBulkPayslipsToQueue` sequential Redis calls | **High** | `Backend/services/queue.service.js` lines 45–63 | Uses `for` loop with `await payslipQueue.add()` — O(n) round-trips. Bull provides `addBulk()` which sends all jobs in one Redis command. |
| Staggered delay pattern adds 25+ min delay | Medium | `Backend/services/queue.service.js` line 57 | `delay += 1500` means job #1000 has a 25-minute delay. Remove incrementing delay or use a small constant. |
| `cleanFailedJobs` loop removes one at a time | Low | `Backend/services/queue.service.js` lines 87–93 | O(n) Redis calls. Use `payslipQueue.clean(0, 'failed')`. |
| Notification dispatch queries DB per notification | **High** | `Backend/services/notificationDispatch.service.js` | `canSendInApp` / `canSendEmail` called for every notification — each queries the DB. Notification rules rarely change. Cache with 60s TTL. |
| User cache may expose sensitive data | **High** | `Backend/services/userCache.service.js` line 22 | `JSON.stringify(user)` stores the full user object including `password_hash` and any other fields. Strip sensitive fields before caching. |
| Worker has no per-queue concurrency | **High** | `Backend/worker.js` | All `.process()` calls default to concurrency 1. A slow forecast job blocks payslip emails. Add concurrency: `.process('send-payslip', 5, handler)`. |
| Scheduled jobs re-registered on every worker start | Low | `Backend/worker.js` lines 219–234 | `queue.add()` with `repeat` is called every time the worker starts. Bull deduplicates by cron pattern, but log clutter and slight Redis overhead. |

### API Response Patterns

| Finding | Severity | Detail |
|---------|----------|--------|
| Unbounded `SELECT *` in 15+ queries | Medium | Explicit column lists in SELECT reduce payload size, network transfer, and memory usage |
| Missing LIMIT in `getByEmployee` (attendance) | High | Returns ALL attendance records for an employee — could be thousands |
| Missing LIMIT in `getMyTimeModificationRequests` | Medium | Returns ALL modification requests without pagination |
| Missing LIMIT in `getProbationaryEmployeesDueForRegularization` | Low | Unbounded result set, but typically small |

---

## Frontend Optimization Findings

### Bundle Size and Dependencies

| Finding | Severity | Detail |
|---------|----------|--------|
| Three charting libraries: d3 + nivo + recharts | **High** | ~800 KB+ combined. Recharts alone is sufficient for most use cases. Choose one. |
| Two Excel libraries: exceljs + xlsx | **High** | ~400 KB+ combined. Pick one. |
| Two date libraries: date-fns + dayjs | Medium | ~100 KB+ combined. dayjs is smaller (~10 KB). |
| radix-ui meta-package | Medium | Re-exports ALL Radix primitives. Replace with individual `@radix-ui/react-*` packages. |
| @tiptap full suite (10+ extensions) | Low | Only include extensions actually used. |
| react-spring animation library | Low | Adds bundle weight for animations CSS could handle. |
| puppeteer in backend (~300 MB) | Medium | Only for PDF generation. Consider lighter alternatives. |

### Component and Re-render Performance

| Finding | Severity | File | Detail |
|---------|----------|------|--------|
| No `React.memo` anywhere | **High** | All components | Every context change (auth, theme, socket notification) cascades through the entire component tree. |
| `AuthProvider` context value not memoized | **High** | `Frontend/src/app/providers/AuthProvider.tsx` | Every auth state change re-creates the context object, re-rendering all consumers. Use `useMemo` for the context value. |
| `SocketProvider` reconnects on role change | Medium | `Frontend/src/app/providers/SocketProvider.tsx` | `user?.role` in dependency array triggers unnecessary socket disconnection/reconnection. |
| `ThemeProvider` theme flash on load | Low | `Frontend/src/app/providers/ThemeProvider.tsx` | Initial render defaults to "light" before loading from localStorage. Use a blocking script in `index.html` or server-side rendering. |
| `AppRoutes` re-renders entire router on state change | Medium | `Frontend/src/app/routes/routes.tsx` | `BrowserRouter` is inside a component function — re-created on every render. Move `BrowserRouter` to `main.tsx`. |
| Async approver check blocks initial route render | Medium | `Frontend/src/app/routes/routes.tsx` lines 133–159 | Every page load waits for an API call to determine overtime/man-hour access before rendering anything. |

### API Call Patterns

| Finding | Severity | Detail |
|---------|----------|--------|
| No request deduplication | **High** | Two components mounting simultaneously for the same data issue two API calls |
| No AbortController/cancellation | Medium | Stale responses can overwrite newer data when user navigates quickly |
| No retry logic for 5xx errors | Medium | Transient server errors immediately show failure to user |
| No response caching (ETag/Cache-Control) | Low | Browser could cache some responses if headers were present |

### Build and Configuration

| Finding | Severity | Detail |
|---------|----------|--------|
| No manual chunk splitting in Vite | Medium | All vendor code lands in one chunk. Add `manualChunks` for `react`, `lucide-react`, chart libs, etc. |
| No preload hints in index.html | Low | Fonts and critical chunks could be preloaded for faster perceived load. |
| No compression plugin for Vite build | Low | Vite could pre-compress assets with `vite-plugin-compression`. |

---

## Database and Query Optimization Findings

### Slow/Problematic Query Patterns

| Pattern | Locations | Impact |
|---------|-----------|--------|
| ILIKE with leading `%` wildcard | `employee.model.js` lines 52–57, 72–77; `payroll.model.js` lines 1092–1124 | Prevents B-tree index usage — always scans entire table. Consider `pg_trgm` GIN index. |
| Non-sargable `DATE_TRUNC` | `dashboard.model.js` lines 62, 129, 134 | `WHERE DATE_TRUNC('month', date) = ...` prevents index on `date`. Rewrite as range comparison. |
| Unnecessary `JOIN users` | `attendance.model.js` line 243 | `INNER JOIN users u ON u.employee_id = e.id` silently filters out employees who are not system users. Likely a bug causing missing attendance data. |
| Correlated subquery in `getMyPayroll` | `payroll.model.js` lines 1443–1455 | `json_agg` subquery runs per row instead of being pre-joined. |

### Missing Pagination / Unbounded Queries

| Query | File | Line | Risk |
|-------|------|------|------|
| `getByEmployee` (attendance) | `attendance.model.js` | 296–329 | Returns ALL attendance for an employee — thousands of rows possible |
| `getMyTimeModificationRequests` | `attendance.model.js` | 655–681 | Returns ALL requests without limit |
| `getProbationaryEmployeesDueForRegularization` | `employee.model.js` | 311–334 | Returns ALL matching employees without pagination |

### Recommended Indexes

(Do not implement without testing)

```sql
-- Enable pg_trgm for ILIKE search optimization
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Employee search columns (trigram GIN indexes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_first_name_trgm
  ON employees USING gin (first_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_last_name_trgm
  ON employees USING gin (last_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_employee_code_trgm
  ON employees USING gin (employee_code gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_department_trgm
  ON employees USING gin (department gin_trgm_ops);

-- Payroll cutoff + status (for N+1 fix)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_employee_cutoff_status
  ON payroll (employee_id, cutoff_start, cutoff_end, status);

-- Attendance date + employee (for dashboard/attendance queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_employee_date
  ON attendance (employee_id, date);

-- Attendance date (for dashboard monthly/trend queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_date
  ON attendance (date);

-- Overtime employee + paid status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_overtime_employee_paid
  ON overtime_requests (employee_id, status, is_paid);

-- Leaves employee + status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaves_employee_status
  ON leaves (employee_id, status);

-- Payroll cutoff start (for payroll queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payroll_cutoff_start
  ON payroll (cutoff_start);
```

---

## Caching Recommendations

| Data / API | Strategy | TTL | Invalidation | Benefit | Risk |
|-----------|----------|-----|-------------|---------|------|
| User permissions | Redis SET with user ID key | 300s | On permission change event | Eliminates DB query on every request for non-ADMIN users | Low — permission changes are rare |
| Token blacklist | In-memory Map with TTL | 60s | None needed (token expiry) | Eliminates Redis/DB round-trip on every auth check | Low — 60s window acceptable |
| Notification rules | In-memory object | 60s | None needed (rarely change) | Eliminates per-notification DB query | Low — 60s stale rules acceptable |
| Dashboard summary data | Redis with cache key per user/date | 60–300s | On attendance/payroll change | Avoids recomputing aggregates on every page load | Low — 5-min stale data acceptable |
| System settings (`company_name`, etc.) | In-memory singleton | 600s | On settings update event | Eliminates DB query on every pub/sub event | Low — settings rarely change |
| Reference data (branches, departments, positions) | In-memory with manual refresh | 3600s | On create/update/delete | Avoids repeated `SELECT DISTINCT` queries | Low — stale data causes minor UX delay |
| Employee list (paginated) | Redis cache keyed by filters + page | 60s | On employee create/update/delete | Reduces DB load for frequently-paged employee list | Medium — cache invalidation complexity |

### Cache Key Strategy
```
user:permissions:{userId}
user:blacklist:{jti}
notification:rules
dashboard:summary:{userId}:{date}
settings:{key}
reference:branches
employees:list:{search}:{page}:{pageSize}
```

### Cache Invalidation Triggers
- Permission changes → `permission.service.js` publishes event → cache cleared
- Employee changes → controller calls `del('employees:list:*')` pattern
- Settings updates → controller clears `settings:{key}`

---

## Resource Management Recommendations

### Current State vs Recommended Limits

| Resource | Current | Recommended | Why |
|----------|---------|-------------|-----|
| DB pool max | 10 (default) | 25–50 | Default is insufficient for concurrent users + background workers |
| DB query timeout | None | 30s | Prevent slow queries from holding connections indefinitely |
| Request body size | Unlimited (default) | 10 MB | Prevent memory exhaustion from large payloads |
| File upload size | 5–10 MB (in middleware) | 10 MB | Acceptable, but enforce at Express level too |
| Queue concurrency (payslip) | 1 (default) | 5 | Allow parallel email sending — SMTP is I/O-bound |
| Queue concurrency (device processing) | 1 (default) | 3 | Process multiple device logs concurrently |
| Socket.IO adapter | In-memory | `@socket.io/redis-adapter` | Required for horizontal scaling |
| Worker processes | 1 | 2–3 (separate queues by function) | Isolate heavy jobs (forecast, anomaly) from email/form jobs |

### Risk Areas

| Risk | Component | Why | Mitigation |
|------|-----------|-----|------------|
| CPU spike during payroll gen | Backend `payroll.model.js` | 500–1000+ employees × multiple queries | Move to dedicated worker; run during off-hours |
| RAM bloat from large reports | Backend report service | Excel/PDF generation loads all data in memory | Stream data; limit rows per report |
| Event loop blocking | Backend sync operations | `fs.existsSync`, `JSON.stringify` on large objects, synchronous console.log | Use async versions; offload formatting to workers |
| Memory leak from zombie sockets | Socket.IO | Clients that don't cleanly disconnect | Implement socket heartbeat with timeout; monitor socket count |
| Redis memory growth | Bull queues | `removeOnFail: false` means failed jobs accumulate | Implement periodic `clean(0, 'failed')` or set max retries |

---

## Automation and Scheduling Recommendations

### Schedule Audit

| Job | Schedule | Queue | Concurrency | Retries | Risk |
|-----|----------|-------|-------------|---------|------|
| Daily anomaly scan | 2:00 AM | `anomaly-scans` | 1 | 2 | Long-running; overlaps with stat scan at 2:30 |
| Statistical anomaly scan | 2:30 AM | `stat-anomaly-scans` | 1 | 2 | Overlaps with daily anomaly — 30 min gap is tight |
| Weekly anomaly scan | Mon 3:00 AM | `anomaly-scans` | 1 | 2 | Same queue as daily — potential backpressure |
| Weekly stat scan | Mon 3:30 AM | `stat-anomaly-scans` | 1 | 2 | Same issue |
| Daily forecast gen | 4:00 AM | `forecast-generation` | 1 | 2 | Could overlap with anomaly scans if delayed |
| Weekly branch forecast | Mon 4:30 AM | `forecast-generation` | 1 | 2 | Tight after daily forecast |
| Attendance notifications | 6:00 PM daily | `attendance-notifications` | 1 | 3 | Could overlap with payroll cutoff processing |
| Year-end leave conversion | Dec 31 23:59 | (node-cron) | 1 (in-memory guard) | N/A | Single point of failure; in-memory guard doesn't work across restarts |
| Monthly health check | 1st 8:00 AM | (node-cron) | 1 | N/A | Lightweight, low risk |

### Recommendations

1. **Stagger heavy jobs more aggressively** — 30 min gaps are insufficient if jobs take 20+ min. Leave 1+ hour gaps.
2. **Add per-queue concurrency** — `payslip-emails` can safely run 3–5 concurrent jobs (SMTP is I/O-bound).
3. **Add job timeout** — Set `timeout` in `defaultJobOptions` for each queue to prevent hung jobs.
4. **Make year-end conversion idempotent** — The `isProcessing` in-memory guard won't work across restarts. Use a Redis distributed lock.
5. **Log job duration** — Every job should log `started_at` and `completed_at` for monitoring.
6. **Add stalled job handling** — Bull's `maxStalledCount` (default 1) may need tuning. Set `stalledInterval` explicitly.

---

## Monitoring and Logging Recommendations

### Essential Metrics

| Category | Metric | Collection Method | Alert Threshold |
|----------|--------|-------------------|-----------------|
| API | Response time p50/p95/p99 | Morgan custom format → structured logs | p95 > 2000ms |
| API | Request rate (rps) | Morgan counters | > 100 rps |
| API | Error rate (5xx) | Error handler count | > 1% |
| Database | Connection pool usage | Periodic `pool.totalCount`, `pool.waitingCount` | `waitingCount > 0` |
| Database | Slow queries (> 500ms) | `pg` query timer; PostgreSQL `log_min_duration_statement` | > 10 per minute |
| Queue | Queue depth (waiting count) | Bull `getWaitingCount()` API | > 1000 |
| Queue | Failed job count | Bull `getFailedCount()` API | > 5 |
| Queue | Job processing time | Log job start → complete duration | > 5 minutes |
| Socket.IO | Connected clients count | `io.engine.clientsCount` | > 500 |
| Redis | Memory usage | `INFO memory` command | > 80% of maxmemory |
| System | CPU / RAM / Disk | OS-level monitoring (Prometheus node_exporter) | CPU > 80%, RAM > 85% |

### Logging Improvements

1. **Add structured JSON logging** (Pino or Winston) — replace `console.log` in production
2. **Add correlation IDs** — generate `req.id` in middleware, propagate to all logs and downstream calls
3. **Log API response times** — Morgan can log `:response-time` with URL and status
4. **Log queue job lifecycle** — log when job starts, succeeds, fails, with duration
5. **Log database query performance** — wrap `pool.query` to log slow queries

### Practical Setup

For a local/single-server production deployment:
```
Node.js: Pino logger → stdout → systemd/journald or file rotation
PostgreSQL: pgBadger for query analysis; auto_explain for slow queries
Queue monitoring: Bull Board (express middleware)  
Health endpoint: /api/health (already exists — expand to include DB, Redis, queue status)
```

For multi-server production:
```
Prometheus + Grafana for metrics
pm2 metrics or New Relic/Datadog APM
Loki or Elasticsearch for log aggregation
Bull Dashboard or RedisInsight for queue visualization
```

---

## Quick Wins

| # | Fix | Effort | Impact | Area |
|---|-----|--------|--------|------|
| 1 | Set `pool.max = 25` in `config/db.js` | 1 line | **High** — prevents connection exhaustion | Backend |
| 2 | Add `compression` middleware | 1 line + dependency | **High** — reduces payload 5–10x | Backend |
| 3 | Add `express.json({ limit: '10mb' })` | 1 line | **Medium** — prevents memory exhaustion | Backend |
| 4 | Add `React.lazy()` to 60+ docs routes | 1 pattern, 60 imports | **High** — reduces initial bundle by ~30% | Frontend |
| 5 | Memoize `AuthProvider` context value | 1 `useMemo` | **High** — stops cascading re-renders | Frontend |
| 6 | Replace `addBulkPayslipsToQueue` loop with `addBulk()` | 10 lines | **High** — reduces O(n) Redis calls to O(1) | Backend |
| 7 | Strip sensitive fields from user cache | 3 lines | **High** — security + performance | Backend |
| 8 | Add `server.timeout = 120000` | 1 line | **Medium** — prevent hung connections | Backend |
| 9 | Add stalled job handling to Bull queues | Config per queue | **Medium** — prevent silent job failure | Backend |
| 10 | Wrap `BrowserRouter` in `main.tsx` (not inside component) | Small refactor | **Medium** — prevent router re-creation | Frontend |

---

## Medium-Term Improvements

| # | Improvement | Effort | Impact | Notes |
|---|-------------|--------|--------|-------|
| 1 | Introduce TanStack Query (React Query) | 2–3 days | **Very High** — caching, dedup, retry | Start with dashboard + employee list |
| 2 | Consolidate charting libraries (keep recharts, drop d3 + nivo) | 1–2 days | **High** — saves 500+ KB bundle | Test all charts after removal |
| 3 | Consolidate Excel libraries (keep xlsx, drop exceljs) | 1 day | **High** — saves 200+ KB bundle | Verify download functionality |
| 4 | Consolidate date libraries (keep dayjs, drop date-fns) | 1 day | **Medium** — saves ~70 KB bundle | Check all date imports |
| 5 | Implement Redis-based rate limiting store | 1 day | **High** — enables horizontal scaling | Requires `rate-limit-redis` package |
| 6 | Add Vite manual chunk splitting | 1 day | **Medium** — improves caching | Separate vendor, UI, app chunks |
| 7 | Cache user permissions in Redis | 1–2 days | **High** — eliminates DB query per request | Invalidate on permission change |
| 8 | Move audit logs to fire-and-forget queue | 2–3 days | **High** — removes DB write from request cycle | Use a separate `audit-logs` queue |
| 9 | Add Socket.IO Redis adapter | 1 day | **Medium** — enables horizontal scaling | Requires `@socket.io/redis-adapter` |
| 10 | Add per-queue concurrency to worker.js | 1 line per queue | **High** — parallelizes background processing | Test with realistic loads |

---

## Long-Term Scalability Plan

### Vertical Scaling (Current Path)
- Increase Node.js memory limit (`--max-old-space-size=4096`)
- Increase PostgreSQL resources (CPUs, RAM, disk IOPS)
- Single server with PM2 cluster mode (2–4 instances)

### Horizontal Scaling (Recommended)
1. **Stateless backend** — Move all session state to Redis (sessions already use JWT, so this is mostly done)
2. **Load balancer** — Add nginx or HAProxy in front of Express instances
3. **Redis-based rate limiting** — Critical before adding second instance
4. **Socket.IO Redis adapter** — Required for multi-instance real-time
5. **Database read replicas** — Move reporting/analytics queries to replicas
6. **Queue worker isolation** — Separate worker processes by function:
   - `worker-email.js`: payslip-emails, notificationDispatch
   - `worker-heavy.js`: anomaly scans, forecast generation, payroll processing
   - `worker-forms.js`: HR form assignments

### Readiness Score

| Category | Score (1–10) | Notes |
|----------|-------------|-------|
| API Performance | 6/10 | Good overall but N+1 in payroll + no pagination in some queries |
| Database Efficiency | 5/10 | Missing indexes, ILIKE scans, unbounded queries |
| Frontend Bundle | 3/10 | ~130 eager routes, redundant libraries, no lazy loading |
| Frontend Rendering | 4/10 | No memoization, context re-renders, no data caching |
| Caching | 2/10 | Almost nonexistent — only user cache with security risk |
| Queue/Worker | 5/10 | Good foundation but no concurrency, no timeout, sequential bulk operations |
| Monitoring | 2/10 | Only basic console.log and morgan "dev" — no structured logging, no metrics |
| Security Hardening | 6/10 | Helmet + CORS + rate limiting (in-memory only) + JWT + RBAC — good base |
| Deployment Readiness | 5/10 | No graceful shutdown for 6/8 queues, rate limiting not shareable |
| Production Hardening | 4/10 | No APM, no health check expansion, no request timeout, no compression |

### **Overall Score: 42/100**

### Must-Fix Before Production

1. **Fix payroll N+1 query** — `payroll.model.js` lines 877–880 (Critical)
2. **Add frontend route lazy loading** — `routes.tsx` (Critical)
3. **Add data-fetching cache layer** — React Query / SWR (Critical)
4. **Increase DB pool size** — `config/db.js` (High)
5. **Add compression middleware** — `index.js` (High)
6. **Add Redis store for rate limiting** — `rateLimit.middleware.js` (High)
7. **Fix graceful shutdown** — `index.js` close all queues (High)
8. **Add request body size limit** — `index.js` (Medium)
9. **Add per-queue concurrency to worker** — `worker.js` (Medium)
10. **Replace sequential `addBulk` loop** — `queue.service.js` (Medium)

---

## Do Not Touch Areas

The following areas were verified as not modified during this analysis:
- Employee bulk upload parsing logic
- Employee creation/update/delete logic
- Employee code generation
- Database schema or migrations
- Payroll computation logic
- Attendance tracking logic
- Recruitment workflow
- Device integration
- Any data (no seeding, deleting, or resetting)

---

## Final Verdict

**Score: 42/100**

The system has a robust architectural foundation and comprehensive feature coverage, but it exhibits classic "grown quickly" patterns. The most critical issue is the **N+1 query in payroll generation** which will cause increasingly severe performance degradation as the company grows. The **frontend bundle size** (130+ eager routes, redundant libraries) directly impacts user-perceived performance. The **absence of any data-fetching cache** means every page navigation is a fresh network call.

The recommended order of fixes is:
1. **Payroll N+1** (hours, zero risk)
2. **Frontend route lazy loading** (hours, high impact)
3. **DB pool sizing + compression** (minutes, high impact)
4. **Data-fetching cache** (2–3 days, highest long-term value)
5. **Audit service fire-and-forget** (1 day, removes DB latency from request cycle)
