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
  let body = `Ngày ${dateStr} bạn đã chi tiêu:\n`;

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
  body += `Tổng chi: 🔴 -${formatCurrency(totalExpense)}\nTổng thu: 🟢 +${formatCurrency(totalIncome)}\n`;
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
 * Tạo nội dung báo cáo tài chính hàng tháng cho một tháng cụ thể
 */
export function generateMonthlyReport(
  transactions: Transaction[],
  targetMonthDate: Date
): { title: string; body: string } {
  const yyyy = targetMonthDate.getFullYear();
  const monthIdx = targetMonthDate.getMonth(); // 0-11

  const targetStart = new Date(yyyy, monthIdx, 1, 0, 0, 0, 0).getTime();
  const targetEnd = new Date(yyyy, monthIdx + 1, 1, 0, 0, 0, 0).getTime() - 1;

  const prevMonthDate = new Date(yyyy, monthIdx - 1, 1, 0, 0, 0, 0);
  const prevStart = prevMonthDate.getTime();
  const prevEnd = targetStart - 1;

  // Lọc giao dịch của tháng cần báo cáo
  const targetTxs = transactions.filter(tx => tx.timestamp >= targetStart && tx.timestamp <= targetEnd);

  // Lọc giao dịch của tháng trước đó để so sánh
  const prevTxs = transactions.filter(tx => tx.timestamp >= prevStart && tx.timestamp <= prevEnd);

  // Gom nhóm chi tiêu theo danh mục
  const expenses: Record<string, number> = {};
  let totalExpense = 0;
  const incomes: Record<string, number> = {};
  let totalIncome = 0;

  targetTxs.forEach(tx => {
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

  // Tính tổng chi tiêu tháng trước đó
  let prevTotalExpense = 0;
  let hasPrevData = false;
  prevTxs.forEach(tx => {
    if (isFundTransaction(tx)) return;

    hasPrevData = true;
    if (tx.type === "expense") {
      prevTotalExpense += tx.amount;
    }
  });

  const monthStr = `${String(monthIdx + 1).padStart(2, "0")}/${yyyy}`;
  let body = `Trong tháng ${monthStr} bạn đã chi tiêu:\n`;

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
  body += `Tổng chi: 🔴 -${formatCurrency(totalExpense)}\nTổng thu: 🟢 +${formatCurrency(totalIncome)}\n`;
  body += `------------------\n`;
  const prevMonthStr = `${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}/${prevMonthDate.getFullYear()}`;
  if (hasPrevData) {
    const diff = totalExpense - prevTotalExpense;
    if (diff > 0) {
      body += `So với tháng ${prevMonthStr}: Chi tiêu NHIỀU HƠN ${formatCurrency(diff)}`;
    } else if (diff < 0) {
      body += `So với tháng ${prevMonthStr}: Chi tiêu ÍT HƠN ${formatCurrency(Math.abs(diff))}`;
    } else {
      body += `So với tháng ${prevMonthStr}: Chi tiêu BẰNG NHAU`;
    }
  } else {
    // const prevMonthStr = `${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}/${prevMonthDate.getFullYear()}`;
    body += `So với tháng ${prevMonthStr}: không có giao dịch`;
  }

  const title = `Báo cáo tài chính tháng ${monthStr} 📊`;

  return { title, body };
}

/**
 * Tạo nội dung báo cáo tài chính hàng năm cho một năm cụ thể
 */
export function generateYearlyReport(
  transactions: Transaction[],
  targetYear: number
): { title: string; body: string } {
  const targetStart = new Date(targetYear, 0, 1, 0, 0, 0, 0).getTime();
  const targetEnd = new Date(targetYear + 1, 0, 1, 0, 0, 0, 0).getTime() - 1;

  const prevYear = targetYear - 1;
  const prevStart = new Date(prevYear, 0, 1, 0, 0, 0, 0).getTime();
  const prevEnd = targetStart - 1;

  // Lọc giao dịch của năm cần báo cáo
  const targetTxs = transactions.filter(tx => tx.timestamp >= targetStart && tx.timestamp <= targetEnd);

  // Lọc giao dịch của năm trước đó để so sánh
  const prevTxs = transactions.filter(tx => tx.timestamp >= prevStart && tx.timestamp <= prevEnd);

  // Gom nhóm chi tiêu theo danh mục
  const expenses: Record<string, number> = {};
  let totalExpense = 0;
  const incomes: Record<string, number> = {};
  let totalIncome = 0;

  targetTxs.forEach(tx => {
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

  // Tính tổng chi tiêu năm trước đó
  let prevTotalExpense = 0;
  let hasPrevData = false;
  prevTxs.forEach(tx => {
    if (isFundTransaction(tx)) return;

    hasPrevData = true;
    if (tx.type === "expense") {
      prevTotalExpense += tx.amount;
    }
  });

  const yearStr = `${targetYear}`;
  let body = `Trong năm ${yearStr} bạn đã chi tiêu:\n`;

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
  body += `Tổng chi: 🔴 -${formatCurrency(totalExpense)}\nTổng thu: 🟢 +${formatCurrency(totalIncome)}\n`;
  body += `------------------\n`;

  if (hasPrevData) {
    const diff = totalExpense - prevTotalExpense;
    if (diff > 0) {
      body += `So với năm ${prevYear}: Chi tiêu NHIỀU HƠN ${formatCurrency(diff)}`;
    } else if (diff < 0) {
      body += `So với năm ${prevYear}: Chi tiêu ÍT HƠN ${formatCurrency(Math.abs(diff))}`;
    } else {
      body += `So với năm ${prevYear}: Chi tiêu BẰNG NHAU`;
    }
  } else {
    body += `So với năm ${prevYear} không có giao dịch`;
  }

  const title = `Báo cáo tài chính năm ${yearStr} 📊`;

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
  const now = new Date();

  const newHistory: NotificationHistoryItem[] = [];

  // 1. DUYỆT BÁO CÁO NGÀY (từ ngày đầu tiên có giao dịch cho đến ngày hôm qua)
  const startDate = new Date(firstTxDate.getFullYear(), firstTxDate.getMonth(), firstTxDate.getDate(), 0, 0, 0, 0);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);

  for (let d = new Date(startDate.getTime()); d <= yesterday; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDateString(d);
    const { title, body } = generateDailyReport(transactions, d);
    const triggerTime = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 2, 0, 0, 0).getTime();

    newHistory.push({
      id: `history-day-${dateStr.replace(/\//g, "-")}`,
      dateStr,
      triggerTime,
      title,
      body,
      type: 'day'
    });
  }

  // 2. DUYỆT BÁO CÁO THÁNG (từ tháng đầu tiên có giao dịch cho đến tháng trước tháng hiện tại)
  const startMonthDate = new Date(firstTxDate.getFullYear(), firstTxDate.getMonth(), 1, 0, 0, 0, 0);
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);

  for (let m = new Date(startMonthDate.getTime()); m <= prevMonthDate; m.setMonth(m.getMonth() + 1)) {
    const mm = String(m.getMonth() + 1).padStart(2, "0");
    const yyyy = m.getFullYear();
    const monthStr = `${mm}/${yyyy}`;
    const { title, body } = generateMonthlyReport(transactions, m);
    const triggerTime = new Date(m.getFullYear(), m.getMonth() + 1, 1, 2, 0, 0, 0).getTime();

    newHistory.push({
      id: `history-month-${mm}-${yyyy}`,
      dateStr: monthStr,
      triggerTime,
      title,
      body,
      type: 'month'
    });
  }

  // 3. DUYỆT BÁO CÁO NĂM (từ năm đầu tiên có giao dịch cho đến năm trước năm hiện tại)
  const startYearVal = firstTxDate.getFullYear();
  const prevYearVal = now.getFullYear() - 1;

  for (let y = startYearVal; y <= prevYearVal; y++) {
    const yearStr = `${y}`;
    const { title, body } = generateYearlyReport(transactions, y);
    const triggerTime = new Date(y + 1, 0, 1, 2, 0, 0, 0).getTime();

    newHistory.push({
      id: `history-year-${y}`,
      dateStr: yearStr,
      triggerTime,
      title,
      body,
      type: 'year'
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

  // 3. LẬP LỊCH THÔNG BÁO BÁO CÁO THÁNG (2H SÁNG ngày đầu tiên của tháng tiếp theo)
  const nextMonthTrigger = new Date(now.getFullYear(), now.getMonth() + 1, 1, 2, 0, 0, 0);
  const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const monthReport = generateMonthlyReport(transactions, currentMonthDate);
  await scheduleSpecificNotification(nextMonthTrigger, monthReport.title, monthReport.body, { type: 'monthly_report' });

  // 4. LẬP LỊCH THÔNG BÁO BÁO CÁO NĂM (2H SÁNG ngày 01/01 của năm tiếp theo)
  const nextYearTrigger = new Date(now.getFullYear() + 1, 0, 1, 2, 0, 0, 0);
  const currentYearVal = now.getFullYear();
  const yearReport = generateYearlyReport(transactions, currentYearVal);
  await scheduleSpecificNotification(nextYearTrigger, yearReport.title, yearReport.body, { type: 'yearly_report' });

  console.log("Rescheduled smart daily reminders, 2 AM daily reports, month and year reports successfully!");
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
