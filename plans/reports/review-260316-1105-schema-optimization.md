# Review: Schema Optimization Check (v2.1 → v2.2)

## Phương pháp
Đọc toàn bộ 17 tables, cross-check từng field với dữ liệu thực tế 18 tabs, kiểm tra normalization, indexes, và data type accuracy.

---

## A. Bugs/Fixes Cần Thiết

### Fix 1: `market_properties.has_invoice` boolean → varchar ❌
**Problem**: Dữ liệu thực tế có 5 trạng thái, không phải true/false:
- Serõ: "Invoice available"
- JIMMY'C House: "Business registration"
- Island Sunset Hotel: "VAT Invoice"
- Fog xóm trâu: "No invoice"
- Moon villa: "Invoice in progress"

**Fix**: `has_invoice boolean` → `invoice_status varchar(50) DEFAULT 'none'`
Values: `none` | `invoice` | `vat_invoice` | `business_registration` | `in_progress`

### Fix 2: `evaluation_criteria.market_id` FK constraint
**Problem**: `market_id` nullable (global template) nhưng chưa specify ON DELETE behavior.
**Fix**: `ON DELETE SET NULL` (khi xóa market, criteria trở thành global)

### Fix 3: `pricing_configs` cần CHECK constraint
**Problem**: Cả `market_id` và `property_id` đều nullable. Cần ít nhất 1 phải có giá trị.
**Fix**: `CHECK (market_id IS NOT NULL OR property_id IS NOT NULL)`

### Fix 4: `market_dining_spots.category` thiếu values
**Problem**: Phú Quý data có thêm: cafe, bar_pub, restaurant_upscale, local_restaurant
**Fix**: Mở rộng category values: `breakfast | lunch_casual | lunch_restaurant | dinner | snacks | cafe | bar_pub | local_restaurant`

---

## B. Data Completeness Check (18/18 tabs)

| Tab | Table | Fields Match? | Data Fit? |
|---|---|---|---|
| SS1-T1: Tổng quan PQ | markets | ✅ 7/7 fields | geography, season, highlights, tips, stats all covered |
| SS1-T2: Check-in PQ (14 spots) | market_attractions | ✅ | entry_fee→cost_info, distance→position |
| SS1-T2: Cafes PQ (5) | market_dining_spots | ✅ | design_style→notable_features, beverages→cuisine_type |
| SS1-T2: Restaurants PQ (7) | market_dining_spots | ✅ | price/2ppl→price_range |
| SS1-T2: Đặc sản (7 món) | markets.local_specialties | ✅ | JSONB array |
| SS1-T3: Phương tiện PQ (4 routes) | market_transportation | ✅ | operators→notes |
| SS1-T4: KS/Homestay overview | markets.accommodation_overview + visitor_stats | ✅ | 3 areas, 3 segments |
| SS1-T5: Quỹ ôm (5 periods) | market_inventory_strategies | ✅ | 3 holding types |
| SS1-T6: KH mục tiêu PQ (3 segments) | market_target_customers | ✅ | 16 fields cover all |
| SS1-T7: Đối thủ (4 groups) | market_competitors | ✅ | 8 columns all mapped |
| SS2-T1: Phương tiện CB (9 options) | market_transportation | ✅ | route segments + details |
| SS2-T2: Điểm du lịch CB (9 spots) | market_attractions | ✅ | 11 info fields all mapped |
| SS2-T3: Quán ăn CB (20+ quán) | market_dining_spots | ✅ | 5 categories |
| SS2-T4: Lịch trình CB (3) | itinerary_templates + items | ✅ | hour-by-hour detail |
| SS3-T1: KH mục tiêu (3 segments) | market_target_customers | ✅ | market_id nullable for general |
| SS3-T2: Hành trình KH (6 stages) | market_customer_journeys | ✅ | phase_name for grouping |
| SS4-T1: Tiêu chuẩn (26 criteria) | evaluation_criteria + property_evaluations | ✅ | category/sub/name |
| SS5-T1: Giá 3N2D (59+ rooms) | room_pricing combo_type='3n2d' | ✅ | 4 day types × prices |
| SS5-T2: Giá 2N1D (59+ rooms) | room_pricing combo_type='2n1d' | ✅ | same structure |
| SS5-T3: Combo Lẻ (30 rows) | pricing_configs combo_formula | ✅ | JSONB lookup |
| SS5-T4: Mô tả (13 properties) | market_properties + property_rooms | ✅ | specs in description |

**Result: 18/18 tabs → ALL fields mapped** ✅

---

## C. Normalization Check

| Level | Status | Notes |
|---|---|---|
| 1NF (atomic values) | ✅ | JSONB used only for truly multi-value fields (arrays, flexible config) |
| 2NF (full FK dependency) | ✅ | All non-key attributes depend on full PK |
| 3NF (no transitive deps) | ✅ | No field depends on another non-key field |
| Appropriate denormalization | ✅ | Text fields for free-form data (admin-editable, AI-readable) |

---

## D. Optimization Assessment

### What's Good ✅
- **17 tables, clean separation** - 1 table per data domain, no mixed concerns
- **JSONB where appropriate** - amenities, images, events, config (flexible, searchable)
- **Text where appropriate** - admin free-form fields (description, notes, tips)
- **`ai_visible` per record** - granular AI control without extra join tables
- **`ai_data_settings` per category** - global toggle, simple UX
- **Composite indexes** - room_pricing (room_id, combo_type, day_type) for fast lookups
- **CASCADE deletes** - clean up child records automatically
- **`combo_type` field** - handles multiple pricing formats without schema changes

### Potential Over-engineering Concerns (rejected, KISS wins)
| Concern | Decision | Reason |
|---|---|---|
| Room specs (m², beds, tub) as separate columns? | NO, keep in description text | 3 extra columns × 59 rooms, AI reads text fine |
| Separate `local_specialty` table? | NO, keep as JSONB array on markets | Simple list, no relations needed |
| Multi-market itineraries via junction table? | NO, use description text | Rare case, KISS |
| Separate `transport_operator` table? | NO, keep in notes | Few operators, no need for normalization |

### Can We Reduce Tables?
| Candidates | Verdict |
|---|---|
| Merge market_attractions + market_dining_spots? | NO - different field structures |
| Merge market_target_customers into market_customer_journeys? | NO - different purposes (WHO vs HOW) |
| Merge pricing_configs into room_pricing? | NO - configs are rules, pricing is data |
| Remove market_inventory_strategies, put in markets? | POSSIBLE but loses per-period detail |

**Verdict: 17 tables is the right number.** Each table has distinct purpose, distinct fields, and distinct admin UX needs.

---

## E. Summary of Changes v2.1 → v2.2

| # | Change | Impact |
|---|---|---|
| 1 | `has_invoice` → `invoice_status varchar(50)` | Supports 5 real-world status values |
| 2 | `evaluation_criteria.market_id` ON DELETE SET NULL | Global criteria survive market deletion |
| 3 | `pricing_configs` CHECK constraint | Prevents orphan rules |
| 4 | `market_dining_spots.category` expanded | +3 category values from Phú Quý data |

## Final Verdict
- **Data completeness**: 18/18 tabs ✅ (100%)
- **Schema optimization**: Well-normalized, no redundancy, appropriate JSONB/text usage ✅
- **4 minor fixes** needed (field type, constraint, FK behavior, enum values)
- **17 tables is optimal** - no merge/split needed
