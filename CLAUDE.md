# Project Template - Claude Code Instructions

## Stack
- **Monorepo**: pnpm workspaces
- **API**: Hono.js + Drizzle ORM + PostgreSQL + JWT auth
- **Web**: React 19 + Vite + TailwindCSS v4 + shadcn/ui + React Router + TanStack Query
- **Shared**: TypeScript types, Zod schemas, constants in `packages/shared/`

## Project Structure
```
apps/api/src/         # Backend API
  db/schema/          # Drizzle ORM schemas
  modules/            # Feature modules (auth, users, resources)
  middleware/          # Auth, error handling
  routes/             # Route mounting
apps/web/src/         # Frontend SPA
  pages/              # Page components
  components/         # UI & feature components
  hooks/              # React hooks
  lib/                # Utilities
packages/shared/src/  # Shared types, schemas, constants
```

## Commands
- `pnpm dev` - Start all apps in dev mode
- `pnpm build` - Build all apps
- `pnpm typecheck` - TypeScript checking
- `pnpm db:push` - Push schema to DB
- `pnpm db:seed` - Seed database
- `pnpm docker:up` - Start Docker services

## Conventions
- Use kebab-case for file names
- Keep files under 200 lines
- API responses use `ApiResponse<T>` wrapper from shared
- All API routes are under `/api/v1`
- Use Zod schemas for validation
- Use `@app/shared` for shared imports

## Auth
- JWT access + refresh tokens
- Admin/User roles
- Protected routes require `authMiddleware`

## Default Users
- admin@example.com / Admin123! (admin)
- user@example.com / User123! (user)

## Task Completion
When a task is fully done and tested, output `TASK_COMPLETE` at the end of your response.
