# Phân Tích Feedback Khách Hàng - AI Homesworld Travel

**Ngày**: 2026-03-23 | **Nguồn**: Google Sheets + 16 ảnh minh họa (extracted từ XLSX)
**Ảnh lưu tại**: `uploads/feedback-images/fb-*.png`

---

## 1. TỔNG HỢP FEEDBACK (13 mục) — ĐÃ VERIFY QUA HÌNH ẢNH

### FB-01: Xóa section Dashboard trip planning
> "Em đang thấy phần này không có lợi ích gì, anh bỏ giúp em ạ"

**Ảnh**: `fb-01-remove-section.png` — Trang Dashboard user với "Chào buổi sáng, Admin", "Kyoto Expedition" (chuyến tiếp theo), "Bản nháp đang soạn" (London Business, Da Nang Summer 2026)
- **Section cần xóa**: Toàn bộ phần trip planning trên dashboard (next trip + drafts)
- **Hiện trạng**: `dashboard-page.tsx` render `dashboard-next-trip.tsx` + `dashboard-trip-card.tsx`
- **Action**: Xóa/ẩn trip planning section khỏi dashboard cho production

---

### FB-02: Hệ thống báo cáo (Report & Analytics)
> Cần thêm: (1) Tổng thị trường, (2) FAQ, (3) Thời gian sử dụng nhân sự, (4) Xem chat nhân sự

**Ảnh**: `fb-02-report-analytics.png` — Dashboard stats hiện tại: 8 cards (Người dùng=2, Khách sạn=8, Đặt phòng=0, Doanh thu=0đ, Tài nguyên=4, Bài viết KB=10, Phiên chat=36, Tổng phòng=32)

| Yêu cầu | Hiện trạng (code) | Gap |
|----------|-------------------|-----|
| Tổng thị trường | `dashboard-stat-cards.tsx` có 8 stats, KHÔNG có markets count | ❌ Thiếu stat card |
| FAQ aggregation | Không có query/service nào aggregate chat questions | ❌ Thiếu hoàn toàn |
| Thời gian sử dụng nhân sự | `chat_sessions` chỉ có `createdAt`, không có duration tracking | ❌ Thiếu hoàn toàn |
| Admin xem chat nhân sự | `chat-routes.ts` chỉ query sessions theo userId hiện tại | ❌ Thiếu admin endpoint |

---

### FB-03: Cập nhật data cơ sở lưu trú — CẬP NHẬT TỪ HÌNH ẢNH
> Thêm Mã định danh KS, Tiện ích chung dạng checkbox

**Ảnh hiện tại** (`fb-03a-accommodation-data.png`): Form "Chỉnh sửa cơ sở" có: Tên, Loại, Xếp hạng sao, Trạng thái, Hóa đơn, Địa chỉ, Vị trí chi tiết, Mô tả, Hình ảnh upload

**Ảnh KH mong muốn** (`fb-03b-accommodation-data-2.png`): Form mới với:
- **Mã khách sạn**: "HBDNG-001" (field mới)
- **Tiện ích & Dịch vụ**: Dạng CHECKBOX TAGS (Bãi biển, Wifi miễn phí, Hồ bơi, Phòng họp) — không phải textarea
- **Hình ảnh & Lưu ý**: Upload area + "update hình ảnh khách sạn"
- **Lưu ý khách sạn**: Text field riêng (giờ check-in 14:00, giờ trả phòng 12:00, phí phòng chưa bao gồm thuế...)

| Yêu cầu | Schema hiện tại (`market_properties`) | Gap |
|----------|--------------------------------------|-----|
| Mã định danh KS (identificationCode) | KHÔNG có field | ❌ Thêm `propertyCode: varchar(20)` |
| Tiện ích dạng checkbox | `amenities: jsonb` đã có nhưng UI là textarea | ⚠️ UI cần đổi thành checkbox/tag picker |
| Lưu ý KS riêng | `notes: text` đã có | ✅ Đã có, cần hiển thị rõ hơn |

---

### FB-04: Cập nhật giá phòng — REDESIGN LỚN (PHỨC TẠP NHẤT)
> Giá theo giai đoạn + đêm, bỏ combo, phụ thu tùy chỉnh tuổi, ẩn giá nhân sự

**Ảnh hiện tại** (`fb-04a-room-pricing.png`): Form "Sửa giá" có: Combo (3N2Đ dropdown), Loại ngày (T2-T5), Số người TC, Giá niêm yết, Biến thể ±1 người, Phụ thu & thêm đêm (cố định), Giá chiết khấu (Admin)

**Ảnh KH mong muốn** (`fb-04b-room-pricing-2.png`): Form mới HOÀN TOÀN KHÁC:
```
┌─ Cài đặt giá theo giai đoạn ──────────────────────┐
│ Giai đoạn 1: 22/03 → 30/04                        │
│   Đêm T2→T5: 500.000  |  Đêm T6+CN: 700.000     │
│   Đêm T7: 900.000                                 │
│                                                    │
│ Giai đoạn 2: 30/04 → 10/05                        │
│   Đêm T2→T5: 700.000  |  Đêm T6+CN: 900.000     │
│   Đêm T7: 1.100.000                               │
│                                                    │
│ [+ Thêm giai đoạn giá mới]                        │
├────────────────────────────────────────────────────┤
│ Giá niêm yết: 1.800.000  |  Giá chiết khấu: 1.600.000 │
│ Số lượng tiêu chuẩn: 2 người                      │
│ Tiện ích dịch vụ: [Ăn sáng] [Hồ bơi] [Wifi]     │
│ Số lượng tối đa: 4 người                          │
├────────────────────────────────────────────────────┤
│ Phụ thu:                                           │
│  Trường hợp      |  Giá phụ thu                   │
│  Người lớn       |  500.000                        │
│  Trẻ em < 5 tuổi |  0                             │
│  Trẻ em > 5 tuổi |  100.000                       │
└────────────────────────────────────────────────────┘
```

| Yêu cầu từ ảnh | Schema hiện tại (`room_pricing`) | Gap |
|-----------------|----------------------------------|-----|
| Giá THEO GIAI ĐOẠN (date range) | `seasonStart/seasonEnd` date có nhưng UI KHÔNG dùng | ⚠️ UI cần refactor lớn |
| Giá/đêm theo day type TRONG giai đoạn | `dayType` + `price` tồn tại | ⚠️ Logic cần restructure |
| Bỏ Combo 2N1Đ, 3N2Đ | `comboType` varchar(20) | ⚠️ Xóa options, giữ "Giá/đêm" |
| Giá niêm yết + chiết khấu (tổng quan) | `price` + `discountPrice` có | ✅ Có, cần hiển thị ngoài giai đoạn |
| Số lượng tiêu chuẩn | `standardGuests` integer có | ✅ Đã có |
| Số lượng tối đa | `capacity` trong `property_rooms` | ✅ Đã có (rename hiển thị) |
| Tiện ích dịch vụ phòng | `includedAmenities` text | ⚠️ Đổi thành checkbox/tags |
| Phụ thu NL | `extraAdultSurcharge` integer có | ✅ Đã có |
| Phụ thu TE TÙY CHỈNH TUỔI | `extraChildSurcharge` integer (1 giá cố định) | ❌ Cần array: [{ageRange, price}] |
| Ẩn giá cho nhân sự (user role) | `aiVisible` toggle chỉ ẩn khỏi AI | ❌ Thiếu role-based pricing visibility |
| [+ Thêm giai đoạn giá mới] | Mỗi record là 1 row, CÓ thể thêm nhiều seasons | ⚠️ UI cần nút "Thêm giai đoạn" |

**Kết luận**: Pricing UI cần REDESIGN hoàn toàn theo layout mới của KH. Schema cơ bản đã support (seasonStart/End, dayType, price) nhưng UI và UX flow phải làm lại.

---

### FB-05: Giao diện cơ sở lưu trú — THÊM CARD VIEW
> Giữ giao diện cũ + thêm giao diện mới kiểu khách sạn

**Ảnh hiện tại** (`fb-05a-accommodation-ui.png`): Table view đơn giản — Tên, Loại, Sao, Trạng thái, AI toggle, Thao tác

**Ảnh KH mong muốn** (`fb-05b-accommodation-ui-2.png`): Card grid kiểu Booking.com — Ảnh KS, star rating, giá/đêm, amenities icons (pool, free-wifi, breakfast, restaurant), nút "View Details"

| Yêu cầu | Hiện trạng | Gap |
|----------|-----------|-----|
| Giữ table view | `properties-tab.tsx` có table | ✅ Giữ nguyên |
| Thêm card grid view | Không có | ❌ Cần component mới `property-card-view.tsx` |
| Toggle giữa 2 view modes | Không có | ❌ Cần view mode switcher |
| Card hiện ảnh, giá, amenities | Data đã có trong schema | ⚠️ Cần query giá + render |

---

### FB-06: Điểm du lịch — Thêm upload hình ảnh
> "Update thêm phần update hình ảnh"

**Ảnh** (`fb-06-attraction-images.png`): Form "Chỉnh sửa điểm đến" — có nhiều text fields (Tên, Loại, Mức độ phổ biến, Thời điểm, Chi phí, Vị trí, Mô tả, Giá trị trải nghiệm, Phù hợp cho) nhưng **KHÔNG CÓ image upload component**

| Yêu cầu | Hiện trạng | Gap |
|----------|-----------|-----|
| Image upload UI | Schema `market_attractions` CÓ `images: jsonb` | ⚠️ DB có, UI THIẾU upload component |
| Image manager | `image-manager.tsx` component tồn tại, dùng cho properties | ⚠️ Chỉ cần thêm vào attractions form |

---

### FB-07: Nhà tàu/xe — Hình ảnh + Note giá
> Thêm upload hình ảnh + trường note giá xe (chiết khấu, niêm yết, phụ thu TE)

**Ảnh** (`fb-07-transportation.png`): Form "Thêm nhà xe/tàu mới" — có: Tên, Mã nhà xe, Loại phương tiện, Tuyến đường, Điểm đón, SĐT, Zalo, Ghi chú. **KHÔNG CÓ image upload, KHÔNG CÓ pricing fields**.

| Yêu cầu | Schema (`transport_providers`) | Gap |
|----------|-------------------------------|-----|
| Hình ảnh | KHÔNG có `images` field | ❌ Thêm `images: jsonb` vào schema |
| Note giá (chiết khấu, niêm yết, phụ thu TE) | `transport_pricing` table riêng có structured pricing | ⚠️ Cần thêm quick pricing note vào provider form hoặc link rõ hơn |

**Lưu ý**: `transport_pricing` table đã có: `onewayListedPrice`, `onewayDiscountPrice`, `childFreeUnder`, `childDiscountAmount` — nhưng KH muốn có 1 field "note giá" nhanh ngay trong form nhà xe, không phải mở tab pricing riêng.

---

### FB-08: Kiến thức thị trường — MODULE MỚI
> Thêm "Update kiến thức thị trường" với 2 field: Khía cạnh + Kiến thức update

**Ảnh** (`fb-08-market-knowledge.png`): Market detail page Đà Nẵng — 11 tabs hiện tại được highlight khung đỏ + tab "Ôm quỹ phòng" đang active. KH muốn thêm tab/section mới.

- **Hiện trạng**: 11 tabs trong market detail. Không có module "kiến thức thị trường"
- **Gap**: ❌ Cần hoàn toàn mới:
  - Table: `market_knowledge_updates` (marketId, aspect, knowledge, createdBy, status, timestamps)
  - API: CRUD endpoints
  - UI: Tab mới trong `market-detail-page.tsx`

---

### FB-09: Hoạt động trải nghiệm — MODULE MỚI
> Thêm "Hoạt động trải nghiệm" với 5 field: Tên, Chi phí, Thông tin, Hình ảnh, Ghi chú

**Ảnh**: `fb-09-experience-activities.png` — Cùng ảnh market tabs (vì ảnh trong sheet dùng chung)

- **Hiện trạng**: `market_attractions` có `experienceValue: text` nhưng đó là field text đơn giản, KHÔNG phải module riêng
- **Gap**: ❌ Cần table riêng `market_experiences`:
  - `activityName` (varchar), `cost` (text/integer), `description` (text), `images` (jsonb), `notes` (text)
  - API + UI tab mới

---

### FB-10: Cập nhật giá & biên lợi nhuận
> Bỏ giá 2n1d/3n2d (chỉ giá/đêm), thêm biên lợi nhuận TB thị trường + từng KS

**Ảnh** (`fb-10-pricing-margin.png`): Trang "Quản lý giá" — Matrix hiện: Rooms × Combo (3N2Đ, 2N1Đ, Giá/đêm, test) × Day types (T2-T5, T6, T7, CN, Lễ). Giá đen = niêm yết, cam = chiết khấu.

| Yêu cầu | Hiện trạng (pricing-management-page) | Gap |
|----------|--------------------------------------|-----|
| Bỏ cột 3N2Đ, 2N1Đ | `combo-type-columns` render all comboTypes | ⚠️ Disable/remove 2 options |
| Chỉ giữ "Giá/đêm" | comboType "per_night" tồn tại | ⚠️ Set default, hide others |
| Biên LN TB thị trường | Không có API | ❌ Cần tính: (niêm yết - chiết khấu) / niêm yết × 100 |
| Biên LN per KS/combo | Không có | ❌ Cần margin analysis UI |

---

### FB-11: AI không bóc giá chi tiết
> AI chỉ trả lời giá combo/người, KHÔNG tiết lộ giá niêm yết/giá vốn chi tiết

**Ảnh** (`fb-11-ai-pricing-behavior.png`): Chat AI trả lời câu hỏi tính giá combo Cát Bà → Hiện BẢNG GIÁ CHI TIẾT gồm: Phòng nghỉ 15,900,000đ, Xe Cabin 5,900,000đ, Tàu cao tốc 2,100,000đ, Trẻ em <5t 0đ, TỔNG 27,485,000đ, GIÁ TB/NGƯỜI ~4,580,000đ

- **Vấn đề**: AI đang show giá từng hạng mục → KH KHÔNG muốn nhân sự biết giá vốn/niêm yết từng item
- **Hiện trạng**: `gemini-service.ts` gọi pricing skill trả raw data
- **Gap**: ⚠️ Cần filter output trong pricing skill → chỉ trả giá combo tổng + giá/người

---

### FB-12: Đổi tên & branding
> Đổi "AI Travel" → "AI Homesworld Travel" + Màu thương hiệu

**Ảnh** (`fb-12-branding.png`): Sidebar hiện tại "AI Travel" logo xanh teal + menu items

| Yêu cầu | Vị trí code | Gap |
|----------|------------|-----|
| Đổi tên | `sidebar.tsx` line ~59: "AI Travel" | ⚠️ Đổi text |
| Đổi tên login | `login-page.tsx` | ⚠️ Đổi text |
| Đổi tên chat | `chat-page.tsx` header | ⚠️ Đổi text |
| Màu thương hiệu | CSS variables / tailwind config | ⚠️ Cần biết hex codes từ KH |

---

### FB-13: Hệ thống đóng góp kiến thức — WORKFLOW MỚI
> Nhân sự submit kiến thức mới → Admin review → Approve → AI học

**Ảnh** (`fb-13-knowledge-contribution.png`): Sidebar — KH muốn thêm "Update kiến thức thị trường" vào menu cho staff

- **Hiện trạng**: Không có contribution workflow. KB chỉ admin quản lý qua `/knowledge-base`
- **Gap**: ❌ Thiếu hoàn toàn:
  - Staff UI: Form submit kiến thức (khía cạnh + nội dung + thị trường)
  - Admin UI: Review queue → Approve/Reject
  - Integration: Approved → auto-add vào knowledge base → AI context

---

## 2. PHÂN LOẠI CHÍNH XÁC THEO MỨC ĐỘ

### ❌ XÂY MỚI HOÀN TOÀN
| # | Feature | Scope |
|---|---------|-------|
| FB-01 | Xóa trip planning section khỏi dashboard | S — xóa/ẩn components |
| FB-02.1 | Stat card "Tổng thị trường" | S — thêm 1 query + 1 card |
| FB-02.2 | FAQ aggregation (phân tích câu hỏi phổ biến) | M — aggregate chat_messages |
| FB-02.3 | Staff usage time tracking | M — tracking logic + UI |
| FB-02.4 | Admin xem chat nhân sự | M — admin endpoint + page |
| FB-05 | Property card grid view | M — new component + toggle |
| FB-08 | Market knowledge update module | M — table + API + tab |
| FB-09 | Experience activities module | M — table + API + tab |
| FB-10.2 | Profit margin analysis dashboard | M — calculation + UI |
| FB-13 | Knowledge contribution workflow | L — staff submit + admin review + AI sync |

### ⚠️ CẬP NHẬT / REFACTOR
| # | Feature | Scope |
|---|---------|-------|
| FB-03 | Thêm `propertyCode` field + amenities checkbox UI | S |
| FB-04 | **REDESIGN pricing form** (giai đoạn, per-night, tuổi phụ thu) | **XL** — UI + logic thay đổi lớn |
| FB-06 | Thêm image upload vào attractions form | S — reuse `image-manager.tsx` |
| FB-07.1 | Thêm `images` vào `transport_providers` schema + UI | S |
| FB-07.2 | Thêm pricing note vào provider form | S |
| FB-10.1 | Disable combo types 2N1Đ/3N2Đ, giữ Giá/đêm | S |
| FB-11 | Cập nhật AI prompt + pricing skill output filter | S |
| FB-12 | Rebranding text + colors | S |

### ✅ ĐÃ CÓ (Không cần thay đổi)
- `amenities: jsonb` trong `market_properties` (FB-03 partial — data OK, UI cần đổi)
- `standardGuests` trong `room_pricing` (FB-04 partial)
- `capacity` trong `property_rooms` (FB-04 partial — đây là maxCapacity)
- `images: jsonb` trong `market_attractions` schema (FB-06 partial — schema OK, UI thiếu)
- `seasonStart/End` trong `room_pricing` (FB-04 partial — schema support, UI không dùng)
- `notes: text` trong `market_properties` (FB-03 partial)

---

## 3. KẾ HOẠCH UPDATE CHÍNH XÁC

### PHASE 1: Quick Wins & Branding (1-2 ngày) — 🔴 HIGH
> Impact cao, effort thấp. Deliver ngay được.

**1.1 Xóa trip planning dashboard (FB-01)**
- Ẩn/xóa `DashboardNextTrip` + `DashboardTripCard` components khỏi `dashboard-page.tsx`
- Giữ admin stats section

**1.2 Rebranding (FB-12)**
- "AI Travel" → "AI Homesworld Travel" tại: sidebar, login page, chat header
- Update CSS color variables (CẦN hex codes từ KH)

**1.3 Schema migrations nhỏ (FB-03, FB-07)**
- `market_properties`: thêm `propertyCode varchar(20)`
- `transport_providers`: thêm `images jsonb default '[]'`

**1.4 AI behavior update (FB-11)**
- Update system prompt: không tiết lộ giá niêm yết/chiết khấu/giá vốn từng item
- Filter pricing skill output: chỉ return giá combo tổng + giá/người

**1.5 Disable combo types (FB-10.1)**
- Set `isActive=false` cho combo types "2n1d", "3n2d" trong `pricing_options`
- Pricing management page chỉ hiển thị "Giá/đêm"

---

### PHASE 2: Image Upload & UI Enhancements (2-3 ngày) — 🔴 HIGH
> Hoàn thiện data entry modules hiện có

**2.1 Attractions image upload (FB-06)**
- Thêm `ImageManager` component vào attractions form dialog
- Schema đã có `images: jsonb` → chỉ cần UI

**2.2 Transport provider image + pricing note (FB-07)**
- Migration: thêm `images` field
- Thêm `ImageManager` + pricing quick-note field vào `transport-provider-form-dialog.tsx`

**2.3 Property form enhancement (FB-03)**
- Thêm `propertyCode` field vào property edit form
- Đổi amenities từ textarea → checkbox tag picker (predefined list + custom)
- Hiển thị `notes` field rõ ràng hơn (label "Lưu ý khách sạn")

**2.4 Property card view (FB-05)**
- Component mới `property-card-grid.tsx` kiểu hotel booking cards
- View mode toggle (Table ↔ Cards) trong `properties-tab.tsx`
- Card hiện: ảnh, tên, star rating, type, amenities icons

**2.5 Dashboard stats enhancement (FB-02.1)**
- Thêm stat card "Tổng thị trường" vào `dashboard-stat-cards.tsx`
- Query `markets` count trong dashboard service

---

### PHASE 3: Pricing System Redesign (5-7 ngày) — 🔴 HIGH
> Thay đổi core business logic. Phức tạp nhất.

**3.1 Room pricing form REDESIGN (FB-04) — KEY CHANGE**
- **New UI layout**: Giai đoạn (date ranges) + giá/đêm per day type TRONG giai đoạn
- Schema đã support: `seasonStart`, `seasonEnd`, `dayType`, `price` → refactor UI
- Bỏ combo selector (chỉ per-night)
- Thêm nút "[+ Thêm giai đoạn giá mới]"
- Tiện ích bao gồm → checkbox tags thay vì textarea

**3.2 Custom child surcharge age ranges (FB-04)**
- Hiện tại: 1 field `extraChildSurcharge` integer cố định
- Cần: Array surcharges `[{label: "Trẻ em < 5 tuổi", price: 0}, {label: "Trẻ em > 5 tuổi", price: 100000}]`
- Schema: thêm `surchargeRules: jsonb` vào `room_pricing` hoặc `property_rooms`

**3.3 Role-based pricing visibility (FB-04)**
- Admin: thấy tất cả (niêm yết + chiết khấu)
- Staff (user role): ẩn niêm yết + chiết khấu
- Approach: API middleware filter response fields based on role
- Frontend: conditional render pricing columns

**3.4 Profit margin analysis (FB-10.2)**
- API: tính `(niêm_yết - chiết_khấu) / niêm_yết * 100` per room, per property, per market
- UI: Margin dashboard/section trong pricing management page
- Hiện tổng quan: margin TB thị trường + margin per KS

---

### PHASE 4: New Modules (5-7 ngày) — 🟡 MEDIUM
> Modules hoàn toàn mới

**4.1 Market Knowledge Updates (FB-08)**
- New table: `market_knowledge_updates`
  ```
  id, marketId, aspect (varchar), knowledge (text),
  createdBy (userId), status (draft|approved),
  createdAt, updatedAt
  ```
- API: CRUD + filter by market
- UI: Tab mới "Kiến thức TT" trong market detail (tab thứ 12)

**4.2 Experience Activities (FB-09)**
- New table: `market_experiences`
  ```
  id, marketId, activityName (varchar), cost (text),
  description (text), images (jsonb), notes (text),
  sortOrder, aiVisible, createdAt, updatedAt
  ```
- API: CRUD endpoints
- UI: Tab mới "Trải nghiệm" trong market detail (tab thứ 13)
- AI: Integrate vào context builder

**4.3 Knowledge Contribution Workflow (FB-13)**
- Mở rộng `market_knowledge_updates` table:
  ```
  status: draft → pending_review → approved → rejected
  reviewedBy, reviewedAt, reviewNotes
  ```
- Staff menu item: "Đóng góp kiến thức" (sidebar mới cho user role)
- Staff UI: Submit form (chọn thị trường, khía cạnh, nội dung)
- Admin UI: Review queue page → Approve/Reject
- Auto-sync approved entries vào AI knowledge context

---

### PHASE 5: Admin Analytics (5-7 ngày) — 🟡 MEDIUM
> Reporting & monitoring cho quản trị

**5.1 FAQ Aggregation (FB-02.2)**
- Parse `chat_messages` content → extract questions
- Rank by frequency across all users
- API: `GET /admin/analytics/faq`
- UI: FAQ analytics table/chart

**5.2 Staff Usage Tracking (FB-02.3)**
- Track per user: total sessions, total messages, estimated time
- Add `lastMessageAt` to `chat_sessions` for duration calc
- API: `GET /admin/analytics/usage`
- UI: Staff usage table (name, sessions, messages, time)

**5.3 Admin View Staff Chat (FB-02.4)**
- Admin endpoint: `GET /admin/chat/sessions?userId=...`
- Admin endpoint: `GET /admin/chat/sessions/:id/messages`
- UI: Admin chat viewer page — filter by staff, date range
- Read-only mode (admin không can thiệp chat)

---

## 4. TIMELINE TỔNG QUAN

| Phase | Nội dung | Effort | Priority |
|-------|---------|--------|----------|
| Phase 1 | Quick Wins & Branding | 1-2 ngày | 🔴 HIGH |
| Phase 2 | Image Upload & UI Enhancements | 2-3 ngày | 🔴 HIGH |
| Phase 3 | Pricing System Redesign | 5-7 ngày | 🔴 HIGH |
| Phase 4 | New Modules (KB, Experience, Contribution) | 5-7 ngày | 🟡 MEDIUM |
| Phase 5 | Admin Analytics & Reporting | 5-7 ngày | 🟡 MEDIUM |
| **TỔNG** | | **18-26 ngày** | |

---

## 5. DEPENDENCIES

```
Phase 1.5 (disable combos) → Phase 3.1 (pricing redesign)
Phase 1.3 (schema migrations) → Phase 2.2 (transport images)
Phase 4.1 (knowledge table) → Phase 4.3 (contribution workflow)
Phase 1.2 (branding) → Cần hex codes từ KH
```

---

## 6. CÂU HỎI CẦN HỎI KHÁCH HÀNG

1. **FB-12**: Màu thương hiệu Homesworld Travel cụ thể? (hex codes hoặc brand guideline)
2. **FB-04**: Day types "T6+CN" và "T6+T7" — giá áp dụng cho cả 2 đêm liên tiếp hay giá mỗi đêm khi book 2 đêm?
3. **FB-04**: Ẩn giá cho TẤT CẢ user (role=user) hay chỉ 1 số role cụ thể?
4. **FB-04**: Phụ thu trẻ em — KH tự tùy chỉnh khoảng tuổi (dynamic) hay setup cố định (<5, 5-12, >12)?
5. **FB-13**: Khi KB contribution được approve, AI cập nhật ngay hay batch?
6. **FB-02.3**: "Thời gian sử dụng" tính login→logout hay active chat time?
7. **FB-05**: Card view cần hiện giá/đêm trên card? (KH mong muốn kiểu Booking.com có giá)
