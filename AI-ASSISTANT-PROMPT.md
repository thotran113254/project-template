# AI Travel Assistant - Implementation Task

## Overview
Build an AI Travel Assistant web application using the existing project-template monorepo.
This app helps travel agency sales staff and admins manage hotel bookings, pricing, and knowledge base through an AI chat interface.

## Design Source - Stitch MCP
Use the Stitch MCP to get designs and code for each screen. The MCP is already configured.

### Stitch Project ID: 3303082290047534548

### Screens to implement (use get_screen tool for each):
1. **Login Screen** (ID: c527054837d14bbca78ab13f929beb31) - Login page for staff/admin
2. **Main AI Chat Interface** (ID: ce550860515b4936959a933d9b5b14f6) - Primary chat interface with AI assistant
3. **Hotel Results** (ID: c53d0177b2364ed9b906557a5fdd0df7) - Search results for hotels
4. **Hotel Detail** (ID: 8a9350fd84b744e093b7c401c578d0c4) - Detailed hotel information page
5. **Pricing Tool (Sale)** (ID: bcc0f52c2a8f43679837503656ef5629) - Pricing calculator for sales staff
6. **Pricing Tool (Admin)** (ID: 3a490283ec9042bf8332782740eac8da) - Admin pricing management
7. **Knowledge Base Admin** (ID: 1f0e2cb7baca4c14bbdb445454ad97a6) - Admin knowledge base management
8. **Product & Price Management** (ID: f8f450f4097f4ca397250edb26e32755) - Product catalog and pricing tables
9. **UI Kit & Style Guide** (ID: 4360a2d1235f4b3f8b3e28a9904716db) - Design system reference

### How to use Stitch MCP:
- Call get_screen with projectId "3303082290047534548" and screenId for each screen
- Download screenshots with curl -L to docs/designs/ for reference
- Use the HTML code as reference for implementing React components
- Study screen 9 (UI Kit) first for design tokens and style guide

## Implementation Instructions

### Step 1: Fetch ALL designs first
- Use Stitch MCP get_screen tool for EACH screen ID listed above
- Download all screenshots to docs/designs/
- Read the UI Kit screen first to understand color palette, typography, spacing

### Step 2: Update Database Schema
- Add new tables in apps/api/src/db/schema/:
  - hotels: id, name, slug, description, location, star_rating, images(jsonb), amenities(jsonb), price_from, metadata(jsonb)
  - hotel_rooms: id, hotel_id(FK), room_type, price_per_night, capacity, description
  - bookings: id, user_id(FK), hotel_id(FK), room_id(FK), check_in, check_out, guests, status, total_price, notes
  - knowledge_base: id, title, content(text), category, tags(jsonb), created_by(FK)
  - chat_sessions: id, user_id(FK), title, created_at
  - chat_messages: id, session_id(FK), role(user/assistant/system), content(text), metadata(jsonb)
  - pricing_rules: id, hotel_id(FK), name, season_start, season_end, multiplier, min_nights, admin_notes
- Run: pnpm db:push --force
- Verify with PostgreSQL MCP: query tables

### Step 3: Implement Backend API modules
Add in apps/api/src/modules/ following existing auth/ pattern:
- hotels/ (hotel-routes.ts, hotel-service.ts) - CRUD, search, filter by location/stars/price
- bookings/ (booking-routes.ts, booking-service.ts) - CRUD, status workflow
- knowledge-base/ (kb-routes.ts, kb-service.ts) - CRUD, full-text search
- chat/ (chat-routes.ts, chat-service.ts) - sessions CRUD, messages, AI placeholder
- pricing/ (pricing-routes.ts, pricing-service.ts) - rules CRUD, price calculator
- Mount all routes in apps/api/src/routes/index.ts

### Step 4: Shared Types & Schemas
Add to packages/shared/src/:
- types/hotel-types.ts, booking-types.ts, chat-types.ts, kb-types.ts, pricing-types.ts
- schemas/hotel-schemas.ts, booking-schemas.ts, chat-schemas.ts, kb-schemas.ts, pricing-schemas.ts
- Export from index files

### Step 5: Implement Frontend Pages (match Stitch designs)
Create in apps/web/src/pages/:
- login-page.tsx (update to match Stitch Login Screen design)
- chat-page.tsx (Main AI Chat Interface)
- hotel-search-page.tsx (Hotel Results)
- hotel-detail-page.tsx (Hotel Detail)
- pricing-sale-page.tsx (Pricing Tool - Sale view)
- pricing-admin-page.tsx (Pricing Tool - Admin view)
- knowledge-base-page.tsx (Knowledge Base Admin)
- product-management-page.tsx (Product & Price Management)

### Step 6: Components
Create reusable components in apps/web/src/components/:
- chat/ (chat-input, chat-message, chat-sidebar)
- hotels/ (hotel-card, hotel-filters, hotel-gallery)
- pricing/ (pricing-calculator, pricing-table)
- knowledge-base/ (kb-editor, kb-list)

### Step 7: Navigation & Routing
- Update apps/web/src/app.tsx with new routes
- Update sidebar with role-based navigation:
  - All users: Chat, Hotels, Profile
  - Sales: Pricing Tool (Sale), Bookings
  - Admin: Pricing (Admin), Knowledge Base, Product Management, Users

## Technical Stack (already configured)
- Backend: Hono.js + Drizzle ORM + PostgreSQL 17 + Redis 7
- Frontend: React 18 + Vite + TailwindCSS v4 + shadcn/ui + TanStack Query
- Auth: JWT (access + refresh tokens, jti blacklist)
- Shared: packages/shared (types + Zod schemas + constants)
- DB: postgresql://postgres:postgres@localhost:5433/app_db

## Constraints
- Follow existing code patterns exactly (look at auth/ and resources/ modules)
- Keep files under 200 lines, modularize if needed
- Use kebab-case for all file names
- Use existing shadcn/ui + Tailwind components
- Match Stitch designs as closely as possible
- All API routes under /api/v1
- Run pnpm typecheck after each major step

## Verification
After completing ALL steps:
1. Run: pnpm typecheck (must pass with 0 errors)
2. Run: pnpm build (must succeed)
3. Output: TASK_COMPLETE
