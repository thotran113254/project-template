# System Architecture

## Overview

VPS Management Dashboard built with modern web technologies. Monorepo using pnpm workspaces with a REST API backend (Hono.js), React frontend, and PostgreSQL database.

---

## Technology Stack

### Backend
- **Framework**: Hono.js (lightweight, fast HTTP framework)
- **ORM**: Drizzle ORM (type-safe SQL query builder)
- **Database**: PostgreSQL 17
- **Cache**: Redis 7
- **Auth**: JWT (jose library)
- **Password**: bcryptjs
- **Runtime**: Node.js

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: TailwindCSS v4
- **Component Library**: shadcn/ui
- **Routing**: React Router v6
- **State Management**: TanStack Query (server state)
- **Type Safety**: TypeScript

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Package Manager**: pnpm workspaces
- **Source Control**: Git

---

## Project Structure

```
project-template/
├── apps/
│   ├── api/                    # Hono.js REST API
│   │   ├── src/
│   │   │   ├── db/
│   │   │   │   ├── schema/     # Drizzle ORM schemas (17 market-data tables + existing)
│   │   │   │   ├── seed/       # Seed scripts for market data
│   │   │   │   └── index.ts    # DB client
│   │   │   ├── modules/        # Feature modules
│   │   │   │   ├── market-data/  # Market data management (NEW)
│   │   │   │   ├── auth/
│   │   │   │   └── users/
│   │   │   ├── middleware/     # Auth, error handling
│   │   │   ├── routes/         # Route mounting
│   │   │   ├── services/       # Business logic
│   │   │   └── index.ts        # App entry
│   │   └── package.json
│   └── web/                    # React SPA
│       ├── src/
│       │   ├── pages/          # Page components
│       │   ├── components/     # UI & feature components
│       │   │   ├── layout/
│       │   │   ├── market-data/  # Market data admin components (NEW)
│       │   │   └── shared/
│       │   ├── hooks/          # React hooks
│       │   ├── lib/            # Utilities, API client
│       │   └── index.tsx       # Entry
│       └── package.json
├── packages/
│   └── shared/                 # Shared types & schemas
│       └── src/
│           ├── types/          # TypeScript type definitions
│           ├── schemas/        # Zod validation schemas
│           └── constants/      # App constants
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json
```

---

## Module Architecture

### API Modules

#### Auth Module (`apps/api/src/modules/auth/`)
- Login, register, token refresh
- JWT token generation & validation
- Role-based middleware

#### Users Module (`apps/api/src/modules/users/`)
- User profile management
- User list (admin)

#### Market Data Module (`apps/api/src/modules/market-data/`)
Manages tourism market data, replacing Google Sheets.

**Services**:
- `markets-service.ts` - Market CRUD
- `competitors-service.ts` - Competitor analysis
- `customer-journey-service.ts` - Customer journey stages
- `target-customers-service.ts` - Target customer segments
- `attractions-service.ts` - Tourism attractions
- `dining-spots-service.ts` - Restaurants & cafes
- `transportation-service.ts` - Transportation routes & options
- `properties-service.ts` - Accommodation CRUD
- `property-rooms-service.ts` - Room types & inventory
- `room-pricing-service.ts` - Dynamic pricing tables
- `evaluation-service.ts` - Property evaluation criteria
- `itinerary-templates-service.ts` - Itinerary templates
- `pricing-configs-service.ts` - Flexible pricing rules
- `ai-data-settings-service.ts` - AI visibility toggles
- `ai-context-builder.ts` - Structured AI context builder
- `transport-provider-service.ts` - Bus/ferry provider management
- `transport-pricing-service.ts` - Transport pricing by vehicle class
- `ai-transport-fetchers.ts` - AI context for transport data

**Routes**: `/api/v1/markets`, `/api/v1/pricing-configs`, etc.

#### Pricing Module (`apps/api/src/modules/pricing/`) **NEW**
Calculates complex combo packages (rooms + transport + ferry) with multi-level pricing.

**Services**:
- `combo-calculator-service.ts` - Main combo pricing orchestrator
- `combo-room-allocator.ts` - Allocates guests to room types optimally
- `combo-transport-resolver.ts` - Resolves transport + ferry costs
- `combo-calculator-routes.ts` - POST `/combo-calculator/calculate` endpoint

**Features**:
- Multi-level pricing: standard, discount, under-standard, surcharges
- Dynamic occupancy: adults + children (free <5, discount <10)
- Profit margin application (default 15%, overridable)
- Role-based pricing visibility (staff: listed only, admin: listed + discount)

---

## Database Schema (v2.3)

### Core Market Data Tables (19 tables)

```
markets (1)──(N) market_competitors
   │────────(N) market_customer_journeys
   │────────(N) market_target_customers
   │────────(N) market_attractions
   │────────(N) market_dining_spots
   │────────(N) market_transportation
   │────────(N) market_inventory_strategies
   │────────(N) evaluation_criteria
   │────────(N) itinerary_templates ──(N) itinerary_template_items
   │────────(N) pricing_configs
   │────────(N) transport_providers ──(N) transport_pricing
   └────────(N) market_properties (1)──(N) property_rooms ──(N) room_pricing
                    │────────────(N) property_evaluations ──(1) evaluation_criteria
                    └────────────(N) pricing_configs

ai_data_settings (global toggles per 12 categories)
```

**Key Features**:
- `ai_visible` boolean per record for AI visibility control
- JSONB fields for flexible data (amenities, images, metadata)
- Multi-level pricing support (3N2D, 2N1D, per_night combos)
- Soft references between market data and existing tables

---

## API Architecture

### Authentication
- JWT bearer token in `Authorization: Bearer {token}` header
- Refresh token rotation strategy
- Role-based access control (admin/user)

### Response Format
All API responses wrap data in `ApiResponse<T>` structure:

```typescript
{
  success: boolean,
  data: T,
  error?: { code: string, message: string }
}
```

### API Versions
- Current: `/api/v1`
- Versioning strategy: URL path versioning for future compatibility

### Endpoints (70+)
Organized by resource:
- `/api/v1/markets` - Market management
- `/api/v1/pricing-configs` - Pricing rules
- `/api/v1/evaluation-criteria` - Evaluation templates
- `/api/v1/properties` - Property management
- `/api/v1/ai-data-settings` - AI visibility config
- `/api/v1/markets/:id/transport-providers` - Transport provider CRUD
- `/api/v1/transport-providers/:id/pricing` - Transport pricing CRUD
- `/api/v1/combo-calculator/calculate` - Combo package calculator
- And 62+ other endpoints for complete coverage

---

## Frontend Architecture

### Page Structure
- **Layout**: AppLayout with sidebar navigation
- **Pages**: Market management, AI settings
- **Components**: Reusable UI building blocks
- **Hooks**: React Query integration, custom business logic

### Market Data Admin UI
- **Markets Page** (`/markets`) - Market list & CRUD
- **Market Detail** (`/markets/:id`) - 10-tab market data management:
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

- **AI Settings Page** (`/settings/ai`) - Global data category toggles

### State Management
- **Server State**: TanStack Query for API data caching
- **Local State**: React hooks (useState)
- **Form State**: React Hook Form + Zod validation

---

## AI Chatbot Integration

### Context Building
Replaces flat KB with structured market data context:

1. **Data Collection**: Query DB for all active market data
2. **Filtering**: Apply `ai_visible` record flags + category settings
3. **Formatting**: Convert to readable structured text
4. **Injection**: Inject into Gemini system prompt
5. **Caching**: Cache context with 5-minute TTL

### AI Use Cases Supported
1. Price calculation with dynamic rules
2. Property comparison using evaluation criteria
3. Itinerary suggestions from templates
4. Competitor analysis
5. Customer segment targeting
6. Pricing strategy recommendations
7. Market trend analysis
8. Multi-market comparisons

### System Prompt Structure
```
[ROLE & INSTRUCTIONS]
Bạn là trợ lý AI du lịch...

[DỮ LIỆU THỊ TRƯỜNG]
=== THỊ TRƯỜNG: Cát Bà ===
[Cơ sở lưu trú]
[Lịch trình]
[Giá cả]
...
```

---

## Authentication & Authorization

### User Roles
- **Admin**: Full access to market data, AI settings, user management
- **User**: Read access to market data and AI chat

### Protected Routes
- API endpoints with `authMiddleware` check user JWT token
- Frontend routes guarded by `ProtectedRoute` component

### Default Credentials (Seed)
- **Admin**: admin@example.com / Admin123!
- **User**: user@example.com / User123!

---

## Data Flow

### Create Market + Properties Flow
```
Admin UI → React form
→ Form validation (Zod)
→ POST /api/v1/markets/{id}/properties
→ API auth middleware (JWT check)
→ properties-service (business logic)
→ Drizzle ORM (SQL generation)
→ PostgreSQL (persist)
→ Return response
→ TanStack Query (cache update)
→ UI update
→ AI context invalidated (rebuild next request)
```

### AI Chat Flow
```
User message
→ Chat service (fetch/cache AI context)
→ Query market_data tables (WHERE ai_visible = true)
→ Build structured context
→ Append conversation history
→ Call Gemini API with system prompt
→ Stream response to user
```

---

## Security Considerations

### Input Validation
- All API inputs validated with Zod schemas
- Frontend form validation before submission
- Backend double-checks all inputs

### Data Protection
- JWT tokens with expiration (15 min access, 7 day refresh)
- Password hashing with bcryptjs
- HTTPS enforced in production
- No sensitive data in logs

### Database
- Foreign key constraints
- Soft deletes via `status` field where appropriate
- Indexes on frequently queried fields
- Prepared statements via Drizzle ORM (SQL injection prevention)

### AI Visibility
- Admin controls which data categories AI can access
- Per-record `ai_visible` flag for fine-grained control
- AI context built only from visible data

---

## Performance Optimization

### Database
- Indexes on FK, status, ai_visible
- Pagination for large result sets
- Query optimization via Drizzle select

### API
- Response compression
- Request deduplication via TanStack Query
- Lazy loading of large data (properties, itineraries)

### Frontend
- Code splitting via React Router
- Image optimization with lazy loading
- CSS-in-JS tree shaking (TailwindCSS)
- Bundle analysis to identify bottlenecks

### Caching
- Redis for session management
- In-memory AI context cache (5 min TTL)
- Client-side TanStack Query cache

---

## Deployment Architecture

### Development Environment
```
docker-compose up → PostgreSQL (5432) + Redis (6379)
pnpm dev → API (3001) + Web (5173)
```

### Production Deployment
- Docker images for API and Web
- Database migrations via Drizzle
- Environment-specific configurations
- Reverse proxy (nginx) for Web + API

---

## Integration Points

### Existing Systems
- **Booking System**: Legacy tables (`bookings`, `hotels`) coexist with market data
- **Authentication**: Shared JWT tokens across all modules
- **User Management**: Central user table for all features

### New Integrations
- **Google Sheets**: Optional sync (one-time seed or periodic import)
- **Gemini AI**: Structured context via API calls
- **File Storage**: Images stored as URLs in JSONB (future: S3 integration)

---

## Data Sources (Mapping to Implementation)

| Spreadsheet | Tabs | → Tables | Status |
|---|---|---|---|
| Phú Quý Market | 7 tabs | markets, properties, competitors, attractions, dining, transportation, target_customers, inventory_strategies | ✅ |
| Cát Bà Analysis | 4 tabs | attractions, dining_spots, transportation, itineraries | ✅ |
| Customer Research | 2 tabs | target_customers, customer_journeys | ✅ |
| Product Standards | 1 tab | evaluation_criteria | ✅ |
| Pricing Rules | 4 tabs | room_pricing, pricing_configs | ✅ |

---

## Future Enhancements

1. **Real-time Collaboration**: WebSocket support for concurrent admin edits
2. **Advanced Analytics**: Dashboard with market insights & trends
3. **Multi-language**: Support for English, Chinese in addition to Vietnamese
4. **Mobile Admin**: React Native app for on-the-go management
5. **Audit Logging**: Track all data changes with timestamps & user
6. **Custom Reports**: Export market data in multiple formats (PDF, Excel)
7. **Integration API**: Public API for third-party integrations
8. **ML Pricing**: Machine learning model for dynamic price recommendations
