# Phase 1: Database Schema - Kiến Trúc Dữ Liệu Thị Trường

## Priority: HIGH | Status: ✅ COMPLETE
## Revision: v2.2 — Final after optimization review + 4 fixes

## Overview
Schema tối ưu cho quản lý dữ liệu thị trường du lịch. 17 tables, chuẩn hóa, hỗ trợ AI query, admin toggle visibility.

## Nguyên tắc thiết kế
- Normalized schema, tránh duplicate data
- `ai_visible` boolean mỗi record → admin toggle
- JSONB cho flexible fields (amenities, images, metadata)
- Soft references giữa market data và existing tables (hotels, bookings)
- Indexes trên foreign keys + status + ai_visible

---

## Schema Chi Tiết

### 1. `markets` - Thị trường / Điểm đến
```sql
id              uuid PK
name            varchar(255) NOT NULL        -- "Cát Bà", "Phú Quý"
slug            varchar(255) UNIQUE NOT NULL
description     text                          -- mô tả tổng quan
region          varchar(100)                  -- "Bắc", "Trung", "Nam"
geography       text                          -- diện tích, đặc điểm địa lý
season_info     text                          -- mùa du lịch, mùa cao/thấp điểm
weather_info    text                          -- thời tiết
highlights      text                          -- điểm nổi bật: biển đẹp, lặn san hô...
travel_tips     text                          -- tips: thuê võng cảng, etc.
local_specialties jsonb                       -- ["bánh tráng mắm ruốc", "tôm hùm", ...]
accommodation_overview text                   -- tổng quan lưu trú: 180-200 cơ sở, phân bố, phân khúc giá
visitor_stats   jsonb                         -- {annual: "150k-160k", daily_capacity: "2000-2500"}
images          jsonb                         -- [url strings]
status          varchar(20) DEFAULT 'active'  -- active/inactive
ai_visible      boolean DEFAULT true
created_at      timestamp
updated_at      timestamp
```

### 2. `market_competitors` - Đối thủ cạnh tranh theo thị trường
```sql
id                  uuid PK
market_id           uuid FK → markets ON DELETE CASCADE
group_name          varchar(255) NOT NULL     -- "Homestay tự MKT"
description         text
examples            text                      -- "nalani, sero, rì rào"
main_channels       text                      -- kênh kiếm khách
implementation      text                      -- hình thức triển khai
effectiveness       varchar(50)               -- Cao/Trung bình/Thấp
strengths           text
weaknesses          text
competition_density text
sort_order          integer DEFAULT 0
ai_visible          boolean DEFAULT true
created_at          timestamp
updated_at          timestamp
```

### 3. `market_customer_journeys` - Hành trình khách hàng
```sql
id                    uuid PK
market_id             uuid FK → markets ON DELETE CASCADE
phase_name            varchar(100)              -- "Trước chuyến đi", "Di chuyển", "Tại điểm đến"
stage_order           integer NOT NULL           -- 1,2,3...
stage_name            varchar(255) NOT NULL      -- "Tìm hiểu Phú Quý", "Đặt dịch vụ"
customer_actions      text
touchpoints           text
painpoints            text
customer_info_needs   text                       -- điều KH muốn biết
business_touchpoints  text                       -- điểm chạm DN
extended_details      text                       -- chi tiết mở rộng (sub-actions, notes)
ai_visible            boolean DEFAULT true
created_at            timestamp
updated_at            timestamp
```

### 4. `market_target_customers` - Phân khúc khách hàng mục tiêu ⭐ NEW
```sql
id                  uuid PK
market_id           uuid FK → markets ON DELETE CASCADE
segment_name        varchar(100) NOT NULL      -- "Cặp đôi", "Nhóm bạn", "Gia đình"
age_range           varchar(50)                -- "22-30"
gender              varchar(50)                -- "Nam & Nữ"
occupation          text                       -- "Nhân viên VP, freelancer"
income_range        varchar(100)               -- "10-20 triệu/tháng"
location            text                       -- "TP lớn, HCM"
travel_motivation   text                       -- lý do đi du lịch
booking_habits      text                       -- thói quen đặt phòng
stay_duration       varchar(100)               -- "2N1Đ, 3N2Đ"
travel_frequency    varchar(100)               -- "3-4 lần/năm"
primary_channels    text                       -- "TikTok, Instagram, Facebook"
content_interests   text                       -- nội dung quan tâm
pain_points         text                       -- nỗi lo
preferences         text                       -- điều ưa thích
trust_factors       text                       -- yếu tố tin tưởng
decision_factors    text                       -- ai quyết định, tiêu chí chọn
sort_order          integer DEFAULT 0
ai_visible          boolean DEFAULT true
created_at          timestamp
updated_at          timestamp
```

### 5. `market_attractions` - Điểm du lịch / Check-in ⭐ NEW
```sql
id                  uuid PK
market_id           uuid FK → markets ON DELETE CASCADE
name                varchar(255) NOT NULL      -- "Bãi Cát Cò 1"
type                varchar(50)                -- beach/trail/bay/park/island/scenic_road
position            text                       -- vị trí, phân bố
nature_description  text                       -- loại hình tự nhiên
experience_value    text                       -- giá trị trải nghiệm
popularity          varchar(50)                -- Rất cao/Cao/Trung bình/Thấp
best_time           text                       -- thời điểm lý tưởng
cost_info           text                       -- chi phí
suitable_for        text                       -- phù hợp với ai
connectivity        text                       -- khả năng kết nối với điểm khác
risks               text                       -- rủi ro, lưu ý
images              jsonb
sort_order          integer DEFAULT 0
ai_visible          boolean DEFAULT true
created_at          timestamp
updated_at          timestamp
```

### 6. `market_dining_spots` - Quán ăn / Café ⭐ NEW
```sql
id                  uuid PK
market_id           uuid FK → markets ON DELETE CASCADE
name                varchar(255) NOT NULL      -- "Bánh xèo Quảng Ngãi"
category            varchar(50) NOT NULL       -- breakfast/lunch_casual/lunch_restaurant/dinner/snacks/cafe/bar_pub/local_restaurant
address             text                       -- "50 Núi Ngọc"
price_range         varchar(100)               -- "~50k", "290k-560k/set"
price_level         varchar(20)                -- budget/mid/premium
notable_features    text                       -- đặc trưng nổi bật
cuisine_type        varchar(100)               -- hải sản, đặc sản, quốc tế
operating_hours     varchar(100)               -- "All day", "Lunch + Dinner", "Evening/Night"
contact_info        jsonb                      -- {phone, facebook}
images              jsonb
sort_order          integer DEFAULT 0
ai_visible          boolean DEFAULT true
created_at          timestamp
updated_at          timestamp
```

### 7. `market_transportation` - Phương tiện di chuyển ⭐ NEW
```sql
id                    uuid PK
market_id             uuid FK → markets ON DELETE CASCADE
route_segment         varchar(255) NOT NULL    -- "Hà Nội → Hải Phòng"
transport_type        varchar(50) NOT NULL     -- bus/limousine/taxi/train/ferry/cable_car/shuttle/motorbike
departure_points      text                     -- điểm đi
arrival_points        text                     -- điểm đến
duration              varchar(100)             -- "2-2.5 giờ"
cost_info             text                     -- "120,000-180,000₫/người"
convenience_notes     text                     -- tiện lợi, an toàn
package_integration   text                     -- khả năng tích hợp combo
suitable_for          text                     -- phù hợp đối tượng nào
notes                 text
sort_order            integer DEFAULT 0
ai_visible            boolean DEFAULT true
created_at            timestamp
updated_at            timestamp
```

### 8. `market_inventory_strategies` - Chiến lược ôm quỹ phòng ⭐ NEW
```sql
id                  uuid PK
market_id           uuid FK → markets ON DELETE CASCADE
month_range         varchar(50) NOT NULL       -- "Tháng 1-2", "Tháng 9-12"
season_name         varchar(100)               -- "Mùa du lịch", "Mùa gió bấc"
demand_level        varchar(50)                -- Cao/Trung bình/Thấp
price_variation     text                       -- "Giảm 50% so với cao điểm"
holding_type        varchar(20)                -- none/hard/soft
target_segment      text                       -- "Homestay view đẹp-decor"
applicable_periods  text                       -- "Tết âm, Lễ 30/4, cuối tuần T.5-7"
notes               text                       -- "Phải đảm bảo ôm đủ vé tàu"
sort_order          integer DEFAULT 0
ai_visible          boolean DEFAULT true
created_at          timestamp
updated_at          timestamp
```

### 9. `evaluation_criteria` - Bộ tiêu chí đánh giá (template per market)
```sql
id              uuid PK
market_id       uuid FK → markets ON DELETE SET NULL (nullable = global template)
category        varchar(100) NOT NULL         -- "Vị trí", "Cơ sở vật chất"
subcategory     varchar(100)                  -- "Phòng ngủ", "Nhà vệ sinh"
criteria_name   varchar(255) NOT NULL         -- "Diện tích phòng"
sort_order      integer DEFAULT 0
created_at      timestamp
updated_at      timestamp
```

### 10. `market_properties` - Cơ sở lưu trú theo thị trường
```sql
id              uuid PK
market_id       uuid FK → markets ON DELETE CASCADE
name            varchar(255) NOT NULL         -- "Serõ"
slug            varchar(255) NOT NULL
type            varchar(50) DEFAULT 'homestay' -- homestay/hotel/villa/resort
star_rating     decimal(2,1)
address         text
location_detail text                          -- vị trí so với trung tâm
description     text                          -- mô tả chi tiết (từ tab "Mô tả")
amenities       jsonb                         -- ["bể bơi", "café"]
images          jsonb
contact_info    jsonb                         -- {phone, email, facebook, zalo}
invoice_status  varchar(50) DEFAULT 'none'     -- none/invoice/vat_invoice/business_registration/in_progress
notes           text                          -- ghi chú nội bộ
status          varchar(20) DEFAULT 'active'
ai_visible      boolean DEFAULT true
created_at      timestamp
updated_at      timestamp

UNIQUE(market_id, slug)
```

### 11. `property_evaluations` - Đánh giá cơ sở lưu trú
```sql
id              uuid PK
property_id     uuid FK → market_properties ON DELETE CASCADE
criteria_id     uuid FK → evaluation_criteria
value           text                          -- giá trị đánh giá
notes           text
ai_visible      boolean DEFAULT true
created_at      timestamp
updated_at      timestamp

UNIQUE(property_id, criteria_id)
```

### 12. `property_rooms` - Loại phòng
```sql
id              uuid PK
property_id     uuid FK → market_properties ON DELETE CASCADE
room_type       varchar(255) NOT NULL         -- "Phòng Đôi View Biển"
booking_code    varchar(50)                   -- mã đặt phòng: SR01, LBH01
capacity        integer DEFAULT 2
description     text                          -- specs: giường, diện tích, view, tầng
amenities       jsonb
images          jsonb
sort_order      integer DEFAULT 0
ai_visible      boolean DEFAULT true
created_at      timestamp
updated_at      timestamp
```

### 13. `room_pricing` - Bảng giá chi tiết ⭐ REDESIGNED
```sql
id              uuid PK
room_id         uuid FK → property_rooms ON DELETE CASCADE
combo_type      varchar(20) NOT NULL          -- '3n2d' / '2n1d' / 'per_night'
day_type        varchar(20) NOT NULL          -- weekday/friday/saturday/sunday/holiday
season_name     varchar(100) DEFAULT 'default'
season_start    date
season_end      date
standard_guests integer NOT NULL              -- số người tiêu chuẩn
price           integer NOT NULL              -- giá combo/đêm (VND)
price_plus1     integer                       -- giá khi +1 người (total)
price_minus1    integer                       -- giá khi -1 người (total)
extra_night     integer                       -- giá thêm 1 đêm (chỉ cho combo)
notes           text
ai_visible      boolean DEFAULT true
created_at      timestamp
updated_at      timestamp
```
**combo_type values:**
- `3n2d` → Combo 3 ngày 2 đêm (Sheet "Giá combo 3n2d")
- `2n1d` → Combo 2 ngày 1 đêm (Sheet "Giá combo 2n1d")
- `per_night` → Giá lẻ theo đêm (Sheet "Combo Lẻ")

### 14. `pricing_configs` - Quy tắc giá linh hoạt (admin config)
```sql
id              uuid PK
market_id       uuid FK → markets ON DELETE CASCADE (nullable)
property_id     uuid FK → market_properties ON DELETE CASCADE (nullable)
rule_name       varchar(255) NOT NULL         -- "Chính sách trẻ em"
-- CHECK (market_id IS NOT NULL OR property_id IS NOT NULL)
rule_type       varchar(50) NOT NULL          -- child_policy/extra_guest_policy/surcharge/discount/combo_formula/profit_margin/transport_pricing
config          jsonb NOT NULL                -- flexible config
description     text
is_active       boolean DEFAULT true
ai_visible      boolean DEFAULT true
sort_order      integer DEFAULT 0
created_at      timestamp
updated_at      timestamp
```
**config JSONB examples:**
```json
// child_policy — chính sách giá trẻ em
{"age_ranges": [{"min": 0, "max": 5, "charge": 0, "label": "Miễn phí"}, {"min": 5, "max": 10, "charge": 100000}, {"min": 10, "max": 16, "charge": 200000}]}

// extra_guest_policy — phụ thu thêm người trong phòng (per hotel)
{"adult_surcharge": 200000, "child_under_10": 100000, "child_under_5": 0, "substandard_price_note": "Giá khi ít người hơn tiêu chuẩn"}

// surcharge — phụ thu đổi tuyến
{"from": "Hạ Long", "to": "Sa Pa", "amount": 500000, "per": "person"}

// discount — khuyến mãi
{"type": "early_bird", "days_before": 14, "discount_percent": 10}

// profit_margin — % lợi nhuận cho tính combo
// Công thức: (Tổng dịch vụ × margin%) ÷ số người
{"margin_percent": 10, "formula": "(sum_services * (1 + margin/100)) / num_guests"}

// transport_pricing — giá xe/tàu cho tính combo
{"operator": "Nhà xe Hải giang", "route": "Hà Nội ↔ Tà Xùa", "options": [
  {"type": "single_cabin", "capacity": 1, "one_way": 400000, "round_trip": 800000},
  {"type": "double_cabin", "capacity": 2, "one_way": 300000, "round_trip": 600000}
], "surcharges": [{"route": "Hạ Long → Tà Xùa", "amount": 200000, "per": "person"}]}

// combo_formula — bảng tra giá markup (from "Combo Lẻ" sheet)
{"base_prices": [{"entry": 300000, "combo_2n1d": 1100000, "combo_3n2d": 1175000, "per_night": 400000}, ...]}
```

**Hai mô hình tính giá:**
1. **Pre-calculated** (SS5): Admin nhập sẵn giá combo per room → `room_pricing` table
2. **Formula-based** (Sheet "Ví dụ cách tính giá"): System tính = `(Σ services × margin%) ÷ guests` → dùng `profit_margin` + `transport_pricing` + `room_pricing` (per_night)

**Combo calculation flow** (from Sheet 2 - UI/API logic):
1. Nhập số người (guests count)
2. Chọn loại phòng + số lượng (validate: total guests ≤ room capacity)
3. Tính: `(room_prices + transport + surcharges) × (1 + margin%) ÷ guests`
4. Áp dụng child_policy nếu có trẻ em

### 15. `itinerary_templates` - Lịch trình mẫu
```sql
id              uuid PK
market_id       uuid FK → markets ON DELETE CASCADE
title           varchar(255) NOT NULL         -- "Cát Bà 3 ngày 2 đêm"
duration_days   integer NOT NULL
duration_nights integer NOT NULL
theme           varchar(50)                   -- honeymoon/family/budget/adventure/general
description     text
highlights      jsonb                         -- ["Vịnh Lan Hạ", "Bãi Cát Cò"]
status          varchar(20) DEFAULT 'active'
ai_visible      boolean DEFAULT true
sort_order      integer DEFAULT 0
created_at      timestamp
updated_at      timestamp
```

### 16. `itinerary_template_items` - Chi tiết lịch trình
```sql
id              uuid PK
template_id     uuid FK → itinerary_templates ON DELETE CASCADE
day_number      integer NOT NULL              -- 1, 2, 3
time_of_day     varchar(20) NOT NULL          -- morning/afternoon/evening
time_start      varchar(10)                   -- "05:30"
time_end        varchar(10)                   -- "08:30"
activity        text NOT NULL                 -- "Di chuyển ga HN → ga HP"
location        varchar(255)
notes           text
sort_order      integer DEFAULT 0
created_at      timestamp
updated_at      timestamp
```

### 17. `ai_data_settings` - Cấu hình AI access toàn cục
```sql
id              uuid PK
data_category   varchar(50) UNIQUE NOT NULL
is_enabled      boolean DEFAULT true
description     text                          -- mô tả cho admin
updated_by      uuid FK → users
updated_at      timestamp
```
**data_category values:**
market, property, pricing, itinerary, competitor, journey, target_customer, attraction, dining, transportation, inventory_strategy, evaluation

---

## Entity Relationship Diagram

```
markets (1)──(N) market_competitors
   │────────(N) market_customer_journeys
   │────────(N) market_target_customers        ⭐ NEW
   │────────(N) market_attractions              ⭐ NEW
   │────────(N) market_dining_spots             ⭐ NEW
   │────────(N) market_transportation           ⭐ NEW
   │────────(N) market_inventory_strategies     ⭐ NEW
   │────────(N) evaluation_criteria
   │────────(N) itinerary_templates ──(N) itinerary_template_items
   │────────(N) pricing_configs (market-level)
   └────────(N) market_properties (1)──(N) property_rooms ──(N) room_pricing
                    │────────────(N) property_evaluations ──(1) evaluation_criteria
                    └────────────(N) pricing_configs (property-level)

ai_data_settings (standalone, global toggle per category)
```

---

## Indexes
- markets: slug (unique)
- market_properties: (market_id, slug) unique, market_id, status, ai_visible
- property_rooms: property_id
- room_pricing: room_id, (room_id, combo_type, day_type, season_name)
- property_evaluations: (property_id, criteria_id) unique
- evaluation_criteria: market_id
- itinerary_templates: market_id
- pricing_configs: market_id, property_id
- market_competitors: market_id
- market_customer_journeys: market_id
- market_target_customers: market_id
- market_attractions: market_id
- market_dining_spots: market_id, category
- market_transportation: market_id
- market_inventory_strategies: market_id

---

## Data Sources Mapping (20 tabs from 6 spreadsheets → 17 tables)

| Spreadsheet | Tab | → Table(s) |
|---|---|---|
| SS1: Phú Quý Market | Tổng quan điểm du lịch | → markets (description, geography, highlights) |
| SS1 | Điểm check in + quán ăn | → market_attractions + market_dining_spots |
| SS1 | Phương tiện đi lại | → market_transportation |
| SS1 | Khách sạn, Homestay | → market_properties |
| SS1 | Định hướng quỹ ôm | → market_inventory_strategies |
| SS1 | Khách hàng mục tiêu | → market_target_customers |
| SS1 | Đối thủ cạnh tranh | → market_competitors |
| SS2: Cát Bà Analysis | Phương tiện đi lại | → market_transportation |
| SS2 | Điểm du lịch, checkin | → market_attractions |
| SS2 | Quán cafe, quán ăn | → market_dining_spots |
| SS2 | Lịch trình gợi ý | → itinerary_templates + items |
| SS3: Customer Research | Khách hàng mục tiêu | → market_target_customers |
| SS3 | Hành trình khách hàng | → market_customer_journeys |
| SS4: Product Standards | Bộ tiêu chuẩn sản phẩm | → evaluation_criteria + property_evaluations |
| SS5: Phú Quý Pricing | Giá combo 3n2d | → room_pricing (combo_type='3n2d') |
| SS5 | Giá combo 2n1d | → room_pricing (combo_type='2n1d') |
| SS5 | Combo Lẻ | → pricing_configs (rule_type='combo_formula') |
| SS5 | Mô tả homestay/KS | → market_properties (description field) |
| SS6: Pricing Rules | Ví dụ cách tính giá (Tab1) | → pricing_configs (profit_margin, extra_guest_policy, transport_pricing) |
| SS6 | UI Flow (Tab2) | → API logic (combo calculator endpoint) |

---

## Migration Strategy
- New tables only, no changes to existing tables (hotels, bookings, etc.)
- Existing KB sync continues to work alongside new structured data
- Gemini service enhanced to use structured data

## Implementation Steps
- [x] Create Drizzle schema files for all 17 tables
- [x] Generate and run migration
- [x] Add seed data from Google Sheets samples (18 tabs)
- [x] Verify relations and indexes

## Success Criteria
- [x] All 17 tables created with proper relations and constraints
- [x] All 20 tabs (6 spreadsheets) data importable into corresponding tables
- [x] No conflicts with existing schema
- [x] Admin can CRUD all data types without Google Sheets
