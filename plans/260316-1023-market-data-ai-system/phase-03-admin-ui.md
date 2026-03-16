# Phase 3: Admin UI - Quản Lý Dữ Liệu Thị Trường

## Priority: HIGH | Status: ✅ COMPLETE

## Overview
Giao diện admin quản lý toàn bộ dữ liệu thị trường, thay thế hoàn toàn Google Sheets.

---

## Page Structure

### 3.1 Markets Management Page `/markets`
**Sidebar menu**: "Thị trường" (icon: Globe)

**Layout:**
- Header: "Quản lý Thị Trường" + nút "Thêm thị trường"
- Grid cards hoặc table list các thị trường
- Mỗi card: tên, region, status badge, số properties, nút Edit/Delete
- Click card → vào market detail

**Market Detail Page** `/markets/:id`
- Tabs: Tổng quan | Cơ sở lưu trú | Lịch trình | Đối thủ | Hành trình KH | Tiêu chí đánh giá | Quy tắc giá

---

### 3.2 Tab: Cơ sở lưu trú (Properties)
**Tương ứng Sheet 5 - Bảng giá**

- Table list properties: tên, loại, rating, số phòng, status, ai_visible toggle
- Click property → modal/page chi tiết
- **Property Detail:**
  - Info form: tên, loại, rating, địa chỉ, mô tả, amenities, ảnh, contact
  - Tab "Phòng & Giá": list rooms, mỗi room expand → bảng giá theo day_type
  - Tab "Đánh giá": matrix giống Sheet 4 (tiêu chí × giá trị)

**Rooms & Pricing UI** (replaces Sheet 5 completely):
```
┌─────────────────────────────────────────────────────────┐
│ Serõ - Danh sách phòng                    [+ Thêm phòng]│
├─────────────────────────────────────────────────────────┤
│ ▼ Phòng Đôi View Biển (Mã: SRO-DVB)     [✓ AI] [Edit] │
│   ┌──────────┬────────────┬──────────┬──────────┐      │
│   │ Ngày     │ Tiêu chuẩn │ Combo3N2Đ│ +1 người │ -1  │ Thêm đêm│
│   ├──────────┼────────────┼──────────┼──────────┤      │
│   │ T2-T5    │ 2 người    │ 2,500,000│ 2,700,000│ ... │ ...     │
│   │ T6       │ 2 người    │ 2,800,000│ 3,000,000│ ... │ ...     │
│   │ T7       │ 2 người    │ 3,200,000│ 3,400,000│ ... │ ...     │
│   │ CN       │ 2 người    │ 2,900,000│ 3,100,000│ ... │ ...     │
│   └──────────┴────────────┴──────────┴──────────┘      │
│ ▶ Suite Gia Đình (Mã: SRO-SGD)          [✓ AI] [Edit] │
└─────────────────────────────────────────────────────────┘
```

---

### 3.3 Tab: Đánh giá (Property Evaluations)
**Tương ứng Sheet 4 - Bộ tiêu chí**

- Matrix view: rows = tiêu chí (grouped by category/subcategory), columns = properties
- Admin click cell → edit value
- Nút "Quản lý tiêu chí" → CRUD criteria template
- Nút export comparison table

```
┌────────────┬──────────────┬──────────────┬─────────┬─────────┬─────────┐
│ Hạng mục   │ Tiểu hạng    │ Tiêu chí     │ Serõ    │ Memory  │ Fog     │
├────────────┼──────────────┼──────────────┼─────────┼─────────┼─────────┤
│ Vị trí     │              │ So với TT     │ 500m    │ 200m    │ 1km     │
│            │              │ So với ĐL     │ Gần     │ Xa      │ Trung   │
│ CSVC       │ Phòng ngủ    │ Diện tích    │ 25m²    │ 30m²    │ 20m²    │
│            │              │ View         │ Biển    │ Núi     │ Vườn    │
│            │ Nhà vệ sinh  │ Khép kín     │ Có      │ Có      │ Không   │
└────────────┴──────────────┴──────────────┴─────────┴─────────┴─────────┘
```

---

### 3.4 Tab: Lịch trình mẫu (Itineraries)
**Tương ứng Sheet 2 - Lịch trình**

- List itinerary templates: title, số ngày, theme badge
- Click → detail view/edit
- **Itinerary Editor:**
  - Header: title, duration, theme select
  - Timeline UI theo ngày × buổi
  - Drag-drop items within timeline
  - Mỗi item: time_start, time_end, activity, location, notes

```
┌─────────────────────────────────────────────────────┐
│ Cát Bà 3 Ngày 2 Đêm                    [✓ AI]     │
├─────────┬───────────────────────────────────────────┤
│ NGÀY 1  │ Sáng                                      │
│         │ ○ 05:30-08:30  Di chuyển ga HN → ga HP    │
│         │ ○ 09:00-10:00  Nhận xe máy, ăn sáng HP    │
│         │ Chiều                                      │
│         │ ○ 11:00-11:30  Phà Đồng Văn → Cát Bà     │
│         │ ○ 14:00        Check-in homestay           │
│         │ Tối                                        │
│         │ ○ 19:30        Ăn tối, dạo trung tâm      │
├─────────┼───────────────────────────────────────────┤
│ NGÀY 2  │ ...                                        │
└─────────┴───────────────────────────────────────────┘
```

---

### 3.5 Tab: Đối thủ cạnh tranh (Competitors)
**Tương ứng Sheet 1 - Competitive Analysis**

- Table list: STT, nhóm, ví dụ, kênh chính, hiệu quả badge, mật độ
- CRUD modal: form fields match sheet columns exactly
- ai_visible toggle per row

---

### 3.6 Tab: Hành trình khách hàng (Customer Journey)
**Tương ứng Sheet 3 - Customer Journey Map**

- Pipeline/funnel view hoặc table
- 6 stages displayed as cards or expandable rows
- Each stage shows: actions, touchpoints, painpoints, info needs, business touchpoints
- CRUD per stage

---

### 3.7 Pricing Configs Page (sub-tab in market or property)
**Quy tắc giá linh hoạt**

- Admin tạo rules: child_policy, surcharge, discount, combo
- Scope: per market (áp dụng toàn thị trường) hoặc per property
- JSON form builder cho config field
- Examples pre-filled (chính sách trẻ em, phụ thu đổi tuyến)

---

### 3.8 AI Settings Page `/settings/ai`
**Cấu hình AI Access**

- Global toggles per data category (6 categories)
- Checkbox matrix: category × enabled
- Preview: "AI hiện đang truy cập: Cơ sở lưu trú ✓, Giá ✓, Lịch trình ✓..."

---

## Component Structure
```
apps/web/src/
├── pages/
│   ├── markets-page.tsx              # List markets
│   ├── market-detail-page.tsx        # Market tabs container
│   └── ai-settings-page.tsx          # AI access config
├── components/market-data/
│   ├── market-form-modal.tsx         # Create/edit market
│   ├── properties-tab.tsx            # Properties list + CRUD
│   ├── property-detail-modal.tsx     # Property form
│   ├── rooms-pricing-panel.tsx       # Rooms + pricing table
│   ├── evaluation-matrix.tsx         # Criteria × properties matrix
│   ├── evaluation-criteria-modal.tsx # CRUD criteria
│   ├── itinerary-editor.tsx          # Timeline editor
│   ├── competitors-tab.tsx           # Competitors table + CRUD
│   ├── customer-journey-tab.tsx      # Journey stages
│   ├── pricing-configs-tab.tsx       # Flexible pricing rules
│   └── ai-visibility-toggle.tsx      # Reusable toggle component
```

---

## Implementation Steps
- [x] Markets page (list + CRUD)
- [x] Market detail page with tabs
- [x] Properties tab (list + detail modal)
- [x] Rooms & pricing panel (inline editable table)
- [x] Evaluation matrix (criteria template + property values)
- [x] Itinerary editor (timeline UI)
- [x] Competitors tab
- [x] Customer journey tab
- [x] Pricing configs tab
- [x] AI settings page
- [x] AI visibility toggle component (reusable)
- [x] Add sidebar menu items + routes

## Success Criteria
- [x] Admin can fully manage all market data without Google Sheets
- [x] All Sheet 1-5 data formats represented in UI
- [x] AI visibility toggleable per record and per category
- [x] Responsive, Vietnamese labels
- [x] Data validation via Zod schemas
