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
  categoryBudgets?: CategoryBudget[]; // Danh mục chi kèm ngân sách
  customFunds?: CustomFund[]; // Quỹ tùy biến của người dùng
  hasSeenGuide?: boolean;
  inputMethod?: 'keypad' | 'manual';
}
