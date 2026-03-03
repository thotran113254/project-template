# VPS Management Dashboard

Monorepo application for managing VPS servers. Built with Hono.js (API), React (Web), PostgreSQL, and Redis.

## Tech Stack

- **API**: Hono.js, Drizzle ORM, PostgreSQL, jose (JWT), bcryptjs
- **Web**: React 19, Vite, TailwindCSS v4, shadcn/ui, React Router, TanStack Query
- **Shared**: TypeScript types, Zod schemas, constants
- **Infra**: Docker Compose (PostgreSQL 17 + Redis 7), pnpm workspaces

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env and configure
cp .env.example .env

# 3. Start PostgreSQL + Redis
pnpm docker:up

# 4. Push database schema
pnpm db:push

# 5. Seed sample data
pnpm db:seed

# 6. Start dev servers (API + Web)
pnpm dev
```

- **Web**: http://localhost:5173
- **API**: http://localhost:3001
- **Drizzle Studio**: `pnpm db:studio`

## Default Users (seed)

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | Admin123! | admin |
| user@example.com | User123! | user |

## Project Structure

```
project-template/
├── apps/
│   ├── api/          # Hono.js REST API
│   │   └── src/
│   │       ├── db/           # Drizzle schema, seed, connection
│   │       ├── lib/          # JWT utils, password utils
│   │       ├── middleware/   # Auth, error handler
│   │       ├── modules/      # Auth, users, VPS (routes + services)
│   │       └── routes/       # Route aggregator
│   └── web/          # React SPA
│       └── src/
│           ├── components/   # UI, layout, auth, VPS components
│           ├── hooks/        # useAuth
│           ├── lib/          # API client, utils
│           └── pages/        # Dashboard, VPS, Users, Auth pages
├── packages/
│   └── shared/       # Types, Zod schemas, constants
├── docker-compose.yml
└── package.json
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/v1/auth/register | - | Register new user |
| POST | /api/v1/auth/login | - | Login |
| POST | /api/v1/auth/refresh | - | Refresh tokens |
| GET | /api/v1/auth/me | JWT | Current user |
| GET | /api/v1/users | Admin | List users |
| POST | /api/v1/users | Admin | Create user |
| PATCH | /api/v1/users/:id | Admin | Update user |
| DELETE | /api/v1/users/:id | Admin | Delete user |
| GET | /api/v1/vps | JWT | List VPS |
| POST | /api/v1/vps | JWT | Create VPS |
| GET | /api/v1/vps/:id | JWT | VPS detail + metrics |
| PATCH | /api/v1/vps/:id | JWT | Update VPS |
| DELETE | /api/v1/vps/:id | JWT | Delete VPS |
| POST | /api/v1/vps/:id/action | JWT | Start/Stop/Restart |
| GET | /api/v1/vps/:id/metrics | JWT | Metrics history |

## Scripts

```bash
pnpm dev          # Start all dev servers
pnpm build        # Build all packages
pnpm typecheck    # Type check all packages
pnpm test         # Run all tests
pnpm db:push      # Sync schema to DB
pnpm db:seed      # Seed sample data
pnpm db:studio    # Open Drizzle Studio
pnpm docker:up    # Start Docker containers
pnpm docker:down  # Stop Docker containers
```
