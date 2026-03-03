# Code Review: Database Schema & Shared Package

**Reviewer:** code-reviewer
**Date:** 2026-03-03
**Scope:** `apps/api/src/db/`, `packages/shared/src/`, cross-cutting concerns

---

## Scope

- **Files reviewed:** 29 files across DB schema, shared package, API modules, middleware, configs
- **LOC:** ~850 (excluding node_modules, configs)
- **Focus:** Schema design, type safety, validation alignment, scalability

---

## Overall Assessment

The codebase has a clean, well-structured foundation with good separation of concerns. The monorepo setup with shared types/schemas is properly configured. However, there are several **critical data integrity issues**, **type misalignments**, and **missing patterns** that should be addressed before production use.

---

## Critical Issues

### C1. `slug` column lacks UNIQUE constraint -- data integrity risk

**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\api\src\db\schema\resources-schema.ts:17`

```ts
slug: varchar("slug", { length: 255 }).notNull(),
```

The `slug` field has an index (`resources_slug_idx`) but no unique constraint. Two resources can share the same slug, which defeats the purpose of slugs (used for URL-friendly identifiers). The `slugify()` function in `resource-service.ts:31` generates slugs purely from the name with no collision detection.

**Impact:** Duplicate slugs, broken URL routing if slugs are ever used in URLs.

**Fix:** Add `.unique()` to the slug column and add collision handling in `createResource()`:

```ts
// schema
slug: varchar("slug", { length: 255 }).notNull().unique(),

// service - add suffix on collision
async function generateUniqueSlug(baseName: string): Promise<string> {
  const base = slugify(baseName);
  const existing = await db.select({ slug: resources.slug })
    .from(resources).where(sql`slug LIKE ${base + '%'}`);
  if (existing.length === 0) return base;
  return `${base}-${existing.length + 1}`;
}
```

### C2. `reset.ts` drops stale table names (vps_servers, vps_metrics)

**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\api\src\db\reset.ts:8-10`

```ts
await db.execute(sql`DROP TABLE IF EXISTS vps_metrics CASCADE`);
await db.execute(sql`DROP TABLE IF EXISTS vps_servers CASCADE`);
await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);
```

The schema was refactored from VPS-specific to generic Resources, but `reset.ts` still references the old `vps_metrics` and `vps_servers` tables and **does not drop the current `resources` table**. Running `db:reset` followed by `db:push` + `db:seed` will leave orphaned `resources` data.

**Fix:**
```ts
await db.execute(sql`DROP TABLE IF EXISTS resources CASCADE`);
await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);
```

### C3. `metadata` Zod schema type mismatch with DB schema

**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\packages\shared\src\schemas\resource-schemas.ts:7`

```ts
metadata: z.record(z.string()).optional().default({}),
```

**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\api\src\db\schema\resources-schema.ts:21`

```ts
metadata: jsonb("metadata").notNull().default({}),
```

The Zod schema validates `Record<string, string>` (string values only), but `jsonb` can store any JSON. The seed data at `seed.ts:71-98` stores `{ priority: "high", version: "1.0" }` which happens to be string values -- but the DB has no restriction. Meanwhile the shared type at `resource-types.ts:10` also declares `Record<string, string>`.

**Impact:** If any code writes nested objects or numeric values to `metadata` via direct DB queries, the types will lie. The `toResource()` function casts blindly: `(row.metadata ?? {}) as Record<string, string>`.

**Recommendation:** Either:
- Tighten DB with a CHECK constraint or accept `Record<string, unknown>` in types
- Or keep `Record<string, string>` but add runtime validation in `toResource()` to sanitize

---

## High Priority

### H1. `updatedAt` never auto-updates -- requires manual `sql\`now()\``

**Files:**
- `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\api\src\db\schema\users-schema.ts:13-14`
- `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\api\src\db\schema\resources-schema.ts:28-30`

```ts
updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
```

`defaultNow()` only sets the value on INSERT. Updates require explicit `updatedAt: sql\`now()\`` in every `.set()` call. This is done manually in `resource-service.ts:132` and `user-service.ts:84`, but if any future code forgets, `updatedAt` will silently stay stale.

**Fix:** Add a PostgreSQL trigger or use Drizzle's `$onUpdateFn`:

```ts
updatedAt: timestamp("updated_at", { withTimezone: true })
  .notNull()
  .defaultNow()
  .$onUpdateFn(() => new Date()),
```

### H2. No `ORDER BY` on any list query -- non-deterministic pagination

**Files:**
- `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\api\src\modules\resources\resource-service.ts:48-56`
- `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\api\src\modules\users\user-service.ts:34-36`

Neither `listResources()` nor `listUsers()` specifies `ORDER BY`. Without ordering, paginated results are non-deterministic -- items can appear on multiple pages or be skipped entirely when data changes between requests.

**Fix:** Add `.orderBy(desc(resources.createdAt))` or similar:

```ts
import { desc } from "drizzle-orm";
// in listResources:
db.select().from(resources).where(condition)
  .orderBy(desc(resources.createdAt))
  .limit(limit).offset(offset),
```

### H3. `status` and `role` columns are unconstrained `varchar` -- no CHECK constraint

**Files:**
- `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\api\src\db\schema\resources-schema.ts:19`
- `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\api\src\db\schema\users-schema.ts:8`

```ts
status: varchar("status", { length: 20 }).notNull().default("inactive"),
role: varchar("role", { length: 20 }).notNull().default("user"),
```

No database-level constraint ensures only valid values (`active|inactive|pending|error` for status, `admin|user` for role). While Zod validates on input, direct DB access or seed scripts could insert invalid values.

**Fix:** Use `pgEnum` from Drizzle:

```ts
import { pgEnum } from "drizzle-orm/pg-core";

export const resourceStatusEnum = pgEnum("resource_status", [
  "active", "inactive", "pending", "error"
]);
export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);
```

Or add CHECK constraints if enums are too rigid for a template.

### H4. `archive` action maps to `inactive` -- no distinct state

**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\api\src\modules\resources\resource-service.ts:163-168`

```ts
const ACTION_STATUS_MAP: Record<ResourceAction, string> = {
  activate: "active",
  deactivate: "inactive",
  archive: "inactive",  // <-- same as deactivate
  restore: "active",    // <-- same as activate
};
```

`archive` and `deactivate` both set status to `"inactive"`, making them indistinguishable. If archive is a meaningful action, it should have an `"archived"` status in `RESOURCE_STATUSES`. Otherwise, remove the `archive`/`restore` actions to avoid confusion.

### H5. Resource `category` has no validation against constants

**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\packages\shared\src\schemas\resource-schemas.ts:6`

```ts
category: z.string().min(1, "Category is required"),
```

The Zod schema accepts any non-empty string, but `RESOURCE_CATEGORIES` in `resource-constants.ts` defines a specific list. These are not connected.

**Fix:**
```ts
import { RESOURCE_CATEGORIES } from "../constants/resource-constants";
const categoryValues = RESOURCE_CATEGORIES.map(c => c.value) as [string, ...string[]];
category: z.enum(categoryValues),
```

---

## Medium Priority

### M1. No soft delete pattern

Both `users` and `resources` use hard deletes. When a user is deleted, all their resources cascade-delete too (`onDelete: "cascade"` on `resources-schema.ts:24`). For a production template, consider adding:

```ts
deletedAt: timestamp("deleted_at", { withTimezone: true }),
```

And filtering `WHERE deleted_at IS NULL` in all queries.

### M2. No migration files committed -- only `db:push` workflow

The `apps/api/drizzle/` directory does not exist. The only schema sync method is `db:push` (direct schema diff). While `db:generate` and `db:migrate` scripts exist in `package.json`, there are no generated migration files.

For a production-ready template, at minimum document that `db:push` is for development only and migrations should be generated before production deploys.

### M3. `users` table has no index on `role`

**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\api\src\db\schema\users-schema.ts`

Unlike `resources` which has 3 indexes, `users` has no indexes beyond the primary key and unique email constraint. If admin-only queries filter by role, an index would help at scale.

### M4. Vietnamese vs English validation messages inconsistency

**Shared schemas mix languages:**
- `auth-schemas.ts:4` -- Vietnamese: `"Email khong hop le"`, `"Mat khau toi thieu 6 ky tu"`
- `user-schemas.ts:4` -- Vietnamese: `"Email khong hop le"`
- `resource-schemas.ts:4` -- **English**: `"Name is required"`, `"Category is required"`

Pick one language. Since this is a template that may be cloned for different clients, consider using error codes or i18n keys instead of hardcoded messages.

### M5. `CreateResourceDto` vs `createResourceSchema` field mismatch

**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\packages\shared\src\types\resource-types.ts:16-21`

```ts
export interface CreateResourceDto {
  name: string;
  description: string;  // required
  category: string;
  metadata?: Record<string, string>;
}
```

**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\packages\shared\src\schemas\resource-schemas.ts:3-8`

```ts
export const createResourceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(""),  // optional (has default)
  category: z.string().min(1),
  metadata: z.record(z.string()).optional().default({}),
});
```

The DTO type says `description: string` (required), but the Zod schema makes it optional with `.default("")`. The Zod-inferred `CreateResourceInput` type (exported at line 21) correctly reflects the optional nature, but `CreateResourceDto` does not.

**Fix:** Use `z.infer<typeof createResourceSchema>` as the single source of truth. Remove the manual `CreateResourceDto` or align it:

```ts
export interface CreateResourceDto {
  name: string;
  description?: string;
  category: string;
  metadata?: Record<string, string>;
}
```

### M6. Duplicate type definitions -- DTOs vs Zod inferred types

The shared package exports BOTH manually written interfaces (`LoginDto`, `RegisterDto`, `CreateResourceDto`, `CreateUserDto`) AND Zod-inferred types (`LoginInput`, `RegisterInput`, `CreateResourceInput`, `CreateUserInput`). These are semantically identical but can drift apart.

**Recommendation:** Pick one source of truth. Either:
- Use `z.infer<>` types exclusively and export them as the DTOs
- Or remove the Zod `type` exports and keep manual interfaces

### M7. `name` max length mismatch between schema and validation

**DB:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\api\src\db\schema\resources-schema.ts:16`
```ts
name: varchar("name", { length: 255 })
```

**Zod:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\packages\shared\src\schemas\resource-schemas.ts:4`
```ts
name: z.string().min(1, "Name is required").max(100)
```

DB allows 255 chars but Zod caps at 100. While the Zod restriction is more conservative (safe), the mismatch means someone bypassing Zod validation could insert 255-char names. Consider aligning both to the same limit.

### M8. `password_hash` column length may be insufficient

**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\api\src\db\schema\users-schema.ts:7`

```ts
passwordHash: varchar("password_hash", { length: 255 }).notNull(),
```

bcrypt hashes are 60 characters, so 255 is fine. However, if the project ever migrates to Argon2id (recommended for new projects), hashes can be ~97 chars. 255 is sufficient for now.

**Status:** Acceptable, noted for awareness.

---

## Low Priority

### L1. Seed data uses hardcoded passwords

**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\api\src\db\seed.ts:24,50`

`Admin123!` and `User123!` are fine for a development template but should be documented clearly as development-only credentials. (They are documented in CLAUDE.md -- good.)

### L2. `connection.ts` creates a global singleton with no connection pool config

**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\api\src\db\connection.ts:6`

```ts
const queryClient = postgres(env.DATABASE_URL);
```

The `postgres` driver uses a default pool of 10 connections. For production templates, consider exposing pool size config:

```ts
const queryClient = postgres(env.DATABASE_URL, {
  max: parseInt(optionalEnv("DB_POOL_SIZE", "10"), 10),
});
```

### L3. Shared package `exports` map is good but could add `./package.json`

**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\packages\shared\package.json:8-13`

Some bundlers need `"./package.json": "./package.json"` in the exports map. Minor compatibility concern.

### L4. `resource-service.ts` uses `Record<string, unknown>` for update

**File:** `D:\CODE-PROJECT-AI\QUAN-LY-VPS\project-template\apps\api\src\modules\resources\resource-service.ts:130`

```ts
const updateData: Record<string, unknown> = { ...dto, updatedAt: sql`now()` };
```

Loses type safety. Could use Drizzle's inferred insert type.

---

## Edge Cases Found by Scouting

1. **Slug collision on resource creation**: Two resources named "Test" both get slug "test" -- no uniqueness check or suffix generation. Silent overwrite or DB error if unique constraint is added later.

2. **Cascading user delete removes all resources**: No confirmation or soft-delete. Admin deleting a user wipes all their resources instantly (`onDelete: "cascade"`).

3. **Race condition on resource action + update**: Two concurrent requests (one to update, one to perform action) on the same resource can interleave, and the `updatedAt` manual timestamp may be overwritten.

4. **`listResources` for admin fetches ALL resources with no filtering**: Admin sees every resource. No search, filtering by status/category, or sorting. At scale this becomes a performance issue.

5. **`paginationQuerySchema` accepts `undefined` query params**: When `c.req.query("page")` returns `undefined`, `z.coerce.number()` coerces `undefined` to `NaN`, which fails `.min(1)`. The `.default(1)` only applies if the key is missing from the object entirely. Test this path.

6. **`createUser` in `user-service.ts` always creates role "user"**: Admin cannot create another admin via the users API. The `createUserSchema` does not include `role`. This may be intentional, but worth noting.

---

## Positive Observations

1. **Clean barrel exports**: `packages/shared/src/index.ts` re-exports cleanly from sub-modules; package.json `exports` map allows granular imports.

2. **Zero `any` types**: The shared package has no `any` type usage anywhere. Good discipline.

3. **Proper Hono error handling**: The `errorHandler` middleware correctly handles ZodError, HTTPException, and generic errors with consistent `ApiResponse` format.

4. **Good auth architecture**: Separate access/refresh tokens, typed JWT payload, proper middleware chaining (auth -> admin).

5. **Idempotent seed script**: Checks for existing records before inserting. Safe to run multiple times.

6. **`noUncheckedIndexedAccess`** enabled in `tsconfig.base.json`: Forces null checks on array/object index access. Excellent safety.

7. **Non-null assertions (`!`) are used carefully**: Only after checked array destructuring patterns where the query guarantees results.

8. **CORS properly configured**: Origins, methods, and credentials are all specified. `X-Total-Count` is exposed.

---

## Recommended Actions (Prioritized)

1. **[CRITICAL]** Add unique constraint on `resources.slug` + collision handling in `createResource()`
2. **[CRITICAL]** Fix `reset.ts` to drop current table names (`resources`, `users`) instead of stale VPS table names
3. **[HIGH]** Add `ORDER BY` to all list queries
4. **[HIGH]** Add `$onUpdateFn` or DB trigger for `updatedAt` auto-update
5. **[HIGH]** Validate `category` against `RESOURCE_CATEGORIES` constants in Zod schema
6. **[HIGH]** Add distinct `"archived"` status or remove `archive`/`restore` actions
7. **[MEDIUM]** Align `CreateResourceDto` with `createResourceSchema` (or remove duplicate DTOs)
8. **[MEDIUM]** Pick one language for validation messages (Vietnamese or English)
9. **[MEDIUM]** Align `name` max length between DB (255) and Zod (100)
10. **[MEDIUM]** Consider adding soft delete pattern with `deletedAt` column
11. **[LOW]** Add connection pool size configuration

---

## Metrics

| Metric | Value |
|--------|-------|
| Type Coverage | High (no `any`, strict mode, `noUncheckedIndexedAccess`) |
| Test Coverage | Unknown (no test files found in reviewed scope) |
| Linting Issues | 0 syntax errors; language inconsistency in messages |
| Schema Tables | 2 (users, resources) |
| Shared Exports | 4 entry points (root, types, schemas, constants) |
| Indexes | 4 total (3 on resources, 1 unique on users.email) |

---

## Unresolved Questions

1. Should `metadata` support nested objects (`Record<string, unknown>`) or stay flat (`Record<string, string>`)?
2. Is the `archive`/`restore` action pair intentionally aliased to `inactive`/`active`, or should there be an `"archived"` status?
3. Should validation messages use Vietnamese, English, or i18n keys?
4. Is `role` management intentionally limited (no admin creation via API)?
5. Is `db:push` the intended production deployment strategy, or will migrations be adopted?
