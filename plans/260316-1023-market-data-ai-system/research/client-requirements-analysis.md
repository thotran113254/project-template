# Phân Tích Yêu Cầu Khách Hàng - Hệ Thống Quản Lý Thu Thập Dữ Liệu Thị Trường Du Lịch

## 1. Tổng Quan

Khách hàng là **công ty lữ hành** hoạt động tại nhiều điểm đến du lịch Việt Nam (Cát Bà, Hạ Long, Sa Pa, Phú Quốc, Phú Quý, Hà Giang). Họ cần:

1. **Hệ thống quản lý Knowledge Base** - lưu trữ có cấu trúc dữ liệu thị trường
2. **AI Chatbot** - tư vấn tự động dựa trên dữ liệu đã thu thập
3. **Giao diện cập nhật dễ dàng** - nhân viên update data không cần kỹ thuật

---

## 2. Nguồn Dữ Liệu Đã Thu Thập (5 Google Sheets)

### Sheet 1: Phân Tích Đối Thủ Cạnh Tranh
**Cấu trúc**: STT | Nhóm đối thủ | Mô tả ngắn | Ví dụ đơn vị | Kênh kiếm khách chính | Hình thức triển khai | Mức độ hiệu quả | Điểm mạnh – điểm yếu | Mật độ cạnh tranh

**4 nhóm đối thủ**:
1. Homestay/khách sạn tự marketing (nalani, sero, rì rào)
2. Dân bản địa làm du lịch (Long Phú Quý, Cát Phú Quý)
3. OTA platforms (Agoda, Traveloka)
4. Công ty lữ hành/sale cá nhân

### Sheet 2: Lịch Trình Mẫu (Itineraries)
**Cấu trúc**: Buổi (Sáng/Chiều/Tối) × Ngày 1/2/3

**3 lịch trình Cát Bà**:
- Cát Bà 2 ngày 1 đêm
- Cát Bà 3 ngày 2 đêm
- Cát Bà + Hạ Long 3 ngày 2 đêm

Chi tiết theo giờ: 5h30 ga Hà Nội → các điểm tham quan → check-in/out → ăn uống

### Sheet 3: Customer Journey Map
**Cấu trúc**: STT | Giai đoạn | Hành động khách | Touchpoint | Painpoint | Điều khách muốn biết | Điểm chạm DN

**6 giai đoạn**:
1. Phát sinh nhu cầu (TikTok, Facebook, Instagram)
2. Tìm hiểu & hỏi thông tin (SEO, chatbot)
3. Tư vấn & chốt combo (Messenger, Zalo, Hotline)
4. Trước chuyến đi (CSKH chủ động)
5. Trong chuyến đi (dịch vụ thực tế)
6. Sau chuyến đi (chăm sóc sau bán)

### Sheet 4: Bộ Tiêu Chí Đánh Giá Sản Phẩm (Property Evaluation)
**Cấu trúc**: Hạng mục | Tiểu hạng | Tiêu chí chi tiết | KS A | KS B | KS C

**Template đánh giá**:
- **Vị trí**: so với trung tâm, điểm du lịch, giao thông
- **Cơ sở vật chất**:
  - Phòng ngủ: diện tích, view, đồ dùng, thiết bị, thiết kế, độ mới, cách âm
  - Nhà vệ sinh: thiết bị, khép kín, chất lượng nước
  - Không gian chung: khu chờ, thời gian check-in, dịch vụ kèm
- **Vận hành & Dịch vụ**: check-in/out, bữa sáng, welcome drink, thái độ phục vụ, hỗ trợ lữ hành
- **An toàn & Minh bạch**: VAT

*Note: "Bộ tiêu chuẩn thay đổi theo mặt bằng chung từng thị trường"*

### Sheet 5: Bảng Giá Khách Sạn/Homestay
**Cấu trúc**: Tên home | Hạng phòng | Mã đặt phòng | Ngày | Số người tiêu chuẩn | Combo 3n2d | +1 người | -1 người | Thêm 1 đêm

**13 đơn vị lưu trú** (59+ loại phòng):
Serõ, Lamant Boutiqué House, Màu của nắng, JIMMY'C House, Memory beach hotel, Island Sunset Hotel, Fog xóm trâu, Nhà hàng xóm, New moon, Rì rào homestay, Moon villa, Coco villa, Trang vân hotel

**Giá**: 1,825,000₫ - 4,500,000₫/combo 3n2d, phân theo ngày trong tuần (weekday/T6/T7/CN)

---

## 3. Use Cases AI Chatbot (Từ tài liệu chính)

| # | Use Case | Yêu cầu dữ liệu |
|---|----------|-----------------|
| 1 | So sánh ưu/nhược 2 homestay | Property evaluation data |
| 2 | Tìm phòng theo tiêu chí cụ thể (bồn tắm lộ thiên, kín đáo, Sa Pa) | Room details, amenities |
| 3 | Lên lịch trình honeymoon 4 ngày Phú Quốc, tránh đông, hải sản local | Itineraries, restaurants, seasonal data |
| 4 | Hỏi mùa hoa tam giác mạch Hà Giang + địa điểm cho xe 29 chỗ | Seasonal events, transportation access |
| 5 | Tính giá cho 3 NL + 2 trẻ (5t, 11t), 3N2Đ, ngày T6 | Pricing rules, age policies |
| 6 | Phụ thu đổi tuyến Hạ Long → Sa Pa | Surcharge rules, route pricing |
| 7 | Gợi ý combo < 990k/người | Budget filtering, package data |
| 8 | Tính giá ở 2 khách sạn khác nhau 2 đêm | Multi-property pricing calculator |

---

## 4. Cách Khách Hàng Thu Thập Dữ Liệu Thị Trường

### Quy trình hiện tại:
1. **Khảo sát thực địa** → ghi nhận vào Google Sheets theo template có sẵn
2. **Phân loại theo domain**: đối thủ, lịch trình, customer journey, đánh giá sản phẩm, bảng giá
3. **Mỗi thị trường/điểm đến** có bộ sheets riêng
4. **Cập nhật liên tục**: giá theo mùa, phòng mới, đối thủ mới

### Pain points hiện tại:
- Dữ liệu phân tán nhiều Google Sheets
- Khó tìm kiếm nhanh khi tư vấn khách
- Không có AI tự động tư vấn
- Cập nhật manual, dễ sai sót
- Không có validation dữ liệu

---

## 5. Data Domains Cần Quản Lý

```
Market Data
├── Destinations (Điểm đến)
│   ├── Thông tin chung (mùa, thời tiết, sự kiện)
│   ├── Điểm tham quan
│   ├── Nhà hàng/ẩm thực
│   └── Phương tiện di chuyển
├── Properties (Cơ sở lưu trú)
│   ├── Thông tin cơ bản
│   ├── Room types & amenities
│   ├── Đánh giá theo bộ tiêu chí
│   └── Ảnh/media
├── Pricing (Bảng giá)
│   ├── Giá phòng theo mùa/ngày
│   ├── Combo packages
│   ├── Chính sách trẻ em/thêm người
│   └── Phụ thu/khuyến mãi
├── Itineraries (Lịch trình)
│   ├── Lịch trình mẫu theo điểm đến
│   ├── Theo số ngày
│   └── Theo chủ đề (honeymoon, gia đình...)
├── Competitors (Đối thủ)
│   ├── Phân nhóm
│   ├── Kênh marketing
│   └── Điểm mạnh/yếu
└── Customer Journey
    ├── Touchpoints
    ├── Pain points
    └── Chiến lược tiếp cận
```

---

## 6. Yêu Cầu Hệ Thống

### Functional
- CRUD dữ liệu thị trường theo format chuẩn
- Import/sync từ Google Sheets
- AI chatbot trả lời dựa trên knowledge base
- Tính giá tự động (combo, phụ thu, trẻ em)
- So sánh sản phẩm
- Gợi ý lịch trình theo yêu cầu
- Tìm kiếm theo tiêu chí cụ thể

### Non-functional
- Giao diện đơn giản, nhân viên không cần kỹ thuật
- Cập nhật data realtime → AI trả lời cập nhật
- Hỗ trợ tiếng Việt
- Mobile-friendly (nhân viên sale dùng điện thoại)

---

## 7. Câu Hỏi Chưa Giải Quyết

1. Khách hàng có bao nhiêu thị trường/điểm đến cần quản lý?
2. Mỗi thị trường có bao nhiêu sheets riêng (ngoài 5 sheets mẫu)?
3. Quy tắc tính giá trẻ em theo từng khách sạn có khác nhau không?
4. AI chatbot dùng cho nội bộ (nhân viên sale) hay public (khách hàng trực tiếp)?
5. Có cần tích hợp với kênh chat nào (Messenger, Zalo, web widget)?
6. Budget/timeline dự kiến?
7. Có cần multi-tenant (nhiều công ty dùng chung hệ thống)?
