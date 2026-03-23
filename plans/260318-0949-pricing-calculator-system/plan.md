---
title: "Pricing Calculator System for Tourism Business"
description: "Dual-pricing room system, structured transport/ferry schemas, combo calculator, role-based visibility, AI chatbot integration"
status: pending
priority: P1
effort: 18h
branch: main
tags: [pricing, transport, ferry, combo-calculator, ai-tools, admin-ui]
created: 2026-03-18
---

# Pricing Calculator System

## Summary

Build a comprehensive pricing engine for tourism combo products: hotels (dual-priced), round-trip transport, ferries, and a combo calculator that rolls them up with a profit margin. Integrate with existing Gemini AI chatbot via new function-calling tools. Enforce role-based pricing visibility (staff=listed only, admin=both).

## Architecture Overview

```
                     +-----------------+
                     |   Admin UI      |
                     | (pricing mgmt)  |
                     +-------+---------+
                             |
          +------------------+-------------------+
          |                  |                   |
  Room Pricing      Transport Pricing    Ferry Pricing
  (dual price)      (providers+classes)  (providers+classes)
          |                  |                   |
          +--------+---------+-------------------+
                   |
           Combo Calculator Service
           (formula: sum * margin / ppl)
                   |
          +--------+---------+
          |                  |
   REST API endpoints   Gemini AI Tools
   (role-filtered)      (getTransportPricing,
                         calculateCombo)
```

## Phase Summary

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Schema changes: room pricing + transport providers + ferry](./phase-01-schema-changes.md) | pending | 3h |
| 2 | [Backend services + API routes](./phase-02-backend-services.md) | pending | 4h |
| 3 | [Combo calculator service](./phase-03-combo-calculator.md) | pending | 3h |
| 4 | [Gemini AI tool integration](./phase-04-ai-tool-integration.md) | pending | 3h |
| 5 | [Admin UI components](./phase-05-admin-ui.md) | pending | 3h |
| 6 | [Seed data + migration](./phase-06-seed-data.md) | pending | 2h |

## Key Dependencies

- Existing `room_pricing` table must be migrated (add columns, keep backward compat)
- Existing `market_transportation` table kept for descriptive data; NEW `transport_providers`/`transport_pricing` for structured pricing
- Gemini tool handlers pattern already established in `gemini-tool-handlers.ts`
- UI tab pattern established in `market-detail-page.tsx` + component tabs

## Critical Rules

1. **Discount prices are CONFIDENTIAL** - staff role sees `price` (listed) only; admin sees both `price` + `discountPrice`
2. **AI chatbot uses listed prices by default** - unless admin explicitly configures discount visibility
3. **Backward compatibility** - existing `room_pricing` data must survive migration (new columns nullable)
4. **Files < 200 lines** - split services into focused modules
