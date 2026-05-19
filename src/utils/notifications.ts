import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { storage } from "../store/storage";
import { NotificationHistoryItem, Transaction } from "../types";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === "granted";
}

export function formatDateString(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString("vi-VN") + " đ";
}

export function isFundTransaction(tx: Transaction): boolean {
  const cat = tx.categorySnapshot || tx.category;
  if (cat === "Tiết kiệm" || cat === "Rút tiết kiệm") return true;
  if (cat.startsWith("Xóa quỹ")) return true;
  if (tx.name && (tx.name.startsWith("Nạp vào ") || tx.name.startsWith("Rút từ "))) return true;
  return false;
}

/**
 * Tạo nội dung báo cáo tài chính hàng ngày cho một ngày cụ thể
 */
export function generateDailyReport(
  transactions: Transaction[],
  targetDate: Date
): { title: string; body: string } {
  const targetStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0).getTime();
  const targetEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999).getTime();

  const prevDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() - 1);
  const prevStart = new Date(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate(), 0, 0, 0, 0).getTime();
  const prevEnd = new Date(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate(), 23, 59, 59, 999).getTime();

  // Lọc giao dịch của ngày cần báo cáo
  const targetTxs = transactions.filter(tx => tx.timestamp >= targetStart && tx.timestamp <= targetEnd);
  
  // Lọc giao dịch của ngày trước đó để so sánh
  const prevTxs = transactions.filter(tx => tx.timestamp >= prevStart && tx.timestamp <= prevEnd);

  // Gom nhóm chi tiêu theo danh mục
  const expenses: Record<string, number> = {};
  let totalExpense = 0;
  const incomes: Record<string, number> = {};
  let totalIncome = 0;

  targetTxs.forEach(tx => {
    // Loại trừ các giao dịch liên quan đến Quỹ (nạp, rút, xóa quỹ, tiết kiệm)
    if (isFundTransaction(tx)) return;

    const cat = tx.categorySnapshot || tx.category;
    if (tx.type === "expense") {
      expenses[cat] = (expenses[cat] || 0) + tx.amount;
      totalExpense += tx.amount;
    } else if (tx.type === "income") {
      incomes[cat] = (incomes[cat] || 0) + tx.amount;
      totalIncome += tx.amount;
    }
  });

  // Tính tổng chi tiêu ngày trước đó
  let prevTotalExpense = 0;
  let hasPrevData = false;
  prevTxs.forEach(tx => {
    if (isFundTransaction(tx)) return;

    hasPrevData = true;
    if (tx.type === "expense") {
      prevTotalExpense += tx.amount;
    }
  });

  const dateStr = formatDateString(targetDate);
  let body = `Hôm qua (ngày ${dateStr}) bạn đã chi tiêu:\n`;
  
  if (totalExpense === 0) {
    body += "Không có chi tiêu\n";
  } else {
    Object.entries(expenses).forEach(([cat, amt]) => {
      body += `- ${cat}: 🔴 -${formatCurrency(amt)}\n`;
    });
  }

  body += `\nBạn đã thu:\n`;
  if (totalIncome === 0) {
    body += "Không có thu nhập\n";
  } else {
    Object.entries(incomes).forEach(([cat, amt]) => {
      body += `- ${cat}: 🟢 +${formatCurrency(amt)}\n`;
    });
  }

  body += `\n------------------\n`;
  body += `Tổng chi: 🔴 -${formatCurrency(totalExpense)} | Tổng thu: 🟢 +${formatCurrency(totalIncome)}\n`;
  body += `------------------\n`;

  if (hasPrevData) {
    const diff = totalExpense - prevTotalExpense;
    if (diff > 0) {
      body += `So với ngày trước: Chi tiêu NHIỀU HƠN ${formatCurrency(diff)}`;
    } else if (diff < 0) {
      body += `So với ngày trước: Chi tiêu ÍT HƠN ${formatCurrency(Math.abs(diff))}`;
    } else {
      body += `So với ngày trước: Chi tiêu BẰNG NHAU`;
    }
  } else {
    const prevDateStr = formatDateString(prevDate);
    body += `So với ngày trước: ngày ${prevDateStr} không có giao dịch`;
  }

  const title = `Báo cáo tài chính ngày ${dateStr} 📊`;

  return { title, body };
}

/**
 * Tự động đồng bộ và làm mới toàn bộ lịch sử thông báo vào bộ nhớ đệm AsyncStorage
 */
export async function syncNotificationHistory(transactions: Transaction[]) {
  if (transactions.length === 0) return;

  // Sắp xếp transactions tăng dần theo thời gian để tìm ngày đầu tiên
  const sortedTxs = [...transactions].sort((a, b) => a.timestamp - b.timestamp);
  const firstTxDate = new Date(sortedTxs[0].timestamp);
  const startDate = new Date(firstTxDate.getFullYear(), firstTxDate.getMonth(), firstTxDate.getDate(), 0, 0, 0, 0);

  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);

  const newHistory: NotificationHistoryItem[] = [];

  // Duyệt qua từng ngày từ ngày đầu tiên có giao dịch cho đến ngày hôm qua
  for (let d = new Date(startDate.getTime()); d <= yesterday; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDateString(d);
    const { title, body } = generateDailyReport(transactions, d);
    const triggerTime = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 2, 0, 0, 0).getTime();
    
    newHistory.push({
      id: `history-${dateStr.replace(/\//g, "-")}`,
      dateStr,
      triggerTime,
      title,
      body,
    });
  }

  // Sắp xếp lịch sử giảm dần theo thời gian kích hoạt để hiển thị mới nhất lên đầu
  newHistory.sort((a, b) => b.triggerTime - a.triggerTime);
  await storage.saveNotificationHistory(newHistory);
  console.log("Synced and refreshed notification history successfully!");
}

/**
 * Lập lịch thông báo thông minh nhắc nhở ghi giao dịch hàng ngày.
 */
export async function scheduleDailyReminder() {
  const hasPermission = await registerForPushNotificationsAsync();
  if (!hasPermission) {
    console.log("Notification permission not granted");
    return;
  }

  // Hủy toàn bộ lịch nhắc nhở cũ để sắp xếp lại chính xác
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Lấy danh sách giao dịch từ bộ nhớ để kiểm tra
  const transactions = await storage.getTransactions();

  // Đồng bộ lịch sử báo cáo ngày hôm qua vào bộ nhớ
  await syncNotificationHistory(transactions);
  
  // Xác định khoảng thời gian của ngày hôm nay
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  const hasExpenseToday = transactions.some((tx) => {
    return (
      tx.type === "expense" &&
      tx.timestamp >= startOfToday.getTime() &&
      tx.timestamp <= endOfToday.getTime()
    );
  });

  const currentHour = now.getHours();

  // 1. LẬP LỊCH THÔNG BÁO NHẮC GHI GIAO DỊCH (22H & 23H) cho 7 ngày cuốn chiếu
  for (let i = 0; i < 7; i++) {
    const targetDate22 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 22, 0, 0, 0);
    const targetDate23 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 23, 0, 0, 0);

    if (i === 0) {
      if (hasExpenseToday) {
        continue;
      }
      if (currentHour < 22) {
        await scheduleSpecificNotification(
          targetDate22,
          "Ghi giao dịch hôm nay 🐷",
          "Hôm nay bạn chưa ghi nhận khoản chi tiêu nào. Ghi lại ngay để Heo Đất nhắc bạn nhé!",
          { type: 'reminder' }
        );
        await scheduleSpecificNotification(
          targetDate23,
          "Nhắc nhở muộn 🐷",
          "Đã 23h rồi, hãy dành ra 30 giây để ghi chép các giao dịch chi tiêu hôm nay nha!",
          { type: 'reminder' }
        );
      } else if (currentHour === 22) {
        await scheduleSpecificNotification(
          targetDate23,
          "Nhắc nhở muộn 🐷",
          "Đã 23h rồi, hãy dành ra 30 giây để ghi chép các giao dịch chi tiêu hôm nay nha!",
          { type: 'reminder' }
        );
      }
    } else {
      await scheduleSpecificNotification(
        targetDate22,
        "Ghi giao dịch hôm nay 🐷",
        "Hôm nay bạn chưa ghi nhận khoản chi tiêu nào. Ghi lại ngay để Heo Đất nhắc bạn nhé!",
        { type: 'reminder' }
      );
      await scheduleSpecificNotification(
        targetDate23,
        "Nhắc nhở muộn 🐷",
        "Đã 23h rồi, hãy dành ra 30 giây để ghi chép các giao dịch chi tiêu hôm nay nha!",
        { type: 'reminder' }
      );
    }
  }

  // 2. LẬP LỊCH THÔNG BÁO BÁO CÁO TÀI CHÍNH HÀNG NGÀY (2H SÁNG) cho 7 ngày cuốn chiếu
  for (let i = 1; i <= 7; i++) {
    // Thời điểm kích hoạt lúc 2:00 AM ngày thứ i trong tương lai
    const triggerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 2, 0, 0, 0);
    
    // Ngày được thống kê (ngày hôm trước của triggerDate)
    const reportDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i - 1, 0, 0, 0, 0);

    const { title, body } = generateDailyReport(transactions, reportDate);

    await scheduleSpecificNotification(triggerDate, title, body, { type: 'daily_report' });
  }

  console.log("Rescheduled smart daily reminders & 2 AM daily reports successfully!");
}

async function scheduleSpecificNotification(date: Date, title: string, body: string, data?: Record<string, any>) {
  if (date.getTime() > Date.now()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: date.getTime(),
      },
    });
  }
}

export async function scheduleTestNotification() {
  const hasPermission = await registerForPushNotificationsAsync();
  if (!hasPermission) {
    console.log("Notification permission not granted");
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Thông báo thử nghiệm 🐷",
      body: "Đây là thông báo test kiểm tra tính năng hoạt động ngay lập tức!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
  console.log("Scheduled test notification in 2 seconds successfully!");
}

// Lắng nghe sự thay đổi của các giao dịch trong storage để cập nhật lịch thông minh tức thì!
storage.setTransactionChangeListener(() => {
  scheduleDailyReminder();
});
