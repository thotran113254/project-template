# AI Trợ Lý Sale - Hướng Dẫn Test

**Cập nhật**: 2026-03-17 | **Dữ liệu**: 6 thị trường, 16 cơ sở, 396 mức giá

> **Bối cảnh**: Đây là chatbot NỘI BỘ cho nhân viên sale. AI giúp sale tra cứu nhanh giá phòng, thông tin thị trường, và soạn nội dung tư vấn khách hàng.

---

## Thị Trường Trong Hệ Thống

| Thị trường | Vùng | Phân khúc chính | Cơ sở |
|---|---|---|---|
| Đà Nẵng | Trung | Resort 4★, hotel 3.5★, homestay | 3 |
| Nha Trang | Trung | Hotel 4★, resort 3.5★, hostel | 3 |
| Phú Quốc | Nam | Resort 4★, hotel 3.5★, homestay | 3 |
| Phú Quý | Nam | Homestay 3-3.5★, nhà nghỉ 2★ | 3 |
| Cát Bà | Bắc | Homestay 3.5★, hotel 3★ | 2 |
| Sa Pa | Bắc | Lodge 3.5★, homestay 2.5★ | 2 |

---

## Nhóm 1: Báo Giá Nhanh

> Sale nhận yêu cầu từ khách → hỏi AI lấy giá → gửi khách.

| # | Sale hỏi AI | AI cần trả lời |
|---|---|---|
| 1.1 | "Khách hỏi giá Đà Nẵng cuối tuần 2 người" | Bảng giá T7 tất cả phòng ĐN, format gửi khách được |
| 1.2 | "Báo giá Phú Quốc 3N2Đ cho cặp đôi" | Giá combo 3N2Đ các resort/hotel PQ, gợi ý phòng phù hợp cặp đôi |
| 1.3 | "Khách muốn phòng gia đình 4 người Nha Trang T7" | Lọc phòng capacity ≥4, giá T7, gợi ý Family Cottage |
| 1.4 | "Bảng giá tất cả phòng Phú Quý thứ 7" | Danh sách đầy đủ 3 cơ sở, tất cả phòng, giá T7 |
| 1.5 | "Giá ngày thường vs cuối tuần Cát Bà?" | Bảng so sánh weekday vs saturday cùng phòng |
| 1.6 | "Khách budget 2 triệu/đêm, Đà Nẵng có gì?" | Lọc phòng ≤2tr, gợi ý + upsell phòng tốt hơn chênh ít |

---

## Nhóm 2: Tư Vấn Khách Đang Phân Vân

> Khách chưa chốt điểm đến → sale cần AI gợi ý để thuyết phục.

| # | Sale hỏi AI | AI cần trả lời |
|---|---|---|
| 2.1 | "Khách phân vân Đà Nẵng hay Nha Trang, tư vấn giúp" | So sánh: giá, điểm chơi, di chuyển, phù hợp ai |
| 2.2 | "Cặp đôi honeymoon, nên gợi ý đâu?" | Phú Quốc (resort 4★) hoặc Đà Nẵng (Mỹ Khê), có giá kèm |
| 2.3 | "Nhóm 4 bạn budget thấp muốn đi biển" | Phú Quý hoặc Cát Bà (giá thấp nhất), phòng 3-4 người |
| 2.4 | "Gia đình có trẻ nhỏ nên đi đâu an toàn?" | Gợi ý thị trường + cơ sở phù hợp, lưu ý an toàn |
| 2.5 | "Khách muốn trải nghiệm núi, không đi biển" | Sa Pa: lodge, trekking, ruộng bậc thang |

---

## Nhóm 3: Soạn Tin Nhắn Gửi Khách

> Sale cần AI soạn sẵn nội dung để copy-paste gửi khách qua Zalo/Facebook.

| # | Sale hỏi AI | AI cần trả lời |
|---|---|---|
| 3.1 | "Soạn tin nhắn báo giá Đà Nẵng 2 người T7 cho khách" | Tin nhắn hoàn chỉnh: chào hỏi + bảng giá + gợi ý |
| 3.2 | "Khách hỏi Phú Quốc có gì chơi, soạn giúp" | Tin nhắn: điểm tham quan + ẩm thực + tip di chuyển |
| 3.3 | "Soạn lịch trình 3 ngày Sa Pa gửi khách gia đình" | Lịch trình chi tiết theo ngày, có giờ + chi phí |
| 3.4 | "Khách hỏi cách đi Cát Bà từ Hà Nội, trả lời giúp" | Hướng dẫn chi tiết: xe + phà + thời gian + giá vé |

---

## Nhóm 4: Nghiệp Vụ Sale

> Sale cần thông tin chuyên sâu để xử lý tình huống.

| # | Sale hỏi AI | AI cần trả lời |
|---|---|---|
| 4.1 | "Chính sách trẻ em tính giá thế nào?" | Bảng: dưới 3 tuổi miễn phí, 3-6 tuổi 50%, 7-11 tuổi 75% |
| 4.2 | "Phụ thu thêm người bao nhiêu?" | 200k/người/đêm khi vượt capacity tiêu chuẩn |
| 4.3 | "Mùa cao điểm Phú Quốc là khi nào? Giá tăng bao nhiêu?" | Tháng 11-4, tăng 30-50%, lưu ý hold phòng sớm |
| 4.4 | "Đối thủ cạnh tranh chính ở Đà Nẵng?" | Danh sách đối thủ + điểm mạnh/yếu + kênh marketing |
| 4.5 | "Khách hàng mục tiêu Nha Trang là ai?" | Phân khúc: cặp đôi, nhóm bạn, gia đình + đặc điểm |

---

## Nhóm 5: Xử Lý Tình Huống

> Kiểm tra AI phản ứng đúng với các case đặc biệt.

| # | Sale hỏi AI | AI cần làm |
|---|---|---|
| 5.1 | "Giá phòng Đà Lạt?" | Báo chưa có trong hệ thống, gợi ý thị trường tương tự (Sa Pa) |
| 5.2 | "Đặt phòng cho khách" | Hướng dẫn quy trình đặt, AI không đặt trực tiếp |
| 5.3 | "Khách muốn đi nhưng chưa biết đi đâu" | Hỏi lại: budget, số người, thời gian, sở thích (biển/núi) |
| 5.4 | "Giá phòng" (không nói thị trường) | Hỏi lại: thị trường nào, mấy người, ngày nào |
| 5.5 | "Thời tiết Nha Trang tháng 3 thế nào?" | Trả từ dữ liệu weatherInfo, gợi ý mùa phù hợp |

---

## Checklist Nghiệm Thu

### Chất lượng trả lời
- [ ] Giọng văn = trợ lý nội bộ cho sale (không phải chatbot du lịch cho khách)
- [ ] Giá chính xác từ dữ liệu, KHÔNG bịa số
- [ ] Format bảng giá rõ ràng, dễ copy gửi khách
- [ ] Ghi rõ loại combo + loại ngày + số người khi quote giá
- [ ] Gợi ý upsell khi phù hợp

### Hành vi AI
- [ ] Gọi tool tra dữ liệu trước khi trả lời (thấy animation "Đang tra cứu...")
- [ ] Hỏi lại khi thiếu thông tin (thị trường, số người, ngày)
- [ ] Báo rõ "chưa có trong hệ thống" khi không tìm thấy
- [ ] So sánh thị trường dùng số liệu thật cả 2 bên

### Hiển thị
- [ ] Token usage hiển thị sau mỗi tin nhắn (model + chi phí)
- [ ] Suggestion chips phù hợp ngữ cảnh sale
- [ ] Loading indicator khi đang tra cứu
