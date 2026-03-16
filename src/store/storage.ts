import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, UserProfile } from '../types';

const TRANSACTIONS_KEY = '@transactions';
const USER_PROFILE_KEY = '@userProfile';

export const storage = {
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
      return true;
    } catch (e) {
      console.error('Error clearing data', e);
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
      return true;
    } catch (e) {
      console.error('Error saving transaction', e);
      return false;
    }
  },

  async deleteTransaction(id: string): Promise<boolean> {
    try {
      const current = await this.getTransactions();
      const updated = current.filter(t => t.id !== id);
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));
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
          return true;
      } catch (e) {
          console.error('Error updating transaction', e);
          return false;
      }
  },

  // Backup / Restore capabilities
  async exportData(): Promise<string> {
    const profile = await this.getUserProfile();
    const transactions = await this.getTransactions();
    return JSON.stringify({ profile, transactions });
  },

  async importData(jsonData: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.profile) {
        await this.saveUserProfile(parsed.profile);
      }
      if (parsed.transactions) {
        await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(parsed.transactions));
      }
      return true;
    } catch (e) {
      console.error('Error importing data', e);
      return false;
    }
  }
};
