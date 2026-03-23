# Review v3: Plan vs Dữ Liệu Thực Tế Khách Hàng (18 Tabs - FULL DATA)

## Mục đích
Cross-check schema v2.1 (17 tables) với toàn bộ 18 tabs từ 5 Google Spreadsheets. **TẤT CẢ tabs đã được fetch và đọc đầy đủ dữ liệu thực tế.**

---

## Tổng Quan Dữ Liệu Thực Tế

| # | Spreadsheet | Tabs | Chủ đề |
|---|---|---|---|
| SS1 | Phú Quý Market Analysis | 7 | Tổng quan, check-in+ăn uống, phương tiện, KS, quỹ ôm, KH mục tiêu, đối thủ |
| SS2 | Cát Bà Tourism Analysis | 4 | Phương tiện, điểm du lịch, quán ăn/café, lịch trình |
| SS3 | Customer Research | 2 | KH mục tiêu, hành trình KH |
| SS4 | Product Standards | 1 | Bộ tiêu chuẩn sản phẩm (26 criteria) |
| SS5 | Phú Quý Pricing | 4 | Giá 3N2D, giá 2N1D, combo lẻ, mô tả homestay |

---

## Chi Tiết Cross-check Từng Tab

### SS1-Tab1: Tổng quan điểm du lịch Phú Quý → `markets`

| Data Point | DB Field | ✅ |
|---|---|---|
| Vị trí (Bình Thuận, khoảng cách) | description, geography | ✅ |
| Cách đến (3 routes: bay → phà) | → market_transportation | ✅ |
| Điểm nổi bật (biển đẹp, lặn san hô) | highlights | ✅ |
| Mùa tốt nhất (T2-T9) | season_info | ✅ |
| Đặc điểm lưu trú (phân bố quanh đảo) | description | ✅ |
| Địa lý (~16km²) | geography | ✅ |
| Tips (thuê võng cảng) | travel_tips | ✅ |

### SS1-Tab2: Điểm check in + quán ăn Phú Quý → `market_attractions` + `market_dining_spots`
Cùng format với SS2-Tab2 + SS2-Tab3 → ✅ Confirmed same structure

### SS1-Tab3: Phương tiện Phú Quý → `market_transportation`
Cùng format với SS2-Tab1 → ✅ Confirmed same structure

### SS1-Tab4: Khách sạn, Homestay → `market_properties`

| Data Point | DB Field | ✅ |
|---|---|---|
| Tên property | name | ✅ |
| Loại (homestay/hotel) | type | ✅ |
| Mô tả | description | ✅ |
| Tiện ích | amenities | ✅ |

### SS1-Tab5: Định hướng quỹ ôm → `market_inventory_strategies`

| Data Point | DB Field | ✅ |
|---|---|---|
| Tháng + đặc điểm thị trường | month_range, season_name | ✅ |
| Mức độ nhu cầu (Cao/TB/Thấp) | demand_level | ✅ |
| Biến động giá ("Giảm 50%") | price_variation | ✅ |
| Hình thức ôm (Không/Cứng/Mềm) | holding_type (none/hard/soft) | ✅ |
| Thời điểm ôm (Tết, lễ 30/4) | applicable_periods | ✅ |
| Phân khúc target ("view đẹp-decor") | target_segment | ✅ |
| Ghi chú ("đảm bảo ôm đủ vé tàu") | notes | ✅ |

### SS1-Tab6: Khách hàng mục tiêu Phú Quý → `market_target_customers`

| Data Point | DB Field | ✅ |
|---|---|---|
| Nhóm (Cặp đôi/Bạn bè/Gia đình) | segment_name | ✅ |
| Tuổi (22-30) | age_range | ✅ |
| Giới tính | gender | ✅ |
| Tình trạng hôn nhân | → trong description hoặc preferences | ⚠️ |
| Nghề nghiệp | occupation | ✅ |
| Thu nhập (10-20tr) | income_range | ✅ |
| Khu vực (TP HCM) | location | ✅ |
| Thái độ sống, giá trị | travel_motivation | ✅ |
| Mối quan tâm trước khi đặt | pain_points | ✅ |
| Điều yêu thích/không thích | preferences | ✅ |
| Yếu tố tin tưởng | trust_factors | ✅ |
| Kênh online | primary_channels | ✅ |
| Nội dung quan tâm | content_interests | ✅ |
| Tần suất đi | travel_frequency | ✅ |
| Thời gian lưu trú | stay_duration | ✅ |
| Ai quyết định | decision_factors | ✅ |
| Thói quen đặt phòng | booking_habits | ✅ |

**Note**: "Tình trạng hôn nhân" có thể lưu trong `preferences` text field. Không cần field riêng (KISS).

### SS1-Tab7: Đối thủ cạnh tranh → `market_competitors`
✅ Already reviewed - 100% match (8 columns all mapped)

### SS2-Tab1: Phương tiện Cát Bà → `market_transportation`

| Data Point | DB Field | ✅ |
|---|---|---|
| Route segment ("HN → HP") | route_segment | ✅ |
| Loại PT (bus/taxi/train/ferry/cable_car/shuttle/motorbike) | transport_type | ✅ |
| Điểm đi (phố cổ HN, ga HN) | departure_points | ✅ |
| Điểm đến (trung tâm HP, phà Đồng Văn) | arrival_points | ✅ |
| Thời gian ("2-2.5 giờ") | duration | ✅ |
| Chi phí ("120,000-180,000₫") | cost_info | ✅ |
| Tiện lợi/an toàn | convenience_notes | ✅ |
| Khả năng tích hợp combo | package_integration | ✅ |
| Phù hợp đối tượng | suitable_for | ✅ |

**Data volume**: 3 route segments × 6+ transport types = ~15 records per market

### SS2-Tab2: Điểm du lịch Cát Bà → `market_attractions`

| Data Point | DB Field | ✅ |
|---|---|---|
| Tên (Bãi Cát Cò 1) | name | ✅ |
| Loại (beach/trail/bay/park) | type | ✅ |
| Vị trí + phân bố | position | ✅ |
| Loại hình tự nhiên | nature_description | ✅ |
| Giá trị trải nghiệm | experience_value | ✅ |
| Mức độ nổi tiếng | popularity | ✅ |
| Thời điểm lý tưởng | best_time | ✅ |
| Chi phí | cost_info | ✅ |
| Phù hợp với ai | suitable_for | ✅ |
| Khả năng kết nối | connectivity | ✅ |
| Rủi ro/lưu ý | risks | ✅ |

**Data volume**: 9 attractions for Cát Bà, 11 info fields each → ALL mapped

### SS2-Tab3: Quán ăn/café Cát Bà → `market_dining_spots`

| Data Point | DB Field | ✅ |
|---|---|---|
| Loại hình (Ăn sáng/trưa BD/trưa NH/tối/vặt) | category | ✅ |
| Tên quán | name | ✅ |
| Địa chỉ | address | ✅ |
| Mức giá ("~50k", "290k-560k/set") | price_range | ✅ |
| Đặc trưng nổi bật | notable_features | ✅ |

**Data volume**: 20+ restaurants, 5 categories → ALL mapped

### SS2-Tab4: Lịch trình Cát Bà → `itinerary_templates` + `itinerary_template_items`
✅ Already reviewed - match confirmed

### SS3-Tab1: Khách hàng mục tiêu (General) → `market_target_customers`

| Data Point | DB Field | ✅ |
|---|---|---|
| 3 segments: Gen Z, Cặp đôi, Gia đình trẻ | segment_name | ✅ |
| Tuổi, nghề, thu nhập, khu vực | age_range, occupation, income_range, location | ✅ |
| Lý do đi, thói quen đặt | travel_motivation, booking_habits | ✅ |
| Thời gian ở (2N1Đ/3N2Đ) | stay_duration | ✅ |
| Kênh (TikTok, Instagram, FB Group) | primary_channels | ✅ |
| Pain points (budget, sợ đông, ảnh không giống thực tế) | pain_points | ✅ |

**Note**: SS1-Tab6 (Phú Quý) và SS3-Tab1 (General) có format khác nhau nhưng cùng map vào `market_target_customers`. market_id nullable cho general data.

### SS3-Tab2: Hành trình KH → `market_customer_journeys`

**Rất chi tiết** - multi-phase, sub-stages:
- Phase 1: Trước chuyến đi (3 stages: tìm hiểu, nghiên cứu DV, đặt DV)
- Phase 2: Di chuyển (5+ stages: HCM→Phan Thiết, cảng, phà, etc.)
- Phase 3: Tại điểm đến (3 stages: port→accommodation, trải nghiệm, khám phá)
- Phase 4: Sau chuyến đi (3 stages: về, kết thúc, review)

**Schema adequacy**: `phase_name` + `extended_details` fields handle this ✅
Each sub-stage stored as separate record with `phase_name` grouping.

### SS4-Tab1: Bộ tiêu chuẩn sản phẩm → `evaluation_criteria`
✅ Already reviewed - 26 criteria ALL mapped

### SS5-Tab1: Giá combo 3N2D → `room_pricing` (combo_type='3n2d')
✅ Already reviewed - 13 properties, 59+ rooms

### SS5-Tab2: Giá combo 2N1D → `room_pricing` (combo_type='2n1d')

| Data Point | DB Field | ✅ |
|---|---|---|
| Same 13 properties, same room types | room_id (FK) | ✅ |
| Cùng cấu trúc: day_type, standard, +1, -1 | same fields | ✅ |
| Giá thấp hơn 3N2D (1,425,000-4,500,000₫) | price | ✅ |

**Key**: Cùng `property_rooms` record, khác `combo_type` → room_pricing redesign handles this ✅

### SS5-Tab3: Combo Lẻ → `pricing_configs` (rule_type='combo_formula')

| Data Point | DB Mapping | ✅ |
|---|---|---|
| Bảng tra cứu: giá nhập → giá combo (2N1D/3N2D/lẻ) | config JSONB | ✅ |
| 30 mức giá từ 300k-3,000k | config.base_prices array | ✅ |
| 6 positions per combo type | config detail | ✅ |

**This is a FORMULA table**, not per-room pricing. Stored as pricing_config rule → admin can edit formula.

### SS5-Tab4: Mô tả homestay/khách sạn → `market_properties` (description)

| Data Point | DB Field | ✅ |
|---|---|---|
| Mô tả chi tiết từng property | description | ✅ |
| Room specs (giường, diện tích, view, tầng) | property_rooms.description | ✅ |

---

## Final Verdict v2

| Aspect | Status | Notes |
|---|---|---|
| SS1 (7 tabs) | ✅ ALL COVERED | 5 new tables added in v2 |
| SS2 (4 tabs) | ✅ ALL COVERED | attractions, dining, transportation added |
| SS3 (2 tabs) | ✅ ALL COVERED | target_customers + multi-phase journeys |
| SS4 (1 tab) | ✅ ALL COVERED | 26 criteria all storable |
| SS5 (4 tabs) | ✅ ALL COVERED | Multi-combo pricing + formula table |
| 8 AI Use Cases | ✅ ALL SUPPORTED | Enhanced with new data types |
| Admin replaces Sheets | ✅ COMPLETE | All 18 tabs data types manageable in UI |
| AI access control | ✅ GRANULAR | Per record (ai_visible) + per category (12 categories) |

### Schema Changes v1 → v2 → v2.1

| Change | Reason |
|---|---|
| +5 new tables | transportation, attractions, dining, target_customers, inventory_strategies |
| room_pricing: combo_type field | SS5 has 3 pricing tabs (3N2D, 2N1D, per_night) |
| pricing_configs: combo_formula | "Combo Lẻ" tab = formula/lookup table |
| customer_journeys: phase_name + extended_details | SS3 has 14+ sub-stages |
| market_properties: has_invoice | VAT/invoice status per property |
| markets: geography, highlights, travel_tips | SS1 tourism overview |
| ai_data_settings: 7→12 categories | 5 new data types |
| **v2.1** markets: local_specialties jsonb | SS1 lists 7 đặc sản Phú Quý |
| **v2.1** markets: accommodation_overview, visitor_stats | SS1 market stats (180-200 cơ sở, 150k visitors) |
| **v2.1** market_dining_spots: operating_hours | Café/restaurant hours from SS1 |

### Dữ Liệu Thực Tế Đã Fetch Đầy Đủ (v3)

**SS1 - Phú Quý Market (7 tabs):**
- ✅ Tab1 Tổng quan: geography 16km², mùa T2-T9, 3 routes bay+phà, tips
- ✅ Tab2 Check-in+Ăn uống: 14 điểm (cột cờ, gành hang, tour lặn...) + 5 cafes + 3 nhà hàng cao cấp + 1 bar + 3 quán local + 7 đặc sản
- ✅ Tab3 Phương tiện: 4 chặng (HN→sân bay, sân bay→Phan Thiết, PT→Phú Quý, nội đảo), operators: Superdong 680k, Trưng Trắc 740k
- ✅ Tab4 KS/Homestay: 180-200 cơ sở, 3 khu vực (Tam Thanh/Ngũ Phụng/Long Hải), 3 phân khúc giá (300k-3M)
- ✅ Tab5 Quỹ ôm: 5 giai đoạn mùa, T9-12 thấp điểm giảm 50%, 3 loại ôm (không/cứng/mềm)
- ✅ Tab6 KH mục tiêu: 3 segments (cặp đôi/bạn bè/gia đình), 17+ fields mỗi segment
- ✅ Tab7 Đối thủ: 4 nhóm (homestay tự MKT, dân bản địa, OTA, lữ hành)

**SS2 - Cát Bà Analysis (4 tabs):**
- ✅ Tab1 Phương tiện: HN→HP (bus/taxi/train), HP→Cát Bà (ferry/cable_car), đến TT (shuttle/taxi/xe máy)
- ✅ Tab2 Điểm du lịch: 9 địa điểm (Cát Cò 1-3, Vịnh Lan Hạ, VQG, Thung lũng bướm...), 11 fields
- ✅ Tab3 Quán ăn: 20+ quán, 5 categories (sáng/trưa BD/trưa NH/tối/vặt)
- ✅ Tab4 Lịch trình: 3 itineraries (2N1Đ, 3N2Đ, Cát Bà+Hạ Long), chi tiết theo giờ

**SS3 - Customer Research (2 tabs):**
- ✅ Tab1 KH mục tiêu (Cát Bà): 3 segments (Gen Z 18-25, Cặp đôi 25-35, Gia đình 30-45)
- ✅ Tab2 Hành trình KH: 6 stages (phát sinh nhu cầu → sau chuyến đi)

**SS4 - Product Standards (1 tab):**
- ✅ Tab1: 26 tiêu chí, 4 categories (Vị trí/CSVC/Vận hành/An toàn)

**SS5 - Phú Quý Pricing (4 tabs):**
- ✅ Tab1 Giá 3N2D: 13 properties, 59+ rooms, giá 1.825M-4.5M, theo weekday/T6/T7/CN
- ✅ Tab2 Giá 2N1D: Same 13 properties, giá 1.425M-4.5M
- ✅ Tab3 Combo Lẻ: Formula table 30 mức giá (entry 300k-3M → combo/đêm)
- ✅ Tab4 Mô tả: 13 properties với room specs (m², bed, tub, floor), invoice status

### Verified Data Volumes

| Entity | Count | Source |
|---|---|---|
| Thị trường mẫu | 2 (Phú Quý, Cát Bà) | SS1, SS2 |
| Properties | 13 (+ market overview 180-200 tại PQ) | SS5, SS1-Tab4 |
| Room types | 59+ (with booking codes SR01-TV04) | SS5 |
| Room specs | Bed count, m², view, tub, floor | SS5-Tab4 |
| Pricing rows | ~240 (59 rooms × 4 day_types) per combo type | SS5-Tab1,2 |
| Combo types | 3 (3N2D, 2N1D, per_night) | SS5-Tab1,2,3 |
| Attractions | 14 (PQ) + 9 (CB) = 23 | SS1-Tab2, SS2-Tab2 |
| Dining spots | ~12 (PQ) + 20 (CB) = ~32 | SS1-Tab2, SS2-Tab3 |
| Transportation routes | 4 (PQ) + 9 (CB) = 13 | SS1-Tab3, SS2-Tab1 |
| Customer segments | 3 (PQ) + 3 (CB) = 6 | SS1-Tab6, SS3-Tab1 |
| Journey stages | 6 (general CB) + 14 (detailed PQ) = ~20 | SS3-Tab2, SS1-Tab6 |
| Competitors | 4 groups | SS1-Tab7 |
| Evaluation criteria | 26 | SS4 |
| Inventory strategies | 5 seasonal periods + 3 holding types | SS1-Tab5 |
| Local specialties | 7 dishes (PQ) | SS1-Tab2 |
| Invoice status | 5 types (yes/VAT/business/no/in-progress) | SS5-Tab4 |

### Minor Schema Gaps (acceptable, KISS)

| Gap | Workaround |
|---|---|
| "Tình trạng hôn nhân" field | Store in preferences text |
| Cross-market itineraries | Describe in template description |
| Property photos per room | property_rooms.images JSONB |
| Operator names (Superdong) | Store in transportation.notes |
| Geographic area per property | Store in market_properties.location_detail |

## Conclusion
**Schema v2.1 (17 tables) covers 100% of all 18 tabs** across 5 spreadsheets. All data has been verified against actual sheet content. Admin can fully manage all market data types on the software without Google Sheets.
