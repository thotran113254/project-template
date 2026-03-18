# Codebase Summary

## Project Overview

VPS Management Dashboard - Tourism market data system with AI-powered chatbot and dynamic pricing calculator. Monorepo structure using pnpm workspaces.

## Technology Stack

- **Backend**: Hono.js + Drizzle ORM + PostgreSQL + Redis
- **Frontend**: React 19 + Vite + TailwindCSS v4 + shadcn/ui
- **Auth**: JWT (Jose) + bcryptjs
- **AI**: Gemini API integration
- **Database**: PostgreSQL 17 + Redis 7
- **Package Manager**: pnpm workspaces

## Project Structure

```
project-template/
├── apps/
│   ├── api/                    # Hono.js REST API
│   │   └── src/
│   │       ├── db/schema/      # Drizzle ORM schemas (19 tables)
│   │       ├── db/seed/        # Seed scripts
│   │       ├── modules/        # Feature modules
│   │       │   ├── auth/
│   │       │   ├── users/
│   │       │   ├── market-data/    # Market data CRUD
│   │       │   ├── chat/           # Gemini AI chatbot
│   │       │   └── pricing/        # Combo calculator (NEW)
│   │       ├── middleware/     # Auth, error handling
│   │       └── routes/         # Route mounting
│   └── web/                    # React SPA
│       └── src/
│           ├── pages/          # Page components
│           ├── components/     # UI components
│           └── hooks/          # React hooks
└── packages/
    └── shared/                 # Shared types & schemas
        └── src/
            ├── types/          # TypeScript definitions
            ├── schemas/        # Zod validation
            └── constants/      # App constants
```

## Database Schema (v2.3)

### Core Tables (29 total)

**Existing (10)**: users, bookings, hotels, hotel_rooms, chats, chat_messages, chat_sessions, etc.

**Market Data (17)**:
- `markets` - Tourism destinations
- `market_properties` - Accommodation per market
- `property_rooms` - Room types & inventory
- `room_pricing` - Multi-combo pricing (3N2D, 2N1D, per_night)
- `market_competitors` - Competitive analysis
- `evaluation_criteria` + `property_evaluations` - Property assessment
- `itinerary_templates` + `itinerary_template_items` - Travel itineraries
- `market_customer_journeys` - Customer journey stages
- `market_target_customers` - Customer segments
- `market_attractions` - Tourism attractions
- `market_dining_spots` - Restaurants/cafes
- `market_transportation` - Transport routes
- `market_inventory_strategies` - Seasonal inventory
- `pricing_configs` - Flexible pricing rules
- `ai_data_settings` - AI visibility toggles

**Transport & Pricing (2 NEW)**:
- `transport_providers` - Bus/ferry providers per market
- `transport_pricing` - Pricing by vehicle class & seat type

### Key Features
- `ai_visible` boolean per record for AI context filtering
- JSONB fields for flexible metadata
- Multi-level pricing with surcharges
- Foreign key constraints for referential integrity
- Strategic indexes (50+) for query optimization

## API Architecture

### Authentication
- JWT bearer tokens (`Authorization: Bearer {token}`)
- Role-based access (admin/user)
- Refresh token rotation strategy

### Response Format
```typescript
{
  success: boolean,
  data: T,
  error?: { code: string, message: string }
}
```

### API Versions
- Current: `/api/v1`
- 70+ endpoints across 17 resource groups

### Key Endpoint Groups
| Path | Methods | Purpose |
|------|---------|---------|
| `/api/v1/markets` | GET, POST, PATCH, DELETE | Market CRUD |
| `/api/v1/markets/:id/properties` | GET, POST, PATCH, DELETE | Property management |
| `/api/v1/properties/:id/rooms` | GET, POST, PATCH, DELETE | Room management |
| `/api/v1/rooms/:id/pricing` | GET, POST, PUT, PATCH, DELETE | Pricing CRUD |
| `/api/v1/markets/:id/transport-providers` | GET, POST, PATCH, DELETE | Transport CRUD (NEW) |
| `/api/v1/transport-providers/:id/pricing` | GET, POST, PUT, PATCH, DELETE | Transport pricing (NEW) |
| `/api/v1/combo-calculator/calculate` | POST | Combo quote calculation (NEW) |
| `/api/v1/evaluation-criteria` | GET, POST, PATCH, DELETE | Evaluation templates |
| `/api/v1/pricing-configs` | GET, POST, PATCH, DELETE | Pricing rules |
| `/api/v1/ai-data-settings` | GET, PUT | AI visibility config |

## Module Architecture

### Auth Module
- Login/register with JWT
- Password hashing (bcryptjs)
- Role-based middleware
- Token refresh strategy

### Users Module
- User CRUD
- Profile management
- Admin user list

### Market Data Module
15 services for complete market data management:
- Markets, properties, rooms, pricing
- Evaluations, itineraries
- Competitors, customer journeys
- Attractions, dining, transportation
- Inventory strategies
- AI visibility controls
- AI context builder (structured formatting)

### Chat Module (Gemini AI)
- Streaming message responses
- Context caching (5-min TTL)
- AI chatbot tools:
  - `getTransportPricing` - Fetch transport pricing
  - `calculateComboPrice` - Quote builder

### Pricing Module (NEW)
- Combo calculator orchestrator
- Room allocation algorithm
- Transport + ferry cost resolver
- Multi-level pricing logic (standard, discount, surcharges)
- Profit margin application

## Frontend Architecture

### Page Structure
- `/` - Dashboard
- `/markets` - Market list
- `/markets/:id` - Market detail (10 tabs)
- `/settings/ai` - AI visibility config
- `/chat` - AI chatbot
- Auth pages (login, register)

### Market Detail Tabs
1. Overview
2. Properties & Pricing
3. Evaluations
4. Itineraries
5. Competitors
6. Customer Journey
7. Attractions
8. Dining
9. Transportation
10. Inventory Strategy

### State Management
- **Server State**: TanStack Query (React Query)
- **Local State**: React hooks (useState)
- **Form State**: React Hook Form + Zod
- **Routing**: React Router v6

### Component Organization
```
components/
├── layout/              # AppLayout, Sidebar
├── market-data/         # Market data admin components
│   ├── market-form-modal
│   ├── properties-tab
│   ├── rooms-pricing-panel
│   ├── evaluation-matrix
│   ├── itinerary-editor
│   ├── competitors-tab
│   ├── customer-journey-tab
│   ├── transportation-tab
│   ├── dining-spots-management
│   ├── attraction-management
│   └── ai-visibility-toggle
├── chat/                # Chat UI components
└── shared/              # Common UI components
```

## AI Chatbot Integration

### Context Building Pipeline
1. Query market data tables (WHERE ai_visible = true)
2. Apply category-level toggles (12 categories)
3. Format as readable structured text
4. Inject into Gemini system prompt
5. Cache context (5-minute TTL)

### AI Use Cases
1. Pricing calculation with dynamic rules
2. Property comparison using criteria
3. Itinerary suggestions
4. Competitor analysis
5. Customer segment targeting
6. Pricing strategy recommendations
7. Market insights generation
8. Multi-market comparisons

### System Prompt Structure
- Vietnamese role & instructions
- Structured market data sections
- Per-category data formatting
- 30k character context limit

## Data Flow Patterns

### Create Resource Flow
```
Admin UI Form
→ React form validation (Zod)
→ POST /api/v1/resource
→ API auth middleware (JWT)
→ Service layer (business logic)
→ Drizzle ORM (SQL generation)
→ PostgreSQL (persist)
→ TanStack Query (cache update)
→ UI re-render
```

### AI Chat Flow
```
User message
→ Check cached AI context
→ Query market tables (ai_visible = true)
→ Build structured context
→ Append conversation history
→ Call Gemini API (streaming)
→ Return response to user
```

### Combo Calculator Flow
```
POST /combo-calculator/calculate
→ Validate request (Zod schema)
→ Allocate guests to rooms
→ Resolve transport + ferry
→ Calculate pricing (standard, discount)
→ Apply profit margin
→ Return breakdown (rooms, transport, totals)
```

## Security Measures

- **Input Validation**: Zod schemas on all APIs
- **SQL Injection Prevention**: Drizzle ORM with prepared statements
- **Authentication**: JWT with expiration (15 min access, 7 day refresh)
- **Authorization**: Role-based access control (admin/user)
- **Data Protection**: Passwords hashed (bcryptjs), no sensitive logs
- **AI Visibility**: Admin controls data access per category & record
- **HTTPS**: Enforced in production

## Performance Optimizations

### Database
- 50+ strategic indexes on FK, status, ai_visible
- Pagination for large result sets
- Query optimization via Drizzle

### API
- Response compression
- Request deduplication (TanStack Query)
- Lazy loading (large data)
- Cache middleware

### Frontend
- Code splitting via React Router
- Image lazy loading
- CSS-in-JS tree shaking (TailwindCSS)
- Bundle analysis

### Caching
- Redis for session management
- In-memory AI context cache (5-min TTL)
- Client-side TanStack Query cache

## Testing Strategy

- **Unit Tests**: Services & utilities
- **Integration Tests**: API endpoints
- **Database Tests**: Schema & migrations
- **Component Tests**: React component rendering
- **E2E Tests**: Critical user flows

## Development Workflow

### Setup
```bash
pnpm install
cp .env.example .env
pnpm docker:up
pnpm db:push
pnpm db:seed
pnpm dev
```

### Key Commands
- `pnpm dev` - Start all apps
- `pnpm build` - Build all apps
- `pnpm typecheck` - TypeScript check
- `pnpm db:push` - Apply migrations
- `pnpm db:seed` - Seed database
- `pnpm docker:up` - Start containers
- `pnpm test` - Run tests

## Default Credentials (Seed)
- **Admin**: admin@example.com / Admin123!
- **User**: user@example.com / User123!

## Version History

| Version | Date | Status | Focus |
|---------|------|--------|-------|
| 1.1.0 | Mar 18, 2025 | Current | Pricing Calculator |
| 1.0.0 | Mar 16, 2025 | Stable | Market Data System |
| 0.5.0 | Mar 10, 2025 | Archive | API Backend |
| 0.3.0 | Mar 3, 2025 | Archive | DB Schema |
| 0.2.0 | Feb 15, 2025 | Archive | Frontend UI |
| 0.1.0 | Jan 15, 2025 | Archive | Project Setup |

## Known Limitations

1. AI context limit: ~30k characters
2. Single-file image uploads only
3. Timezone handling: UTC only
4. Real-time sync: 5-minute cache TTL
5. Audit logging: Not yet implemented

## Future Enhancements

- Real-time collaboration (WebSocket)
- Advanced analytics dashboard
- Mobile admin app (React Native)
- Multi-language support (English, Chinese)
- Custom report generation (PDF, Excel)
- ML-based pricing recommendations
- Third-party API integration
- Audit trail logging

## Key Files by Category

### Core Configuration
- `pnpm-workspace.yaml` - Workspace config
- `docker-compose.yml` - Local dev environment
- `tsconfig.base.json` - TypeScript base config

### API Entry Points
- `apps/api/src/index.ts` - API server
- `apps/api/src/routes/index.ts` - Route mounting
- `apps/api/src/middleware/auth-middleware.ts` - Auth guard

### Database
- `apps/api/src/db/index.ts` - DB client
- `apps/api/src/db/schema/` - All table definitions
- `apps/api/src/db/seed/` - Seed scripts

### Modules
- `apps/api/src/modules/*/service.ts` - Business logic
- `apps/api/src/modules/*/routes.ts` - Endpoint definitions

### Frontend
- `apps/web/src/pages/` - Page components
- `apps/web/src/components/` - Reusable components
- `apps/web/src/hooks/` - Custom hooks

### Shared
- `packages/shared/src/types/` - TypeScript types
- `packages/shared/src/schemas/` - Zod validation
- `packages/shared/src/constants/` - App constants

## Development Standards

- **File Naming**: kebab-case with descriptive names
- **File Size**: Keep under 200 lines (modularize if larger)
- **Code Style**: TypeScript + Prettier + ESLint
- **Commit Messages**: Conventional commits (feat:, fix:, etc.)
- **Documentation**: Keep docs in `./docs/` directory
- **API Responses**: Always wrap in ApiResponse<T>
- **Error Handling**: Try-catch with proper logging
- **Type Safety**: Strict TypeScript, Zod validation

## Contact & Support

For issues or questions, refer to:
- Project README: `./README.md`
- Development Rules: `./CLAUDE.md`
- API Documentation: See `system-architecture.md`
- Code Standards: See `code-standards.md`
