export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  timestamp: number; 
}

export interface UserProfile {
  name: string;
  initialBalance: number;
  initialBalanceTimestamp: number;
  savingTarget?: number;
  savingTargetTimestamp?: number;
}
