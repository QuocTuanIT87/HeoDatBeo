export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  categorySnapshot?: string; // Snapshot tên danh mục tại thời điểm tạo giao dịch (YC 6)
  name?: string;            // Tên giao dịch tùy chỉnh (VD: "Nuôi heo béo")
  note?: string;            // Ghi chú thêm cho giao dịch
  timestamp: number;
}

export interface CategoryBudget {
  name: string;      // Tên danh mục chi
  budget: number;    // Số tiền còn lại trong "túi" danh mục
  spent?: number;    // Số tiền đã tiêu (được cache để tối ưu hiệu suất)
  estimatedEndDate?: number;      // Ngày ước tính tiêu hết (timestamp ms) (YC 4)
  estimatedEndDateSetAt?: number; // Timestamp lần cuối set estimatedEndDate, để cooldown 15 ngày
  type?: 'recharge' | 'direct';   // Loại danh mục: nạp tiền để chi hoặc không cần nạp
  icon?: string;     // Key biểu tượng từ assets/expense_icon
}

// Index tháng/năm có giao dịch — dùng để hiển thị modal lọc nhanh mà không scan toàn bộ transactions
export interface TransactionDateIndex {
  months: string[];  // format "YYYY-MM", e.g. "2026-04"
  years: number[];   // e.g. [2025, 2026]
}

export interface SavingHistoryItem {
  year: number;
  target: number;
  achieved: number;
  timestamp: number;
}

export interface CustomFund {
  id: string;
  name: string;
  balance: number;
  icon?: string;
}

export interface UserProfile {
  name: string;
  initialBalance: number;
  initialBalanceTimestamp: number;
  savingTarget?: number;
  savingTargetTimestamp?: number;
  savingYear?: number; // Năm của mục tiêu hiện tại (YC Mới)
  savingHistory?: SavingHistoryItem[]; // Lịch sử tiết kiệm các năm trước
  incomeCategories?: string[];
  incomeCategoryIcons?: Record<string, string>; // Mapping tên danh mục thu -> tên icon (YC Mới)
  categoryBudgets?: CategoryBudget[]; // Danh mục chi kèm ngân sách
  customFunds?: CustomFund[]; // Quỹ tùy biến của người dùng
  spendingFundIcon?: string; // Icon cho Quỹ Tiêu Sài (Spending)
  savingFundIcon?: string; // Icon cho Quỹ Tiết Kiệm (Saving)
  hasSeenGuide?: boolean;
  inputMethod?: 'keypad' | 'manual';
  avatar?: string;
  nickname?: string;
  bio?: string;
  job?: string;
  education?: string;
  hobby?: string;
  birthday?: string;
  gender?: string;
  joinDate?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
  instagram?: string;
  thread?: string;
  streakCount?: number;           // Số ngày giữ chuỗi hiện tại
  lastStreakTimestamp?: number;   // Timestamp ms của lần gần nhất được ghi nhận giữ chuỗi
  streakRecoveriesCount?: number;     // Số lần khôi phục chuỗi trong tháng hiện tại
  lastRecoveryMonthYear?: string;     // Tháng/Năm khôi phục gần nhất (dạng "MM/YYYY")
  avatarHistory?: string[];           // Lịch sử đường dẫn ảnh đại diện đã dùng (tối đa 10 ảnh)
  mascot?: string;                    // Linh vật hiện tại được chọn (YC Mới)
  mascotLastChanged?: number;         // Timestamp ms lần cuối đổi linh vật
}

export interface NotificationHistoryItem {
  id: string;
  dateStr: string;      // The date reported (e.g. "18/05/2026")
  triggerTime: number;  // Timestamp of the 2:00 AM trigger time (e.g. 19/05/2026 02:00:00)
  title: string;
  body: string;
  type?: 'day' | 'month' | 'year';
}
