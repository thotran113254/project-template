# Phase 5: Data Import - Migration từ Google Sheets

## Priority: MEDIUM | Status: ✅ COMPLETE

## Overview
Import dữ liệu mẫu từ 5 Google Sheets vào hệ thống mới. Sau đó admin quản lý hoàn toàn trên phần mềm.

---

## Import Strategy

### One-time seed script (không cần sync liên tục)
Mục tiêu: import data mẫu → admin quản lý trực tiếp trên UI sau đó.

```
apps/api/src/db/seed/
├── seed-market-data.ts    # Main seed script
├── data/
│   ├── competitors.json   # Từ Sheet 1
│   ├── itineraries.json   # Từ Sheet 2
│   ├── customer-journey.json # Từ Sheet 3
│   ├── evaluation-criteria.json # Từ Sheet 4
│   └── properties-pricing.json  # Từ Sheet 5
```

---

## Data Mapping: Sheet → DB

### Sheet 1 (Competitors) → market_competitors
| Sheet Column | DB Field |
|---|---|
| STT | sort_order |
| Nhóm đối thủ | group_name |
| Mô tả ngắn | description |
| Ví dụ đơn vị | examples |
| Kênh kiếm khách chính | main_channels |
| Hình thức triển khai | implementation |
| Mức độ hiệu quả | effectiveness |
| Điểm mạnh – điểm yếu | strengths / weaknesses (split) |
| Mật độ cạnh tranh | competition_density |

### Sheet 2 (Itineraries) → itinerary_templates + items
| Sheet Structure | DB Mapping |
|---|---|
| Title row "LỊCH TRÌNH CÁT BÀ 2N1Đ" | itinerary_templates.title, duration_days, duration_nights |
| SÁNG/CHIỀU/TỐI | itinerary_template_items.time_of_day |
| "5h30: activity" | time_start + activity (parse) |
| Ngày 1/2/3 columns | day_number |

### Sheet 3 (Customer Journey) → market_customer_journeys
| Sheet Column | DB Field |
|---|---|
| STT | stage_order |
| Giai đoạn | stage_name |
| Hành động của khách hàng | customer_actions |
| Touchpoint | touchpoints |
| Painpoint | painpoints |
| Điều khách hàng muốn biết | customer_info_needs |
| Điểm chạm của DN | business_touchpoints |

### Sheet 4 (Evaluation) → evaluation_criteria
| Sheet Structure | DB Mapping |
|---|---|
| Hạng mục column | category |
| (subcategory) column | subcategory |
| Tiêu chí chi tiết | criteria_name |
| Row order | sort_order |

### Sheet 5 (Pricing) → market_properties + property_rooms + room_pricing
| Sheet Column | DB Mapping |
|---|---|
| Tên home | market_properties.name |
| Hạng phòng | property_rooms.room_type |
| Mã đặt phòng | property_rooms.booking_code |
| Ngày | room_pricing.day_type (parse T2-T5→weekday, T6→friday, T7→saturday, CN→sunday) |
| Số người tiêu chuẩn | room_pricing.standard_guests |
| Combo 3n2d | room_pricing.combo_3n2d |
| +1 người | room_pricing.extra_guest_price |
| -1 người | room_pricing.fewer_guest_price |
| Thêm 1 đêm | room_pricing.extra_night |

---

## Default Seed Data

### Default Market
```json
{
  "name": "Phú Quý",
  "slug": "phu-quy",
  "region": "Nam",
  "description": "Đảo Phú Quý, Bình Thuận",
  "status": "active",
  "ai_visible": true
}
```

### Default AI Data Settings
```json
[
  {"data_category": "market", "is_enabled": true},
  {"data_category": "property", "is_enabled": true},
  {"data_category": "pricing", "is_enabled": true},
  {"data_category": "itinerary", "is_enabled": true},
  {"data_category": "competitor", "is_enabled": true},
  {"data_category": "journey", "is_enabled": true},
  {"data_category": "evaluation", "is_enabled": true}
]
```

### Default Pricing Configs
```json
[
  {
    "rule_name": "Chính sách trẻ em",
    "rule_type": "child_policy",
    "config": {
      "age_ranges": [
        {"min": 0, "max": 5, "charge": 0, "label": "Miễn phí"},
        {"min": 5, "max": 10, "charge": 100000, "label": "+100,000₫"},
        {"min": 10, "max": 16, "charge": 200000, "label": "+200,000₫"}
      ]
    }
  },
  {
    "rule_name": "Phụ thu đổi tuyến Hạ Long → Sa Pa",
    "rule_type": "surcharge",
    "config": {
      "from": "Hạ Long",
      "to": "Sa Pa",
      "amount": 500000,
      "per": "person"
    }
  }
]
```

---

## Implementation Steps
- [x] Create JSON data files from sheet data
- [x] Write seed-market-data.ts script
- [x] Parse and transform sheet formats → DB records
- [x] Run seed script, verify data integrity
- [x] Add seed command to package.json: `pnpm db:seed-market`
- [x] Remove/deprecate old Google Sheets sync (optional, keep as fallback)

## Success Criteria
- [x] All 5 sheets data imported correctly
- [x] Data queryable via API
- [x] AI context builder produces accurate output from seeded data
- [x] Admin can view and edit imported data via UI
