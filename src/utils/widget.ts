import { NativeModules, Platform } from "react-native";

const { WidgetModule } = NativeModules;

/**
 * Cập nhật thông tin số ngày streak và trạng thái ghi chép hôm nay lên Widget ngoài màn hình điện thoại (Android)
 * @param streakCount Số ngày giữ chuỗi hiện tại
 * @param recordedToday Đã ghi giao dịch hôm nay chưa
 */
export const updateHomeScreenWidget = (streakCount: number, recordedToday: boolean) => {
  if (Platform.OS === "android" && WidgetModule) {
    try {
      WidgetModule.updateWidget(streakCount, recordedToday);
      console.log(`Updated Android Widget: streak=${streakCount}, recordedToday=${recordedToday}`);
    } catch (e) {
      console.error("Failed to update android widget:", e);
    }
  }
};
