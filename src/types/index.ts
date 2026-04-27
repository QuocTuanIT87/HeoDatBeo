export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  categorySnapshot?: string; // Snapshot tên danh mục tại thời điểm tạo giao dịch (YC 6)
  name?: string;            // Tên giao dịch tùy chỉnh (VD: "Nuôi heo béo")
  timestamp: number; 
}

export interface CategoryBudget {
  name: string;      // Tên danh mục chi
  budget: number;    // Số tiền còn lại trong "túi" danh mục
  estimatedEndDate?: number;      // Ngày ước tính tiêu hết (timestamp ms) (YC 4)
  estimatedEndDateSetAt?: number; // Timestamp lần cuối set estimatedEndDate, để cooldown 15 ngày
}

export interface UserProfile {
  name: string;
  initialBalance: number;
  initialBalanceTimestamp: number;
  savingTarget?: number;
  savingTargetTimestamp?: number;
  incomeCategories?: string[];
  categoryBudgets?: CategoryBudget[]; // Danh mục chi kèm ngân sách
  hasSeenGuide?: boolean;
}
