# Heo Đất Béo 🐷

**Heo Đất Béo** là một ứng dụng di động quản lý thu chi cá nhân và tích lũy tiết kiệm thông minh, trực quan và đầy kỷ luật. Lấy cảm hứng từ hình ảnh chú heo đất, ứng dụng giúp bạn ghi chép tài chính nhanh chóng và rèn luyện thói quen tiết kiệm thông qua các quy tắc chặt chẽ.

---

## Tính Năng Chính ✨

### 1. Quản lý Thu/Chi Nhanh Chóng

- 💰 **Ghi nhận tức thì**: Ghi lại các khoản thu nhập và chi tiêu chỉ trong vài giây.
- ⌨ **Bảng mệnh giá thông minh**: Sử dụng các nút mệnh giá tiền phổ biến (10k, 20k, 50k, 100k...) giúp nhập liệu cực nhanh, hạn chế gõ phím.
- 📁 **Danh mục linh hoạt**: Tùy chỉnh danh mục thu nhập và quản lý danh mục chi tiêu theo nhu cầu.

### 2. Hệ thống "Chia Tiền" (Hũ Ngân Sách) 🍯

- 📥 **Phân bổ ngân sách**: Chia tổng số dư của bạn vào các "hũ" chi tiêu khác nhau (Ăn uống, Di chuyển, Nhà cửa...).
- 📊 **Theo dõi tiến độ**: Thanh tiến độ trực quan hiển thị số tiền đã tiêu và số tiền còn lại trong mỗi danh mục.
- 📅 **Ngày dự kiến tiêu hết**: Thiết lập ngày bạn dự tính sẽ dùng hết số tiền trong hũ. Hệ thống có cơ chế "cooldown" (15 ngày) để hạn chế việc thay đổi ngày liên tục, giúp bạn chi tiêu kỷ luật hơn.

### 3. Heo Đất Tiết Kiệm 🐖

- 🎯 **Mục tiêu tiết kiệm**: Thiết lập số tiền mục tiêu bạn muốn tích lũy. Hệ thống khóa quyền sửa mục tiêu trong **30 ngày** để giúp bạn kiên trì.
- 📥 **Nạp Heo**: Nạp tiền từ số dư "Chưa phân bổ" vào Heo Đất.
- 📤 **Rút tiền kỷ luật**:
  - Chỉ được rút tối đa **500.000 đ** mỗi lần.
  - Thời gian giữa 2 lần rút phải cách nhau ít nhất **7 ngày**.
  - Giao diện đếm ngược ngày chờ và câu nói truyền cảm hứng khi đang trong thời gian "cooldown".
- 📜 **Lịch sử nạp/rút**: Xem lại chi tiết lịch sử nuôi heo.

### 4. Thống Kê & Biểu Đồ 📈

- 🥧 **Biểu đồ tròn (Pie Chart)**: Trực quan hóa cơ cấu chi tiêu, tự động nhóm các danh mục nhỏ vào mục "Khác" để biểu đồ luôn rõ ràng.
- 📆 **Bộ lọc đa dạng**: Xem thống kê theo Tháng, Năm hoặc khoảng thời gian tùy chỉnh (Từ ngày - Đến ngày).
- 🔍 **Lọc chi tiết**: Lọc giao dịch theo từng danh mục cụ thể hoặc theo loại Thu/Chi.

### 5. Quản Lý Dữ Liệu & Bảo Mật 🔒

- 💾 **Lưu trữ Offline**: Dữ liệu nằm hoàn toàn trên thiết bị của bạn, không gửi lên server.
- 🔄 **Sao lưu/Phục hồi**: Xuất dữ liệu ra file `.txt` để lưu trữ hoặc nhập lại khi chuyển thiết bị.
- 🧹 **Khôi phục cài đặt gốc**: Xóa toàn bộ dữ liệu và bắt đầu lại từ đầu nếu muốn.

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

---

_Chúc bạn quản lý tài chính hiệu quả và nuôi được những chú Heo Đất thật béo!_ 🐷💕
