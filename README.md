# Heo Đất Béo 🐷

**Heo Đất Béo** là một ứng dụng di động quản lý thu chi cá nhân và tích lũy tiết kiệm thông minh, trực quan và đầy kỷ luật. Lấy cảm hứng từ hình ảnh chú heo đất, ứng dụng giúp bạn ghi chép tài chính nhanh chóng và rèn luyện thói quen tiết kiệm thông qua các quy tắc chặt chẽ.

---

## Tính Năng Chính ✨

### 1. Quản lý Thu/Chi Nhanh Chóng

- 💰 **Ghi nhận tức thì**: Ghi lại các khoản thu nhập và chi tiêu chỉ trong vài giây.
- ⌨ **Bảng mệnh giá thông minh**: Sử dụng các nút mệnh giá tiền phổ biến (10k, 20k, 50k, 100k...) giúp nhập liệu cực nhanh, hạn chế gõ phím.
- 📁 **Danh mục linh hoạt**: Tùy chỉnh danh mục thu nhập và quản lý danh mục chi tiêu theo nhu cầu.
- ⏱️ **Sửa lỗi nhanh**: Cho phép xóa giao dịch trong vòng **5 phút** đầu tiên để đảm bảo tính trung thực của sổ sách.

### 2. Hệ thống "Chia Tiền" (Hũ Ngân Sách) 🍯

- 📥 **Phân bổ ngân sách**: Chia tổng số dư của bạn vào các "hũ" chi tiêu khác nhau (Ăn uống, Di chuyển, Nhà cửa...).
- 📊 **Theo dõi tiến độ**: Thanh tiến độ trực quan hiển thị số tiền đã tiêu và số tiền còn lại trong mỗi danh mục.
- 📅 **Kỷ luật ngân sách**: Thiết lập ngày dự kiến tiêu hết để tự cân đối chi tiêu. Cơ chế "cooldown" hạn chế thay đổi kế hoạch liên tục.

### 3. Heo Đất Tiết Kiệm Năm 🐖

- 📅 **Mục tiêu theo năm**: Thiết lập mục tiêu tích lũy cho từng năm. Khi hết năm, hệ thống tự động tổng kết và lưu vào lịch sử để bạn bắt đầu chặng đường mới.
- 🔒 **Khóa mục tiêu**: Hệ thống khóa quyền sửa mục tiêu trong **30 ngày** để giúp bạn kiên trì với kế hoạch đã đặt ra.
- 📤 **Rút tiền kỷ luật**:
  - Hạn mức: Chỉ được rút tối đa **500.000 đ** mỗi lần.
  - Giãn cách: Thời gian giữa 2 lần rút ít nhất **7 ngày**.
  - Giao diện đếm ngược ngày chờ trực quan.
- 📜 **Lịch sử tiết kiệm nâng cao**: 
  - **Tab Mục tiêu**: Xem lại kết quả tiết kiệm của các năm trước (Mục tiêu vs Thực tế).
  - **Tab Nhật ký**: Theo dõi chi tiết từng lần nạp/rút trong năm hiện tại.

### 4. Thống Kê & Biểu Đồ Chuyên Sâu 📈

- 🥧 **Biểu đồ tròn (Pie Chart)**: Trực quan hóa cơ cấu chi tiêu.
- 🔍 **Chi tiết theo ghi chú**: Chạm vào từng phần của biểu đồ để xem chi tiết các khoản chi dựa trên ghi chú (ví dụ: trong mục "Ăn uống" bạn đã chi cho "Ăn sáng" bao nhiêu, "Cơm trưa" bao nhiêu).
- 📆 **Bộ lọc linh hoạt**: Xem thống kê theo Ngày, Tháng (có chọn tháng), Năm hoặc khoảng thời gian tùy chỉnh.

### 5. Trải Nghiệm Người Dùng & Hướng Dẫn 📖

- 👋 **Chào mừng người mới**: Modal hướng dẫn xuất hiện ngay lần đầu sử dụng giúp bạn nắm bắt triết lý quản lý tài chính của ứng dụng.
- 📚 **Trang hướng dẫn chi tiết**: Giải thích cách hoạt động của dòng tiền từ "Chưa phân bổ" đến các "Hũ ngân sách" và "Heo đất".

---

## Công Nghệ Sử Dụng 🛠️

- **Framework**: React Native (Expo).
- **Ngôn ngữ**: TypeScript.
- **Icons**: Lucide-React-Native.
- **Charts**: React Native SVG (Custom Pie Chart) & Gifted Charts.
- **Storage**: AsyncStorage cho dữ liệu cục bộ.

---

## Hướng Dẫn Cài Đặt (Cho Developer) 🚀

1. **Yêu cầu hệ thống**: Node.js LTS, Expo Go app trên điện thoại.
2. **Cách chạy**:
   ```bash
   npm install
   npx expo start
   ```

---

## Định Hướng Phát Triển 🎯

- [ ] **Thông báo nhắc nhở**: Nhắc nhở nuôi heo vào khung giờ cố định mỗi ngày.
- [ ] **Giao diện Dark Mode**: Hỗ trợ nền tối.
- [ ] **Xuất báo cáo PDF**: Xuất lịch sử chi tiêu năm ra file PDF đẹp mắt.

---

_Chúc bạn quản lý tài chính hiệu quả và nuôi được những chú Heo Đất thật béo!_ 🐷💕
