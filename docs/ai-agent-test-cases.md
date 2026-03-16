# AI Agent Test Cases — Travel Assistant

> Tài liệu test case để khách hàng và team QA tự kiểm tra AI Agent.
> Tất cả giá được verify với database thực tế. Cập nhật: 16/03/2026.

## Hướng dẫn test

1. Đăng nhập hệ thống (admin hoặc user)
2. Vào trang **Chat AI** từ sidebar
3. Gửi từng câu hỏi bên dưới, đối chiếu kết quả với cột "Kỳ vọng"
4. AI trả lời bằng tiếng Việt, có markdown formatting (bold, bảng, list)

---

## A. Tính giá cơ bản (Single Turn)

| # | Câu hỏi | Kỳ vọng | Verified |
|---|---------|---------|----------|
| A1 | `Combo 3N2Đ phòng Garden View Standard ở Coastal Escape Phú Quý cho 2 người, check-in thứ 3?` | **3,100,000₫** — combo 3n2d, weekday, 2 người tiêu chuẩn | ✅ |
| A2 | `Combo 3N2Đ Beachfront Deluxe Phú Quý, 2 người, check-in thứ 7?` | **4,800,000₫** — combo 3n2d, saturday | ✅ |
| A3 | `Combo 2N1Đ phòng Đôi Tiêu Chuẩn Lan Hạ Bay Cát Bà, 2 người, thứ 6?` | **2,000,000₫** — combo 2n1d, friday | ✅ |
| A4 | `Giá phòng Tiêu Chuẩn Nhà Nghỉ Hoa Biển, combo 3N2Đ weekday, 2 người?` | **2,400,000₫** — combo 3n2d, weekday | ✅ |

## B. Phụ thu / Giảm trừ người

| # | Câu hỏi | Kỳ vọng | Verified |
|---|---------|---------|----------|
| B1 | `Combo 3N2Đ Beachfront Deluxe weekday nhưng 3 người, giá?` | **4,850,000₫** — price_plus1, vượt 1 người so với tiêu chuẩn 2 | ✅ |
| B2 | `Phòng Gia Đình BX-FAM tiêu chuẩn 3 người, chỉ đi 2 người, combo 3N2Đ weekday?` | **3,000,000₫** — price_minus1, bớt 1 người | ✅ |
| B3 | `Phòng Gia Đình Lan Hạ Bay, 4 người, combo 3N2Đ thứ 7?` | **4,600,000₫** — LH-FAM price_plus1 saturday | ✅ |

## C. Giá cuối tuần & ngày đặc biệt

| # | Câu hỏi | Kỳ vọng | Verified |
|---|---------|---------|----------|
| C1 | `Check-in thứ 6, combo 3N2Đ Beachfront Deluxe 2 người?` | **4,500,000₫** — friday | ✅ |
| C2 | `Check-in Chủ Nhật, combo 2N1Đ phòng Đôi View Biển Biển Xanh, 2 người?` | **2,000,000₫** — sunday | ✅ |
| C3 | `Giá per night Beachfront Deluxe thứ 7, 2 người?` | **2,850,000₫** — per_night saturday | ✅ |

## D. Extra night (vượt combo)

| # | Câu hỏi | Kỳ vọng | Verified |
|---|---------|---------|----------|
| D1 | `Beachfront Deluxe 2 người, 3 đêm từ ngày 21/04 (thứ 3)?` | **6,450,000₫** = 3N2Đ weekday 4,200,000 + extra_night weekday 2,250,000 | ✅ |

## E. So sánh & Tư vấn

| # | Câu hỏi | Kỳ vọng | Verified |
|---|---------|---------|----------|
| E1 | `So sánh giá phòng đôi tất cả homestay Phú Quý, combo 3N2Đ weekday 2 người?` | Bảng 4 dòng: Hoa Biển 2,400k → Biển Xanh 2,800k → CE-STD 3,100k → CE-DLX 4,200k | ✅ |
| E2 | `Khách budget thấp, 2 người đi biển cuối tuần, rẻ nhất?` | Gợi ý Nhà Nghỉ Hoa Biển 2N1Đ friday 1,700,000₫ | ✅ |

## F. Gia đình & Nhóm

| # | Câu hỏi | Kỳ vọng | Verified |
|---|---------|---------|----------|
| F1 | `Gia đình 4 người (2 lớn + 2 trẻ 10 tuổi) đi Phú Quý 3N2Đ cuối tuần, phòng nào phù hợp?` | Gợi ý BX-FAM hoặc HB-TRP, báo giá price_plus1 cho cuối tuần | ✅ |

## G. Điểm tham quan & Trải nghiệm

| # | Câu hỏi | Kỳ vọng | Data tham chiếu |
|---|---------|---------|-----------------|
| G1 | `Phú Quý có những điểm tham quan gì? Chỗ nào lặn san hô?` | Liệt kê: Bãi Nhỏ, Gành Hang, Linh Sơn Tự, Hòn Tranh. Lặn san hô → Hòn Tranh + snorkeling Bãi Nhỏ | Bãi Nhỏ (beach), Gành Hang (landmark), Linh Sơn Tự (cultural), Hòn Tranh (island) |
| G2 | `Khách muốn trải nghiệm lặn biển ở Phú Quý, chi phí bao nhiêu và đi đâu?` | Hòn Tranh: thuê thuyền 200-300k/người, snorkeling Bãi Nhỏ: 50k/bộ dụng cụ. Nên đi mùa tháng 3-8 | Hòn Tranh cost: 200-300k, Bãi Nhỏ snorkeling: 50k |
| G3 | `Cát Bà có hoạt động gì cho người thích mạo hiểm?` | Kayak Vịnh Lan Hạ (350-600k/người), trekking VQG Cát Bà (40k vé + 150-300k hướng dẫn), leo núi Pháo Đài | Vịnh Lan Hạ (bay), VQG Cát Bà (nature) |
| G4 | `Khách muốn đi đảo Khỉ ở Cát Bà, giá vé bao nhiêu, nên đi lúc nào?` | Vé tàu + vào đảo: 150-200k/người, nên đi sáng 8:00-11:00 tránh trưa nóng | Đảo Khỉ: 150-200k, best_time: 8:00-11:00 |
| G5 | `Khách thích chụp ảnh, ở Phú Quý nên đi đâu và lúc nào?` | Gành Hang: sáng sớm 6:00-9:00 ánh sáng đẹp. Bãi Nhỏ: chiều 15:00-18:00 hoàng hôn. Linh Sơn Tự: panorama toàn đảo | best_time data |
| G6 | `So sánh biển Phú Quý và Cát Bà, khách nên chọn nơi nào?` | So sánh: Phú Quý hoang sơ/ít du khách/biển đẹp hơn vs Cát Bà nhiều hoạt động/kayak vịnh/gần Hà Nội hơn | Dựa trên highlights + attractions cả 2 market |

## H. Ẩm thực & Quán ăn

| # | Câu hỏi | Kỳ vọng | Data tham chiếu |
|---|---------|---------|-----------------|
| H1 | `Phú Quý ăn hải sản ở đâu ngon? Giá khoảng bao nhiêu?` | Quán Bà Tư Hải Sản: 150-400k/người, hải sản tươi sống, view biển. Nhà Hàng Biển Xanh: 200-600k/người, phù hợp nhóm đông | Quán Bà Tư (seafood), Biển Xanh (restaurant) |
| H2 | `Ăn sáng ở Phú Quý ở đâu rẻ?` | Cơm Tấm Sáng Cô Lan: 30-60k/người, cơm tấm sườn bì chả, bún bò | Cô Lan (breakfast, 30-60k) |
| H3 | `Quán cafe chill ở Phú Quý?` | Café Đảo Gió: 30-80k, cà phê phin, view biển, wifi | Café Đảo Gió (cafe) |
| H4 | `Đi Cát Bà ăn gì đặc sản?` | Phố Hải Sản Bến Bèo: 200-500k, hải sản lồng bè tươi. Bánh Đa Cua Bà Hương: 40-70k, bánh đa cua Hải Phòng chính gốc | Bến Bèo (seafood), Bà Hương (breakfast) |
| H5 | `Quán nào ở Cát Bà phục vụ khách nước ngoài được?` | Nhà Hàng Green Mango: menu song ngữ Anh-Việt, cocktail, nhạc sống buổi tối, 150-350k/người | Green Mango (restaurant) |
| H6 | `Budget ăn uống 1 ngày ở Phú Quý khoảng bao nhiêu?` | Sáng 30-60k (Cô Lan) + Trưa/Tối 150-400k (Bà Tư) + Cafe 30-80k (Đảo Gió) ≈ 210-540k/người/ngày | Tổng hợp price_range |

## J. Di chuyển & Vận chuyển

| # | Câu hỏi | Kỳ vọng | Data tham chiếu |
|---|---------|---------|-----------------|
| J1 | `Khách ở Sài Gòn muốn đi Phú Quý, hướng dẫn di chuyển?` | TP.HCM → Phan Thiết (xe khách 3-4h, 80-120k) → Phú Quý (tàu cao tốc 2.5-3.5h, vé nằm 250-300k) | bus + ferry |
| J2 | `Từ Hà Nội đi Cát Bà thế nào?` | Hà Nội → Hải Phòng (xe khách 2-2.5h, 100-150k) → Cát Bà (phà 45 phút, 80-120k) | bus + ferry |
| J3 | `Di chuyển trên đảo Phú Quý thế nào? Giá thuê xe?` | Thuê xe máy số: 100-150k/ngày, xe tay ga: 150-200k/ngày, di chuyển 5-30 phút tùy điểm | motorbike Phú Quý |
| J4 | `Di chuyển trên đảo Cát Bà? Có xe đạp điện không?` | Xe máy: 120-180k/ngày, xe đạp điện: 80-120k/ngày, di chuyển 5-40 phút tùy điểm | motorbike Cát Bà |
| J5 | `Tổng chi phí di chuyển SG → Phú Quý → về SG khoảng bao nhiêu?` | Ước tính: (80-200k bus + 180-300k tàu) × 2 chiều + thuê xe 100-200k/ngày × 3 ngày ≈ 820-1,600k | Tổng hợp transport |

## K. Lịch trình & Thiết kế trải nghiệm

| # | Câu hỏi | Kỳ vọng | Data tham chiếu |
|---|---------|---------|-----------------|
| K1 | `Gợi ý lịch trình 3N2Đ Phú Quý cho cặp đôi, kèm quán ăn ngon?` | Lịch trình 3 ngày chi tiết + gợi ý Quán Bà Tư, Café Đảo Gió | Template Phú Quý 3N2Đ + dining |
| K2 | `Lịch trình 2N1Đ Cát Bà cho nhóm bạn thích phiêu lưu?` | Ngày 1: Kayak Vịnh Lan Hạ + hải sản Bến Bèo. Ngày 2: VQG Cát Bà + Đảo Khỉ | Template Cát Bà 2N1Đ + attractions |
| K3 | `Khách có 2 trẻ nhỏ, lịch trình Phú Quý nên thế nào?` | Ưu tiên bãi biển an toàn (Bãi Nhỏ nước nông), tránh Hòn Tranh (phải đi thuyền), bữa ăn trẻ em friendly | Tùy chỉnh từ template |
| K4 | `Khách người nước ngoài muốn đi Cát Bà, gợi ý lịch trình + ăn uống?` | Gợi ý Green Mango (menu tiếng Anh), Café Vịnh Lan Hạ, kayak Vịnh Lan Hạ | Green Mango + Vịnh Lan Hạ |

## L. Mùa vụ & Thời điểm

| # | Câu hỏi | Kỳ vọng | Data tham chiếu |
|---|---------|---------|-----------------|
| L1 | `Tháng 3 đi Phú Quý có đẹp không?` | Tháng 3 = đầu mùa cao điểm, biển êm, nắng đẹp. Nên đặt vé tàu sớm | season_info: mùa cao điểm tháng 3-8 |
| L2 | `Tháng 12 nên đi Phú Quý hay Cát Bà?` | Cả hai đều thấp điểm. Phú Quý: gió mạnh, sóng lớn. Cát Bà: lạnh, sương mù. Nên cân nhắc kỹ | season_info cả 2 market |
| L3 | `Thời điểm nào đi Cát Bà đẹp nhất?` | Tháng 5-9 (hè, biển đẹp). Tháng 4 và 10 là mùa trung gian cũng OK | Cát Bà season_info |

## M. Xử lý edge case

| # | Câu hỏi | Kỳ vọng | Verified |
|---|---------|---------|----------|
| M1 | `Combo Nha Trang 3N2Đ view biển?` | Trả lời "chưa có thông tin" Nha Trang + gợi ý thay thế Phú Quý/Cát Bà | ✅ |
| M2 | `đi Cát Bà giá bao nhiêu?` | Hỏi lại: số người, ngày đi, số đêm. Kèm bảng giá tham khảo | ✅ |
| M3 | `Phú Quý có khách sạn 5 sao không?` | Không có trong hệ thống, cao nhất 3.5★ Coastal Escape. Gợi ý thay thế | Không có data 5★ |

## I. Multi-turn Chat (Hội thoại nhiều lượt)

> **Lưu ý:** Đây là tool nội bộ, nhân viên sẽ được training hỏi rõ ràng.
> Các case dưới đây test khả năng AI nhớ context từ câu trước.

### I1. Hỏi giá → Đổi ngày

| Lượt | Câu hỏi | Kỳ vọng |
|------|---------|---------|
| 1 | `Combo 3N2Đ Beachfront Deluxe Phú Quý, 2 người, check-in thứ 3?` | **4,200,000₫** weekday |
| 2 | `Nếu đổi sang check-in thứ 7 thì sao?` | **4,800,000₫** saturday — AI nhớ phòng + combo + số người |

### I2. Hỏi giá → Thêm người

| Lượt | Câu hỏi | Kỳ vọng |
|------|---------|---------|
| 1 | `Phòng Gia Đình Biển Xanh, 3N2Đ weekday, 3 người?` | **3,350,000₫** standard 3 người |
| 2 | `Thêm 1 người nữa thành 4 người thì giá bao nhiêu?` | **3,850,000₫** price_plus1 — AI nhớ phòng + combo + ngày |

### I3. Hỏi phòng → Hỏi lịch trình → Hỏi di chuyển

| Lượt | Câu hỏi | Kỳ vọng |
|------|---------|---------|
| 1 | `Phòng view biển ở Phú Quý cho cặp đôi?` | Gợi ý Beachfront Deluxe CE-DLX |
| 2 | `Lịch trình 3N2Đ cho phòng đó?` | Lịch trình chi tiết dựa trên template Phú Quý 3N2Đ |
| 3 | `Đi từ Sài Gòn ra đó thế nào?` | Hướng dẫn TP.HCM → Phan Thiết → Phú Quý |

### I4. So sánh → Chọn → Báo giá

| Lượt | Câu hỏi | Kỳ vọng |
|------|---------|---------|
| 1 | `So sánh homestay Phú Quý cho 2 người, 3N2Đ weekday?` | Bảng so sánh 4 phòng + giá |
| 2 | `Chọn Biển Xanh, giá cuối tuần thứ 7?` | **3,200,000₫** BX-DBL saturday 3n2d |
| 3 | `Nếu đi 3 người thì sao?` | **3,700,000₫** BX-DBL price_plus1 saturday 3n2d |

### I5. Cát Bà → Chuyển sang Phú Quý

| Lượt | Câu hỏi | Kỳ vọng |
|------|---------|---------|
| 1 | `Giá phòng đôi Lan Hạ Bay Cát Bà, 3N2Đ weekday?` | **2,800,000₫** LH-STD weekday |
| 2 | `Phú Quý có phòng tương đương giá không?` | Gợi ý BX-DBL 2,800,000₫ hoặc HB-STD 2,400,000₫ |

### I6. Tư vấn trọn gói: phòng → ăn → chơi → di chuyển

| Lượt | Câu hỏi | Kỳ vọng |
|------|---------|---------|
| 1 | `Cặp đôi đi Phú Quý 3N2Đ cuối tuần, gợi ý phòng view biển?` | Gợi ý Beachfront Deluxe + báo giá saturday |
| 2 | `Ăn hải sản ở đâu ngon nhất trên đảo?` | Quán Bà Tư: 150-400k/người, hải sản tươi, view biển |
| 3 | `Ngoài biển ra có gì chơi không?` | Lặn Hòn Tranh, Gành Hang, Linh Sơn Tự panorama, café Đảo Gió |
| 4 | `Đi từ Sài Gòn ra đó tổng bao nhiêu tiền?` | Ước tính chi phí di chuyển khứ hồi |

### I7. Khách thay đổi địa điểm giữa chừng

| Lượt | Câu hỏi | Kỳ vọng |
|------|---------|---------|
| 1 | `Khách muốn đi kayak, chỗ nào có?` | Gợi ý Vịnh Lan Hạ Cát Bà: 350-600k/người |
| 2 | `Giá phòng ở đó 2N1Đ cuối tuần 2 người?` | LH-STD saturday: **2,200,000₫** |
| 3 | `Khách đổi ý muốn đi lặn biển thay kayak, chỗ nào?` | Đổi sang Phú Quý: Hòn Tranh lặn san hô 200-300k/người |
| 4 | `Vậy giá phòng Phú Quý 3N2Đ weekday phòng rẻ nhất?` | HB-STD: **2,400,000₫** |

### I8. Hỏi ăn uống liên tục theo bữa

| Lượt | Câu hỏi | Kỳ vọng |
|------|---------|---------|
| 1 | `Ở Cát Bà sáng ăn gì?` | Bánh Đa Cua Bà Hương: 40-70k, bánh đa cua Hải Phòng chính gốc |
| 2 | `Trưa ăn hải sản ở đâu?` | Phố Hải Sản Bến Bèo: 200-500k, hải sản lồng bè |
| 3 | `Chiều uống cafe view đẹp?` | Café Vịnh Lan Hạ: 45-120k, view vịnh, ngoài trời |
| 4 | `Tối muốn đi bar/nhạc sống?` | Green Mango: cocktail, nhạc sống buổi tối, 150-350k |

---

## Bảng giá tham chiếu nhanh

### Phú Quý — Combo 3N2Đ, 2 người tiêu chuẩn

| Cơ sở | Phòng | Weekday | Friday | Saturday | Sunday |
|--------|-------|---------|--------|----------|--------|
| Nhà Nghỉ Hoa Biển | Tiêu Chuẩn (2ng) | 2,400k | 2,550k | 2,700k | 2,550k |
| Nhà Nghỉ Hoa Biển | 3 Người (3ng) | 2,500k | 2,700k | 2,900k | 2,700k |
| Biển Xanh | Đôi View Biển (2ng) | 2,800k | 3,000k | 3,200k | 3,000k |
| Biển Xanh | Gia Đình (3ng) | 3,350k | 3,600k | 3,850k | 3,600k |
| Coastal Escape | Garden View (2ng) | 3,100k | 3,300k | 3,500k | 3,300k |
| Coastal Escape | Beachfront Deluxe (2ng) | 4,200k | 4,500k | 4,800k | 4,500k |

### Cát Bà — Combo 3N2Đ

| Cơ sở | Phòng | Weekday | Friday | Saturday | Sunday |
|--------|-------|---------|--------|----------|--------|
| Lan Hạ Bay | Đôi Tiêu Chuẩn (2ng) | 2,800k | 3,000k | 3,200k | 3,000k |
| Lan Hạ Bay | Gia Đình T3 (3ng) | 3,500k | 3,750k | 4,000k | 3,750k |

---

## Tips cho nhân viên khi hỏi AI

1. **Nêu rõ thông tin:** số người, ngày check-in (hoặc thứ mấy), combo nào, phòng nào
2. **Ví dụ câu hỏi tốt:** `"Combo 3N2Đ Beachfront Deluxe Phú Quý, 2 người, check-in thứ 7"`
3. **Ví dụ câu hỏi kém:** `"giá bao nhiêu?"` — AI phải hỏi lại, tốn thời gian
4. **Khi đổi thông tin:** nói rõ thay đổi gì, VD: `"đổi sang thứ 7"`, `"thêm 1 người"`
5. **Thị trường hỗ trợ:** chỉ có **Phú Quý** và **Cát Bà**, hỏi nơi khác AI sẽ báo chưa có data
