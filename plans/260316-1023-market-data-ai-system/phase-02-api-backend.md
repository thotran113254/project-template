# Phase 2: API Backend - CRUD + AI Context Builder

## Priority: HIGH | Status: ✅ COMPLETE

## Overview
API endpoints cho quản lý dữ liệu thị trường (admin CRUD) + AI context builder thay thế flat KB.

---

## Module Structure
```
apps/api/src/modules/market-data/
├── market-data-routes.ts          # Route mounting
├── markets-service.ts             # Markets CRUD
├── competitors-service.ts         # Competitors CRUD
├── customer-journey-service.ts    # Customer journey CRUD
├── properties-service.ts          # Properties CRUD
├── property-rooms-service.ts      # Rooms + pricing CRUD
├── evaluation-service.ts          # Criteria + evaluations CRUD
├── itinerary-templates-service.ts # Itinerary CRUD
├── pricing-configs-service.ts     # Pricing rules CRUD
├── ai-data-settings-service.ts    # AI visibility settings
└── ai-context-builder.ts          # Build structured context for Gemini
```

---

## API Endpoints

### Markets `/api/v1/markets`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | user | List markets (paginated, search) |
| GET | `/:id` | user | Get market with counts |
| POST | `/` | admin | Create market |
| PATCH | `/:id` | admin | Update market |
| DELETE | `/:id` | admin | Delete market (cascade) |

### Market Competitors `/api/v1/markets/:marketId/competitors`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | user | List by market |
| POST | `/` | admin | Create |
| PATCH | `/:id` | admin | Update |
| DELETE | `/:id` | admin | Delete |

### Customer Journeys `/api/v1/markets/:marketId/customer-journeys`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | user | List by market (ordered) |
| POST | `/` | admin | Create stage |
| PATCH | `/:id` | admin | Update |
| DELETE | `/:id` | admin | Delete |

### Properties `/api/v1/markets/:marketId/properties`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | user | List by market (paginated, filter by type/status) |
| GET | `/:id` | user | Get with rooms, evaluations, pricing |
| POST | `/` | admin | Create |
| PATCH | `/:id` | admin | Update |
| DELETE | `/:id` | admin | Delete (cascade rooms, pricing) |

### Property Rooms `/api/v1/properties/:propertyId/rooms`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | user | List rooms with pricing |
| POST | `/` | admin | Create room |
| PATCH | `/:id` | admin | Update |
| DELETE | `/:id` | admin | Delete (cascade pricing) |

### Room Pricing `/api/v1/rooms/:roomId/pricing`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | user | List pricing entries |
| POST | `/` | admin | Create pricing |
| PUT | `/` | admin | Bulk upsert pricing (replace all) |
| DELETE | `/:id` | admin | Delete |

### Evaluation Criteria `/api/v1/evaluation-criteria`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/?marketId=` | user | List criteria (global or by market) |
| POST | `/` | admin | Create criteria |
| PATCH | `/:id` | admin | Update |
| DELETE | `/:id` | admin | Delete |

### Property Evaluations `/api/v1/properties/:propertyId/evaluations`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | user | List evaluations with criteria info |
| PUT | `/` | admin | Bulk upsert evaluations |

### Itinerary Templates `/api/v1/markets/:marketId/itineraries`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | user | List by market |
| GET | `/:id` | user | Get with items |
| POST | `/` | admin | Create template |
| PATCH | `/:id` | admin | Update template |
| DELETE | `/:id` | admin | Delete (cascade items) |

### Itinerary Items `/api/v1/itineraries/:templateId/items`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | user | List items ordered |
| PUT | `/` | admin | Bulk replace items |

### Pricing Configs `/api/v1/pricing-configs`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/?marketId=&propertyId=` | user | List rules |
| POST | `/` | admin | Create rule |
| PATCH | `/:id` | admin | Update |
| DELETE | `/:id` | admin | Delete |

### AI Data Settings `/api/v1/ai-data-settings`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | admin | List all category settings |
| PATCH | `/:category` | admin | Toggle category |

### AI Toggle `/api/v1/ai-toggle`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PATCH | `/:entityType/:entityId` | admin | Toggle ai_visible on any record |

---

## AI Context Builder

File: `ai-context-builder.ts`

Replaces flat KB injection. Builds structured JSON context for Gemini:

```typescript
async function buildAiContext(): Promise<string> {
  // 1. Check ai_data_settings → which categories enabled
  // 2. For each enabled category, query records WHERE ai_visible = true
  // 3. Format as structured text (not raw JSON)
  // 4. Return formatted context string for Gemini system prompt
}
```

**Output format** (injected into Gemini system prompt):
```
=== THỊ TRƯỜNG: Cát Bà ===

[CƠ SỞ LƯU TRÚ]
1. Serõ (Homestay, 3.5★)
   - Phòng: Đôi View Biển (2 người) - Combo 3N2Đ: 2,500,000₫ (T2-T5), 2,800,000₫ (T6)...
   - Phòng: Suite (4 người) - ...

2. Memory Beach Hotel (Hotel, 4★)
   ...

[LỊCH TRÌNH MẪU]
1. Cát Bà 2N1Đ
   Ngày 1 - Sáng: 5h30 ga HN → 8h30 ga HP...
   ...

[ĐỐI THỦ]
1. Homestay tự MKT: nalani, sero - Kênh: TikTok, Facebook...

[QUY TẮC GIÁ]
- Trẻ em 0-5t: miễn phí, 5-10t: +100k, 10-16t: +200k
- Phụ thu Hạ Long→Sa Pa: 500k/người
```

---

## Implementation Steps
- [x] Create module folder structure
- [x] Implement markets-service.ts + routes
- [x] Implement competitors-service.ts
- [x] Implement customer-journey-service.ts
- [x] Implement properties-service.ts
- [x] Implement property-rooms-service.ts + room pricing
- [x] Implement evaluation-service.ts (criteria + evaluations)
- [x] Implement itinerary-templates-service.ts
- [x] Implement pricing-configs-service.ts
- [x] Implement ai-data-settings-service.ts
- [x] Implement ai-context-builder.ts
- [x] Implement ai-toggle endpoint
- [x] Mount routes in routes/index.ts
- [x] Test all endpoints

## Success Criteria
- [x] All CRUD endpoints work with proper auth
- [x] AI context builder generates accurate structured context
- [x] Admin can toggle ai_visible per record and per category
- [x] Pagination, search, filtering work correctly
