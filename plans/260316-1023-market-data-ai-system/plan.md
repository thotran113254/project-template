# Plan: Hệ Thống Quản Lý Thu Thập Dữ Liệu Thị Trường + AI Chatbot

## Mục Tiêu
Xây dựng hệ thống quản lý dữ liệu thị trường du lịch có cấu trúc, tích hợp AI chatbot cho nhân viên sale, admin cấu hình linh hoạt. **Thay thế hoàn toàn Google Sheets.**

## Tổng Quan Phases

| Phase | Mô tả | Status |
|-------|--------|--------|
| 1 | Database Schema - 17 tables (v2, full 18-tab review) | ✅ COMPLETE |
| 2 | API Backend - CRUD + AI context builder | ✅ COMPLETE |
| 3 | Admin UI - Quản lý dữ liệu thị trường (thay thế Sheets) | ✅ COMPLETE |
| 4 | AI Chatbot Enhancement - Structured context for Gemini | ✅ COMPLETE |
| 5 | Data Import - Seed từ 5 Spreadsheets (18 tabs) | ✅ COMPLETE |

## Kiến Trúc Dữ Liệu v2

```
markets (thị trường)
├── market_competitors (đối thủ)
├── market_customer_journeys (hành trình KH - multi-phase)
├── market_target_customers (phân khúc KH mục tiêu)       ⭐ NEW
├── market_attractions (điểm du lịch, check-in)            ⭐ NEW
├── market_dining_spots (quán ăn, café)                     ⭐ NEW
├── market_transportation (phương tiện di chuyển)           ⭐ NEW
├── market_inventory_strategies (chiến lược ôm quỹ phòng)  ⭐ NEW
├── evaluation_criteria (bộ tiêu chí đánh giá)
├── itinerary_templates → itinerary_template_items
├── pricing_configs (quy tắc giá linh hoạt)
└── market_properties (cơ sở lưu trú)
    ├── property_evaluations (đánh giá theo tiêu chí)
    ├── property_rooms (loại phòng + mã booking)
    │   └── room_pricing (giá theo combo_type × day_type × season)  ⭐ REDESIGNED
    └── pricing_configs (quy tắc giá per property)

ai_data_settings (admin toggle AI access per 12 categories)
```

## Key Decisions
- **Extend vs Replace**: Giữ tables cũ (hotels, bookings), tạo 17 tables mới cho market data domain
- **AI Context**: Chuyển từ flat KB → structured context builder (12 data categories)
- **Admin AI Control**: `ai_visible` flag per record + global category toggle (12 categories)
- **Pricing**: Multi-combo (3N2D, 2N1D, per_night) × day_type × season, configurable rules per property/market
- **room_pricing redesign**: `combo_type` field thay vì hardcode `combo_3n2d` → flexible cho nhiều loại combo

## Review vs Dữ Liệu Thực Tế (5 Spreadsheets, 18 Tabs)

| Spreadsheet | Tabs | → Tables | Status |
|---|---|---|---|
| SS1: Phú Quý Market (7 tabs) | Tổng quan, Điểm check-in + ăn uống, Phương tiện, KS/Homestay, Quỹ ôm, KH mục tiêu, Đối thủ | markets, attractions, dining, transportation, properties, inventory_strategies, target_customers, competitors | ✅ |
| SS2: Cát Bà Analysis (4 tabs) | Phương tiện, Điểm du lịch, Quán ăn/café, Lịch trình | transportation, attractions, dining, itineraries | ✅ |
| SS3: Customer Research (2 tabs) | KH mục tiêu, Hành trình KH | target_customers, customer_journeys | ✅ |
| SS4: Product Standards (1 tab) | Bộ tiêu chuẩn sản phẩm (26 criteria) | evaluation_criteria, property_evaluations | ✅ |
| SS5: Phú Quý Pricing (4 tabs) | Giá 3N2D, Giá 2N1D, Combo Lẻ, Mô tả homestay | room_pricing (3 combo_types), pricing_configs, properties | ✅ |

### v1 → v2 Changes (from deep sheet review)
1. **+5 new tables**: target_customers, attractions, dining_spots, transportation, inventory_strategies
2. **room_pricing redesigned**: `combo_type` field → supports 3N2D, 2N1D, per_night
3. **pricing_configs**: Added `combo_formula` rule_type for Combo Lẻ markup table
4. **customer_journeys**: Added `phase_name` + `extended_details` for multi-phase journeys
5. **market_properties**: Added `has_invoice` field (from sheet data)
6. **ai_data_settings**: Expanded from 7 → 12 categories

### 8 AI Use Cases: ALL COVERED ✅

## Dependencies
- Existing: Gemini AI, Chat UI, Auth, PostgreSQL + Drizzle ORM
- No new external services needed

## Linked Files
- [Client Requirements Analysis](research/client-requirements-analysis.md)
- [Review: Plan vs Actual Data](../reports/review-260316-1039-plan-vs-actual-data.md)
- [Phase 1: Database Schema v2](phase-01-database-schema.md)
- [Phase 2: API Backend](phase-02-api-backend.md)
- [Phase 3: Admin UI](phase-03-admin-ui.md)
- [Phase 4: AI Enhancement](phase-04-ai-enhancement.md)
- [Phase 5: Data Import](phase-05-data-import.md)
