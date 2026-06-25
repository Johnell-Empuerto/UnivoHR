# Phase 4A.6 — Testing Guide & Documentation

## Objective
Create a comprehensive testing guide (`Backend/tests/TESTING_GUIDE.md`) documenting all existing test files, patterns, and conventions for the backend test suite.

## Files Covered

### Pure Utility Tests (7 files, 930 lines total)
| File | Lines | Dependencies |
|---|---|---|
| `payrollFormula.test.js` | 477 | `utils/payrollFormula.helper` |
| `inputSanitizer.test.js` | 125 | `utils/inputSanitizer` |
| `passwordValidator.test.js` | 94 | `utils/passwordValidator` |
| `branchAccess.test.js` | 43 | `utils/branchAccess` |
| `deviceKey.test.js` | 78 | `utils/deviceKey` |
| `permissions.test.js` | 77 | `constants/permissions`, `constants/roles` |
| `validationError.test.js` | 36 | `utils/ValidationError` |

### Middleware Unit Tests (8 files, 1,166 lines total)
| File | Lines | Mocks |
|---|---|---|
| `roleMiddleware.test.js` | 90 | None (constants only) |
| `errorHandler.test.js` | 94 | None (error shapes) |
| `validateMiddleware.test.js` | 108 | Inline schema |
| `permissionMiddleware.test.js` | 136 | `permission.service` |
| `branchAccessMiddleware.test.js` | 245 | `utils/branchAccess` (inline factory) |
| `payrollLockMiddleware.test.js` | 111 | `config/db` |
| `authMiddleware.test.js` | 148 | `jsonwebtoken`, `tokenBlacklist.service` |
| `perDeviceAuthMiddleware.test.js` | 234 | `config/db`, `utils/deviceKey` |

### Supertest Integration Tests (3 files, 373 lines total)
| File | Lines | Mocks |
|---|---|---|
| `healthEndpoint.test.js` | 68 | None |
| `rootEndpoint.test.js` | 42 | None |
| `authEndpoint.test.js` | 263 | `auth.service`, `audit.service` |

**Total: 18 test files, ~2,469 lines**

## Mock Infrastructure
- `Backend/config/__mocks__/db.js` — manual Jest mock for `config/db` (query, connect, end)
- `jest.mock("jsonwebtoken")` — automatic mock for JWT verification
- Inline factory mocks for services and utility modules

## Patterns Documented
1. **Pure utility tests** — `require` the module, call functions, assert results
2. **Middleware unit tests** — `req`/`res`/`next` object setup in `beforeEach`, mock external deps with `jest.mock()`
3. **Supertest integration tests** — inline Express app with only routes under test, mock all services

## Key Conventions
- Test files in `Backend/tests/<name>.test.js`
- `describe` labels follow module path convention
- No real DB connections or HTTP servers — all dependencies mocked
- `jest.clearAllMocks()` in `beforeEach` where mocks are used
- `afterEach` restores `NODE_ENV` if modified
- Run with `jest --runInBand` (sequential execution)

## Testing Guide Delivered
- `Backend/tests/TESTING_GUIDE.md` — comprehensive documentation with patterns, examples, and conventions
