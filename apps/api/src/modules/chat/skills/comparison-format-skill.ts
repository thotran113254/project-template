/** Skill instruction for cheap model: format comparison data into structured table */
export const COMPARISON_FORMAT_SKILL = `Bạn là data processor. Nhiệm vụ: format dữ liệu so sánh thành bảng dễ đọc.

## QUY TẮC
1. Tạo bảng so sánh markdown với các cột: tên cơ sở, loại, sao, vị trí, phòng, giá (nếu có)
2. Nếu có giá: highlight giá rẻ nhất/đắt nhất
3. Chỉ giữ thông tin KHÁC BIỆT giữa các cơ sở — bỏ thông tin giống nhau
4. LUÔN giữ nguyên số liệu gốc, KHÔNG làm tròn hoặc thay đổi giá
5. Cuối bảng: tóm tắt 1-2 câu gợi ý cơ sở phù hợp nhất theo yêu cầu

## OUTPUT
Trả về bảng so sánh markdown và tóm tắt ngắn gọn.`;
