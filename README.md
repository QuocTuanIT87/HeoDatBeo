# Heo Đất Béo 🐷

**Heo Đất Béo** là một ứng dụng di động quản lý thu chi cá nhân và đặc biệt là tích lũy tiết kiệm hàng ngày một cách thông minh, đơn giản và trực quan. Lấy cảm hứng từ hình ảnh chú heo đất tuổi thơ, ứng dụng cung cấp giao diện sinh động với các mệnh giá tiền có sẵn giúp việc ghi nhận giao dịch trở nên nhanh chóng tựa như thao tác "đút tiền vào ống heo".

---

## Tính Năng Chính ✨

1. **Quản lý Thu/Chi Nhanh Chóng:**
   - 💰 Ghi nhận các giao dịch chi tiêu và thu nhập trong vài chạm.
   - ⌨ Bảng chọn mệnh giá tiền cộng dồn thông minh (Được thiết kế highlight và đếm số lần chạm).
   - 📁 Quản lý chi tiết theo từng danh mục (Ăn uống, Xăng cộ, Tiền trọ, Grab, v.v.).

2. **Heo Đất Tiết Kiệm (Mới):**
   - 🎯 Thiết lập mục tiêu tiết kiệm cá nhân (hệ thống khóa thay đổi mục tiêu trong 14 ngày để tăng tính kiên nhẫn).
   - 📥 Nạp/Rút tiền trực tiếp vào Heo Đất, tự động đồng bộ trừ/cộng ngược lại vào Số dư tổng.
   - 📊 Thanh tiến độ hiển thị % hoàn thành mục tiêu trực quan.

3. **Thống Kê Trực Quan:**
   - 📆 Bộ lọc đa dạng thời gian: Hôm nay, Tuần này, Tháng này, Năm nay, Tùy chỉnh (Chọn ngày Từ - Đến).
   - 📝 Phân loại hiển thị theo loại giao dịch (Tất cả, Thu, Chi).
   - 🗑 Hỗ trợ xem lại lịch sử và xóa/quản lý các giao dịch cũ.

4. **Quản Lý Dữ Liệu Offline Bảo Mật:**
   - 🔒 Dữ liệu hoàn toàn lưu trữ trên thiết bị của bạn bằng local storage (AsyncStorage).
   - 🔄 Hỗ trợ sao lưu và phục hồi dữ liệu khi cần gỡ cài đặt hay đổi điện thoại.

---

## Công Nghệ Sử Dụng 🛠️

- **Framework:** React Native (Expo) - Phát triển đa nền tảng iOS & Android nhanh chóng.
- **Ngôn ngữ:** TypeScript - Code chặt chẽ, an toàn với kiểu dữ liệu.
- **Giao diện & Thành phần:** React Navigation (Botttom Tabs & Stack), Lucide-React-Native (Icons), @react-native-community/datetimepicker.
- **Lưu trữ:** @react-native-async-storage/async-storage.
- **Kiến trúc State:** State được quản lý cục bộ tại các Screen kết hợp API giao tiếp qua các hàm asynchrone của layer Storage.

---

## Hướng Dẫn Cài Đặt (Cho Developer) 🚀

1. **Yêu cầu hệ thống:**
   - [Node.js](https://nodejs.org/en/) bản LTS mới nhất.
   - Điện thoại cài sẵn ứng dụng [Expo Go](https://expo.dev/client) hoặc trình giả lập (Android Emulator / iOS Simulator).

2. **Cách chạy dự án:**
   ```bash
   # Clone repository (nếu có) hoặc tải mã nguồn về máy.

   # 1. Di chuyển vào thư mục dự án
   cd HeoDatBeo

   # 2. Cài đặt các thư viện cần thiết
   npm install
   # Hoặc nếu dùng yarn: yarn install

   # 3. Mở ứng dụng (Khởi động Expo Server)
   npx expo start
   ```
   **Lưu ý:** Quét mã QR hiện trên terminal bằng camera (trên iOS) hoặc bằng app Expo Go (trên Android) để trải nghiệm trực tiếp app trên điện thoại.

---

## Định Hướng & Hứa Hẹn Các Chức Năng Tiếp Theo 🎯

- [ ]  **Chỉnh sửa giao dịch (Edit Mode):** Sẽ không chỉ có nút xóa, mà bạn sẽ có thể sửa lại thông tin, số tiền và ngày giờ của mọi giao dịch.
- [ ]  **Biểu đồ Thống Kê (Charts):** Nâng cấp màn hình thống kê bằng các biểu đồ tròn (Pie Charts) và biểu đồ cột để thấy thị phần chi tiêu theo các danh mục trực quan và sặc sỡ hơn.
- [ ]  **Thông báo nhắc nhở:** Tính năng tạo thông báo nhắc nhở nạp tiền vào ống heo định kỳ (ví dụ: mỗi 8h tối hằng ngày).
- [ ]  **Giao diện Dark Mode:** Hỗ trợ giao diện nền tối bảo vệ mắt và tiết kiệm pin.

---
*Cảm ơn bạn đã sử dụng và đóng góp cho **Heo Đất Béo**! Để mỗi ngày trôi qua, Heo nhà bạn lại béo thêm một chút!* 🐷💕
