import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, UserProfile, CategoryBudget, TransactionDateIndex, NotificationHistoryItem } from '../types';
import { Paths } from 'expo-file-system';
import { readAsStringAsync, writeAsStringAsync } from 'expo-file-system/legacy';

const TRANSACTIONS_KEY = '@transactions';
const USER_PROFILE_KEY = '@userProfile';
const CATEGORY_BUDGETS_KEY = '@categoryBudgets';
const TRANSACTION_DATE_INDEX_KEY = '@transaction_date_index';
const NOTIFICATION_HISTORY_KEY = '@notificationHistory';

let onTransactionChangeCallback: (() => void) | null = null;

export const storage = {
  // Listener for transaction updates
  setTransactionChangeListener(callback: () => void) {
    onTransactionChangeCallback = callback;
  },

  // User Profile
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(USER_PROFILE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error fetching user profile', e);
      return null;
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<boolean> {
    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
      return true;
    } catch (e) {
      console.error('Error saving user profile', e);
      return false;
    }
  },

  async clearUserResetData(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(USER_PROFILE_KEY);
      await AsyncStorage.removeItem(TRANSACTIONS_KEY);
      await AsyncStorage.removeItem(CATEGORY_BUDGETS_KEY);
      await AsyncStorage.removeItem(TRANSACTION_DATE_INDEX_KEY);
      await AsyncStorage.removeItem(NOTIFICATION_HISTORY_KEY);
      return true;
    } catch (e) {
      console.error('Error clearing data', e);
      return false;
    }
  },

  // Transaction Date Index — lưu tháng/năm có giao dịch để lọc nhanh
  async getTransactionDateIndex(): Promise<TransactionDateIndex> {
    try {
      const data = await AsyncStorage.getItem(TRANSACTION_DATE_INDEX_KEY);
      if (data) return JSON.parse(data);
      // Nếu chưa có index (app cũ) → rebuild từ transactions hiện có
      return await this._rebuildTransactionDateIndex();
    } catch (e) {
      console.error('Error fetching transaction date index', e);
      return { months: [], years: [] };
    }
  },

  async _rebuildTransactionDateIndex(): Promise<TransactionDateIndex> {
    try {
      const transactions = await this.getTransactions();
      const monthSet = new Set<string>();
      const yearSet = new Set<number>();
      transactions.forEach(tx => {
        const d = new Date(tx.timestamp);
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthSet.add(m);
        yearSet.add(d.getFullYear());
      });
      const index: TransactionDateIndex = {
        months: Array.from(monthSet).sort().reverse(),
        years: Array.from(yearSet).sort((a, b) => b - a),
      };
      await AsyncStorage.setItem(TRANSACTION_DATE_INDEX_KEY, JSON.stringify(index));
      return index;
    } catch (e) {
      console.error('Error rebuilding transaction date index', e);
      return { months: [], years: [] };
    }
  },

  async _addToTransactionDateIndex(timestamp: number): Promise<void> {
    try {
      const index = await this.getTransactionDateIndex();
      const d = new Date(timestamp);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const year = d.getFullYear();
      let changed = false;
      if (!index.months.includes(month)) {
        index.months = [month, ...index.months].sort().reverse();
        changed = true;
      }
      if (!index.years.includes(year)) {
        index.years = [year, ...index.years].sort((a, b) => b - a);
        changed = true;
      }
      if (changed) {
        await AsyncStorage.setItem(TRANSACTION_DATE_INDEX_KEY, JSON.stringify(index));
      }
    } catch (e) {
      console.error('Error adding to transaction date index', e);
    }
  },

  async _removeFromTransactionDateIndex(deletedTimestamp: number): Promise<void> {
    try {
      // Rebuild từ transactions còn lại sau khi xóa
      await this._rebuildTransactionDateIndex();
    } catch (e) {
      console.error('Error removing from transaction date index', e);
    }
  },

  // Category Budgets — stored separately for quick access
  async getCategoryBudgets(): Promise<CategoryBudget[]> {
    try {
      const data = await AsyncStorage.getItem(CATEGORY_BUDGETS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error fetching category budgets', e);
      return [];
    }
  },

  async saveCategoryBudgets(budgets: CategoryBudget[]): Promise<boolean> {
    try {
      await AsyncStorage.setItem(CATEGORY_BUDGETS_KEY, JSON.stringify(budgets));
      return true;
    } catch (e) {
      console.error('Error saving category budgets', e);
      return false;
    }
  },

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    try {
      const data = await AsyncStorage.getItem(TRANSACTIONS_KEY);
      const parsed = data ? JSON.parse(data) : [];
      // sort descending by timestamp
      return parsed.sort((a: Transaction, b: Transaction) => b.timestamp - a.timestamp);
    } catch (e) {
      console.error('Error fetching transactions', e);
      return [];
    }
  },

  async saveTransaction(transaction: Transaction): Promise<boolean> {
    try {
      const current = await this.getTransactions();
      const updated = [...current, transaction];
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));
      // Cập nhật index tháng/năm
      await this._addToTransactionDateIndex(transaction.timestamp);
      if (onTransactionChangeCallback) {
        onTransactionChangeCallback();
      }
      return true;
    } catch (e) {
      console.error('Error saving transaction', e);
      return false;
    }
  },

  async deleteTransaction(id: string): Promise<boolean> {
    try {
      const current = await this.getTransactions();
      const deleted = current.find(t => t.id === id);
      const updated = current.filter(t => t.id !== id);
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));
      // Rebuild index sau khi xóa (để loại bỏ tháng/năm không còn giao dịch)
      if (deleted) await this._removeFromTransactionDateIndex(deleted.timestamp);
      if (onTransactionChangeCallback) {
        onTransactionChangeCallback();
      }
      return true;
    } catch (e) {
      console.error('Error deleting transaction', e);
      return false;
    }
  },
  
  async updateTransaction(updatedTransaction: Transaction): Promise<boolean> {
      try {
          const current = await this.getTransactions();
          const updated = current.map(t => t.id === updatedTransaction.id ? updatedTransaction : t);
          await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));
          if (onTransactionChangeCallback) {
            onTransactionChangeCallback();
          }
          return true;
      } catch (e) {
          console.error('Error updating transaction', e);
          return false;
      }
  },

  async updateTransactionsBulk(updatedTransactions: Transaction[]): Promise<boolean> {
    try {
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updatedTransactions));
      if (onTransactionChangeCallback) {
        onTransactionChangeCallback();
      }
      return true;
    } catch (e) {
      console.error('Error updating transactions in bulk', e);
      return false;
    }
  },

  // Backup / Restore capabilities
  async exportData(): Promise<string> {
    const profile = await this.getUserProfile();
    const transactions = await this.getTransactions();
    const categoryBudgets = await this.getCategoryBudgets();

    const avatarMap: Record<string, string> = {};

    const processFile = async (uri: string) => {
      if (uri && uri.startsWith('file://')) {
        try {
          const base64 = await readAsStringAsync(uri, { encoding: 'base64' });
          const parts = uri.split('/');
          const fileName = parts[parts.length - 1];
          avatarMap[fileName] = base64;
        } catch (err) {
          console.error("Error reading file for export:", uri, err);
        }
      }
    };

    if (profile) {
      if (profile.avatar) {
        await processFile(profile.avatar);
      }
      if (profile.avatarHistory) {
        for (const uri of profile.avatarHistory) {
          await processFile(uri);
        }
      }
    }

    return JSON.stringify({ profile, transactions, categoryBudgets, avatarMap });
  },

  async importData(jsonData: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonData);
      let profile: UserProfile | null = parsed.profile || null;
      const avatarMap = parsed.avatarMap || {};

      if (profile) {
        const baseDir = Paths.document?.uri || Paths.cache?.uri || "";
        const reconstructFile = async (uri: string): Promise<string> => {
          if (uri && uri.startsWith('file://')) {
            const parts = uri.split('/');
            const fileName = parts[parts.length - 1];
            const base64 = avatarMap[fileName];
            if (base64) {
              try {
                const newUri = `${baseDir}${baseDir.endsWith("/") ? "" : "/"}${fileName}`;
                await writeAsStringAsync(newUri, base64, { encoding: 'base64' });
                return newUri;
              } catch (err) {
                console.error("Error reconstructing avatar file:", err);
              }
            }
          }
          return uri;
        };

        if (profile.avatar) {
          profile.avatar = await reconstructFile(profile.avatar);
        }
        if (profile.avatarHistory) {
          const newHistory: string[] = [];
          for (const uri of profile.avatarHistory) {
            const restoredUri = await reconstructFile(uri);
            newHistory.push(restoredUri);
          }
          profile.avatarHistory = newHistory;
        }

        await this.saveUserProfile(profile);
      }

      if (parsed.transactions) {
        await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(parsed.transactions));
      }
      if (parsed.categoryBudgets) {
        await AsyncStorage.setItem(CATEGORY_BUDGETS_KEY, JSON.stringify(parsed.categoryBudgets));
      }
      // Rebuild index sau khi import
      await this._rebuildTransactionDateIndex();
      if (onTransactionChangeCallback) {
        onTransactionChangeCallback();
      }
      return true;
    } catch (e) {
      console.error('Error importing data', e);
      return false;
    }
  },

  async getNotificationHistory(): Promise<NotificationHistoryItem[]> {
    try {
      const data = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error fetching notification history', e);
      return [];
    }
  },

  async saveNotificationHistory(history: NotificationHistoryItem[]): Promise<boolean> {
    try {
      await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(history));
      return true;
    } catch (e) {
      console.error('Error saving notification history', e);
      return false;
    }
  }
};
