# Backend API Comprehensive Code Review

**Date:** 2026-03-03
**Reviewer:** code-reviewer
**Scope:** `apps/api/src/` - Full backend API (21 files, 1177 LOC)
**Focus:** Hono.js patterns, Auth, API design, Drizzle ORM, Security, Error handling, Performance

---

## Overall Assessment

The backend is well-structured for an MVP: clean module separation, consistent `ApiResponse` wrapper, proper Zod validation, good use of Drizzle ORM with `jose` for JWT. Code is readable and files are within the 200-line limit. However, there are several **security gaps**, **missing production hardening**, and **edge cases** that need attention before deployment.

**Rating: 6.5/10** -- Solid MVP foundation with meaningful security and robustness gaps.

---

## Critical Issues

### C1. No Rate Limiting Implemented [Security]
**File:** `apps/api/src/app.ts`
**Impact:** API is vulnerable to brute-force attacks on login/register, credential stuffing, and denial of service.

The `env.ts` defines `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS` (lines 41-42), and `.env.example` lists rate limit vars, but **no rate limiting middleware is actually applied**. The login endpoint is completely unprotected.

**Fix:** Add rate limiting middleware. Hono does not have built-in rate limiting, but options include:
```ts
// Option 1: Use hono-rate-limiter package
import { rateLimiter } from "hono-rate-limiter";

// Option 2: Implement with Redis (already configured in env)
// Option 3: Simple in-memory rate limiter for MVP
```
Apply stricter limits to `/auth/login` and `/auth/register` than general endpoints.

---

### C2. No Security Headers (Helmet) [Security]
**File:** `apps/api/src/app.ts`
**Impact:** Missing `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy`, etc. Exposes to clickjacking, MIME sniffing, and other attacks.

**Fix:**
```ts
import { secureHeaders } from "hono/secure-headers";
app.use("*", secureHeaders());
```
Hono has built-in `secureHeaders()` middleware -- zero config needed.

---

### C3. JWT Refresh Token Not Rotated / No Blacklist [Security]
**Files:** `apps/api/src/modules/auth/auth-service.ts:61-81`, `apps/api/src/modules/auth/auth-routes.ts:35-38`

**Issues:**
1. **No token rotation on refresh:** When `/auth/refresh` is called, a new token pair is issued but the old refresh token remains valid until expiry. An attacker who steals a refresh token has a 7-day window.
2. **Logout is a no-op:** `auth-routes.ts:35-38` just returns success without server-side invalidation. A stolen token continues to work.
3. **No refresh token family tracking:** Cannot detect token reuse attacks.

**Fix (Minimum viable):**
- Store refresh tokens in DB/Redis with a token family ID
- On refresh: invalidate old token, issue new pair
- On reuse detection: invalidate entire family
- On logout: invalidate stored refresh token

---

### C4. Race Condition in Registration - Email Uniqueness [Data Integrity]
**File:** `apps/api/src/modules/auth/auth-service.ts:10-36`

The check-then-insert for email uniqueness (lines 10-16 then 21-29) is not atomic. Under concurrent requests, two users could register with the same email:
1. Request A checks email: not found
2. Request B checks email: not found
3. Both insert -- one succeeds, one gets a DB unique constraint error that is **unhandled**.

**Fix:** Either:
- Wrap in a transaction with `SERIALIZABLE` isolation, OR
- Handle the unique constraint violation from Postgres gracefully:
```ts
try {
  const [newUser] = await db.insert(users).values({...}).returning();
  // ...
} catch (err: unknown) {
  if (err instanceof Error && err.message.includes("unique constraint")) {
    throw new HTTPException(409, { message: "Email already registered" });
  }
  throw err;
}
```
Same issue exists in `user-service.ts:61-79` (`createUser`).

---

## High Priority Issues

### H1. No UUID Validation on Path Parameters [Input Validation]
**Files:** `resource-routes.ts:31,49,62,72` and `user-routes.ts:20,32,39`

Route params like `c.req.param("id")` are passed directly to DB queries without validating they are valid UUIDs. Passing `"not-a-uuid"` causes a **Postgres error** (unhandled 500) instead of a clean 400.

**Fix:** Add UUID validation:
```ts
import { z } from "zod";
const uuidSchema = z.string().uuid();

// In route handler:
const id = uuidSchema.parse(c.req.param("id"));
```
Or create a shared middleware/helper for ID param validation.

---

### H2. Refresh Token Endpoint Missing Zod Validation [Input Validation]
**File:** `apps/api/src/modules/auth/auth-routes.ts:22-33`

The `/auth/refresh` endpoint does manual validation (`typeof refreshToken !== "string"`) instead of using a Zod schema like every other endpoint. This is inconsistent and less robust.

**Fix:**
```ts
const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken is required"),
});
// Then: const { refreshToken } = refreshTokenSchema.parse(body);
```

---

### H3. UpdateUser Allows Email Change Without Uniqueness Check [Data Integrity]
**File:** `apps/api/src/modules/users/user-service.ts:81-90`

`updateUser` accepts `email` in the DTO and passes it directly to `db.update()` without checking if the new email is already taken by another user. This can cause a unique constraint violation (unhandled 500) or, worse, silently overwrite data.

**Fix:** Before update, check uniqueness:
```ts
if (dto.email) {
  const existing = await db.select({id: users.id}).from(users)
    .where(eq(users.email, dto.email)).limit(1);
  if (existing.length > 0 && existing[0].id !== id) {
    throw new HTTPException(409, { message: "Email already in use" });
  }
}
```

---

### H4. No Ordering in List Queries [API Design]
**Files:** `resource-service.ts:48-56`, `user-service.ts:34-35`

List endpoints return results without any `ORDER BY` clause. The order of results is non-deterministic, which causes:
- Pagination inconsistency (items can shift between pages)
- Poor UX (random order each request)

**Fix:** Add `.orderBy(desc(resources.createdAt))` or similar to all list queries.

---

### H5. Password Not Validated on Auth Schema Strength [Security]
**File:** `packages/shared/src/schemas/auth-schemas.ts:4-5,11-14`

Password validation only requires `min(6)`. For a production system, this is too weak. No requirements for uppercase, lowercase, digit, or special character.

The seed passwords (`Admin123!`, `User123!`) suggest stronger requirements were intended.

**Fix:**
```ts
password: z.string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[A-Z]/, "Must contain uppercase letter")
  .regex(/[a-z]/, "Must contain lowercase letter")
  .regex(/[0-9]/, "Must contain a digit")
  .regex(/[^A-Za-z0-9]/, "Must contain a special character")
```

---

### H6. Missing `updatedAt` Auto-Update Trigger [Data Integrity]
**File:** `apps/api/src/db/schema/users-schema.ts:9-14`

The `updatedAt` column uses `.defaultNow()` for initial insert, but there is **no database trigger** to auto-update it. The services manually set `updatedAt: sql\`now()\`` in some places (`resource-service.ts:132`, `user-service.ts:84`) but not in others (registration, which only does insert). This is fragile -- any future code that updates a row could forget.

**Fix:** Either:
- Add a Postgres trigger: `CREATE TRIGGER ... BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();`
- Or use Drizzle's `.$onUpdate(() => new Date())` if available

---

## Medium Priority Issues

### M1. `db/reset.ts` References Old Table Names [Bug]
**File:** `apps/api/src/db/reset.ts:8-10`

```ts
await db.execute(sql`DROP TABLE IF EXISTS vps_metrics CASCADE`);
await db.execute(sql`DROP TABLE IF EXISTS vps_servers CASCADE`);
```

These reference `vps_metrics` and `vps_servers` which are pre-refactoring table names. The current schema uses `resources`. The reset script will **not drop the `resources` table** and is effectively broken for the current schema.

**Fix:**
```ts
await db.execute(sql`DROP TABLE IF EXISTS resources CASCADE`);
await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);
```

---

### M2. `slug` Not Enforced as Unique in Schema [Data Integrity]
**File:** `apps/api/src/db/schema/resources-schema.ts:17`

The `slug` column has an index (`resources_slug_idx` at line 35) but is **not marked as `.unique()`**. Multiple resources can have the same slug. The `slugify()` in `resource-service.ts:31-36` generates slugs from names without any collision handling.

If two resources are named "My App", both get slug `my-app`.

**Fix:** Either:
- Add `.unique()` to the slug column, OR
- Add collision detection: append a counter (`my-app-2`) or UUID suffix

---

### M3. No Request Body Size Limit [Security/DoS]
**File:** `apps/api/src/app.ts`

No body size limit is configured. An attacker can send arbitrarily large JSON payloads to consume server memory.

**Fix:**
```ts
import { bodyLimit } from "hono/body-limit";
app.use("*", bodyLimit({ maxSize: 1024 * 1024 })); // 1MB
```

---

### M4. `toResource` Metadata Type Mismatch [Type Safety]
**File:** `apps/api/src/modules/resources/resource-service.ts:17`

```ts
metadata: (row.metadata ?? {}) as Record<string, string>,
```

The DB stores `jsonb` which can be any JSON value (nested objects, arrays, numbers, booleans). Casting to `Record<string, string>` is unsafe -- metadata could contain `{ priority: 1 }` (number, not string). The seed data at `seed.ts:71` stores `{ priority: "high", version: "1.0" }` as strings, but the schema doesn't enforce this.

**Fix:** Either validate/coerce metadata values at read time, or change the type to `Record<string, unknown>` and handle appropriately.

---

### M5. Connection Pool Not Configured [Performance]
**File:** `apps/api/src/db/connection.ts:6`

```ts
const queryClient = postgres(env.DATABASE_URL);
```

The `postgres` driver is initialized without any pool configuration. Default settings may not be optimal for production. No connection timeout, max connections, or idle timeout configured.

**Fix:**
```ts
const queryClient = postgres(env.DATABASE_URL, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
});
```

---

### M6. No Graceful Shutdown [Reliability]
**File:** `apps/api/src/server.ts`

The server starts but never handles `SIGTERM`/`SIGINT`. Active connections and DB pools are not closed on shutdown, which can cause data corruption or orphaned connections.

**Fix:**
```ts
const server = serve({ fetch: app.fetch, port });

const shutdown = async () => {
  console.log("[API] Shutting down...");
  server.close();
  await queryClient.end();
  process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```

---

### M7. Non-Null Assertions Throughout Services [Type Safety]
**Files:** `auth-service.ts:28,33,34`, `resource-service.ts:111,142,193`, `user-service.ts:78`

Multiple uses of `!` non-null assertion on DB results:
```ts
const [newUser] = await db.insert(users).values({...}).returning();
adminId = admin!.id;  // What if insert fails silently?
```

While Drizzle's `.returning()` should always return results for successful inserts, the assertion hides potential issues.

**Fix:** Add explicit checks:
```ts
const [newUser] = await db.insert(users).values({...}).returning();
if (!newUser) throw new Error("Failed to create user");
```

---

### M8. `requestLogger` Middleware Defined but Unused [Dead Code]
**File:** `apps/api/src/middleware/error-handler.ts:83-88`

The `requestLogger` function is exported but never imported anywhere. The app uses Hono's built-in `logger()` instead (`app.ts:27`).

**Fix:** Remove `requestLogger` to reduce dead code, or replace the built-in logger with it if custom logging is desired.

---

### M9. CORS `maxAge` Not Set [Performance]
**File:** `apps/api/src/app.ts:15-24`

The CORS config does not set `maxAge`, meaning browsers will send preflight OPTIONS requests on every cross-origin request. This doubles request latency for non-simple requests.

**Fix:**
```ts
cors({
  // ...existing config
  maxAge: 86400, // Cache preflight for 24 hours
})
```

---

### M10. No Search/Filter on List Endpoints [API Design]
**Files:** `resource-routes.ts:16-29`, `user-routes.ts:11-17`

List endpoints only support `page` and `limit`. No filtering by status, category, name search, or sorting. For a resources management system, basic filtering is expected.

---

## Low Priority Issues

### L1. Inconsistent Error Message Language [Consistency]
**Files:** Zod schemas use Vietnamese (`auth-schemas.ts:4-5`, `user-schemas.ts:4,6`), but all HTTPException messages are in English. Pick one language for user-facing error messages.

---

### L2. `toUser` Type Gymnastics [Readability]
**File:** `apps/api/src/modules/users/user-service.ts:17-27`

The `toUser` function has an overly complex type signature that immediately casts to `Record<string, unknown>`. Simpler approach:
```ts
function toUser(row: { id: string; email: string; name: string; role: string; createdAt: Date; updatedAt: Date }): User {
  return { ...row, role: row.role as UserRole, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}
```

---

### L3. `env.ts` Does Not Validate `API_PORT` Is a Valid Port Number [Robustness]
**File:** `apps/api/src/env.ts:29`

`parseInt` could produce `NaN` if the env var is malformed. No range check (1-65535).

---

### L4. Seed Script Hardcoded Passwords [Minor Security]
**File:** `apps/api/src/db/seed.ts:24,50`

Passwords `Admin123!` and `User123!` are hardcoded. Acceptable for dev/seed, but add a comment or guard that this only runs in non-production.

---

## Missing Features (For Production Readiness)

| Feature | Priority | Notes |
|---------|----------|-------|
| **Rate limiting** | Critical | Env vars exist but no implementation |
| **Security headers** | Critical | Use `hono/secure-headers` |
| **Refresh token rotation** | Critical | Store tokens in DB/Redis |
| **Request body size limit** | High | Prevent DoS via large payloads |
| **Structured logging** | High | Replace `console.log` with pino/winston |
| **Password reset flow** | Medium | No forgot-password endpoint |
| **Email verification** | Medium | Emails not verified on register |
| **Account lockout** | Medium | No brute-force protection on login |
| **API versioning strategy** | Medium | Only v1 prefix, no deprecation plan |
| **Test suite** | Medium | Zero test files exist |
| **OpenAPI/Swagger docs** | Low | No API documentation |
| **Request ID tracking** | Low | No correlation IDs for debugging |
| **Health check - DB ping** | Low | Health endpoint doesn't verify DB connectivity |

---

## Positive Observations

1. **Clean module structure** -- `modules/{name}/{name}-routes.ts` + `{name}-service.ts` separation of concerns is well done
2. **Consistent ApiResponse wrapper** -- All endpoints return `{ success, data/error }` format
3. **Proper Zod validation** -- Input validation on all mutation endpoints with shared schemas
4. **Good DB schema design** -- Proper indexes on resources table, UUID PKs, timezone-aware timestamps, FK cascade
5. **JWT implementation** -- Using `jose` (modern, maintained) over `jsonwebtoken`. Separate access/refresh secrets.
6. **Type safety from shared package** -- Types flow from shared to both API and web
7. **Auth middleware composition** -- `authMiddleware` + `adminMiddleware` chain is clean and reusable
8. **Pagination** -- Properly implemented with count and meta
9. **Self-deletion prevention** -- `user-service.ts:93` prevents admin from deleting themselves
10. **Environment validation** -- `requireEnv` fails fast on missing critical vars

---

## Recommended Actions (Priority Order)

1. **[Critical]** Add rate limiting middleware, especially on auth endpoints
2. **[Critical]** Add `secureHeaders()` middleware (one line fix)
3. **[Critical]** Handle DB unique constraint errors in register/createUser (race condition)
4. **[High]** Add UUID validation on all route path parameters
5. **[High]** Fix `db/reset.ts` stale table names
6. **[High]** Add `.orderBy()` to all list queries
7. **[High]** Add request body size limit
8. **[High]** Validate email uniqueness in `updateUser`
9. **[Medium]** Add graceful shutdown handling
10. **[Medium]** Configure connection pool parameters
11. **[Medium]** Add `.unique()` to `resources.slug` or handle slug collisions
12. **[Medium]** Replace non-null assertions with explicit checks
13. **[Medium]** Strengthen password validation requirements
14. **[Medium]** Implement refresh token rotation with Redis storage
15. **[Low]** Standardize error message language (Vietnamese vs English)
16. **[Low]** Remove unused `requestLogger` dead code
17. **[Low]** Set CORS `maxAge` for preflight caching
18. **[Low]** Add `maxAge` to CORS config

---

## Metrics

| Metric | Value |
|--------|-------|
| Total Files | 21 |
| Total LOC | 1,177 |
| Avg LOC/file | 56 |
| Max LOC file | `resource-service.ts` (194) |
| Files > 200 lines | 0 (all compliant) |
| Test Coverage | **0%** (no test files) |
| Zod Validation Coverage | ~90% (missing on refresh endpoint, path params) |
| Auth Endpoints | 5 (register, login, refresh, logout, me) |
| Protected Endpoints | 11/16 (all except health, root, login, register, refresh, logout) |

---

## Unresolved Questions

1. Is Redis intended for rate limiting, session storage, or caching? Env vars are defined but Redis is never used anywhere in the codebase.
2. Should the `resources.slug` be unique globally or unique per user?
3. Is Vietnamese the intended language for user-facing validation errors, or should everything be English?
4. Is there a plan for the `error` status in resources? The `ACTION_STATUS_MAP` at `resource-service.ts:163-168` maps `archive` to `inactive` and `restore` to `active` -- there is no way to set or clear the `error` status via actions.
