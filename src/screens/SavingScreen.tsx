import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Modal } from 'react-native';
import { PiggyBank, Edit2, Info } from 'lucide-react-native';
import { storage } from '../store/storage';
import { Transaction, UserProfile } from '../types';
import { formatCurrency } from '../utils/format';
import Keypad from '../components/Keypad';
import { useIsFocused } from '@react-navigation/native';

const SavingScreen = () => {
  const isFocused = useIsFocused();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [savingBalance, setSavingBalance] = useState<number>(0);

  const [type, setType] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState<number>(0);

  // Target editing
  const [targetInput, setTargetInput] = useState<string>('');
  const [isEditingTarget, setIsEditingTarget] = useState(false);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    const p = await storage.getUserProfile();
    setProfile(p);
    
    if (p) {
      const transactions = await storage.getTransactions();
      const validTransactions = transactions.filter(t => t.timestamp >= p.initialBalanceTimestamp);
      
      let calcTotal = p.initialBalance;
      let calcSaving = 0;

      validTransactions.forEach(t => {
        // total balance calculation
        if (t.type === 'income') calcTotal += t.amount;
        else if (t.type === 'expense') calcTotal -= t.amount;

        // saving calculation
        if (t.category === 'Tiết kiệm') {
          if (t.type === 'expense') calcSaving += t.amount; // Deposit to savings = expense from total
          else if (t.type === 'income') calcSaving -= t.amount; // Withdraw from savings = income to total
        }
      });

      setTotalBalance(calcTotal);
      setSavingBalance(calcSaving);
      
      if (p.savingTarget) {
        setTargetInput(formatMoneyInput(p.savingTarget.toString()));
      }
    }
  };

  const formatMoneyInput = (text: string) => {
    const numericValue = text.replace(/[^0-9-]/g, '');
    if (!numericValue) return '';
    return parseInt(numericValue, 10).toLocaleString('vi-VN');
  };

  const handleAddAmount = (val: number) => {
    setAmount(prev => prev + val);
  };

  const handleClearAmount = () => {
    setAmount(0);
  };

  const canEditTarget = () => {
    if (!profile?.savingTargetTimestamp) return true;
    const days14 = 14 * 24 * 60 * 60 * 1000;
    return Date.now() - profile.savingTargetTimestamp >= days14;
  };

  const getDaysUntilEdit = () => {
    if (!profile?.savingTargetTimestamp) return 0;
    const days14 = 14 * 24 * 60 * 60 * 1000;
    const timePassed = Date.now() - profile.savingTargetTimestamp;
    if (timePassed >= days14) return 0;
    return Math.ceil((days14 - timePassed) / (24 * 60 * 60 * 1000));
  };

  const handleSaveTarget = async () => {
    const numTarget = parseInt(targetInput.replace(/[^\d]/g, ''), 10);
    if (isNaN(numTarget) || numTarget <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập mục tiêu hợp lệ.');
      return;
    }

    if (profile) {
      const updatedProfile = { 
        ...profile, 
        savingTarget: numTarget, 
        savingTargetTimestamp: Date.now() 
      };
      await storage.saveUserProfile(updatedProfile);
      setProfile(updatedProfile);
      setIsEditingTarget(false);
      Alert.alert('Thành công', 'Đã lưu mục tiêu tiết kiệm.');
    }
  };

  const executeTransaction = async () => {
    if (!profile?.savingTarget) {
      Alert.alert('Thiếu thông tin', 'Vui lòng thiết lập mục tiêu tiết kiệm trước khi Nạp/Rút.');
      setIsEditingTarget(true);
      return;
    }

    if (amount <= 0) {
      Alert.alert('Chưa nhập số tiền', 'Vui lòng nhập số tiền hợp lệ.');
      return;
    }

    if (type === 'deposit' && amount > totalBalance) {
      Alert.alert('Lỗi', 'Số dư không đủ để nạp vào tiết kiệm.');
      return;
    }

    if (type === 'withdraw' && amount > savingBalance) {
      Alert.alert('Lỗi', 'Số dư tiết kiệm không đủ để rút.');
      return;
    }

    const newTx: Transaction = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type: type === 'deposit' ? 'expense' : 'income',
      amount,
      category: 'Tiết kiệm',
      timestamp: Date.now(),
    };

    const success = await storage.saveTransaction(newTx);
    if (success) {
      Alert.alert('Thành công', `Đã ${type === 'deposit' ? 'nạp vào' : 'rút khỏi'} tiết kiệm.`);
      setAmount(0);
      loadData();
    } else {
      Alert.alert('Lỗi', 'Không thể lưu giao dịch.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header section */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <PiggyBank color="#ffffff" size={28} />
          <Text style={styles.headerTitle}>Heo Đất</Text>
        </View>
        <View style={styles.balancesContainer}>
          <View style={styles.balanceCol}>
            <Text style={styles.balanceLabel}>Số dư tổng</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(totalBalance)} đ</Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceCol}>
            <Text style={styles.balanceLabel}>Tiết kiệm</Text>
            <Text style={[styles.balanceAmount, { color: '#fcd34d' }]}>
              {formatCurrency(savingBalance)} đ
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* Target Section */}
        <View style={styles.targetCard}>
          <Text style={styles.sectionTitle}>Mục tiêu tiết kiệm</Text>
          
          {profile?.savingTarget ? (
            <View>
              {isEditingTarget ? (
                <View style={styles.targetEditRow}>
                  <TextInput
                    style={styles.targetInput}
                    keyboardType="numeric"
                    value={formatMoneyInput(targetInput)}
                    onChangeText={(text) => setTargetInput(formatMoneyInput(text))}
                    placeholder="Nhập số tiền..."
                  />
                  <TouchableOpacity style={styles.saveTargetBtn} onPress={handleSaveTarget}>
                    <Text style={styles.saveTargetBtnText}>Lưu</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditingTarget(false)}>
                    <Text style={styles.cancelBtnText}>Hủy</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.targetDisplayRow}>
                  <Text style={styles.targetValueText}>{formatCurrency(profile.savingTarget)} đ</Text>
                  <TouchableOpacity 
                    style={[styles.editBtn, !canEditTarget() && styles.editBtnDisabled]}
                    onPress={() => {
                      if (canEditTarget()) {
                        setTargetInput(formatMoneyInput(profile.savingTarget!.toString()));
                        setIsEditingTarget(true);
                      } else {
                        Alert.alert('Thông báo', `Bạn chỉ có thể chỉnh sửa mục tiêu sau ${getDaysUntilEdit()} ngày nữa.`);
                      }
                    }}
                  >
                    <Edit2 color={canEditTarget() ? '#3b82f6' : '#94a3b8'} size={18} />
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${Math.min(100, Math.max(0, (savingBalance / profile.savingTarget) * 100))}%` }]} />
              </View>
              <Text style={styles.progressText}>
                Đạt được {((savingBalance / profile.savingTarget) * 100).toFixed(1)}% mục tiêu
              </Text>
              
              {!canEditTarget() && !isEditingTarget && (
                <Text style={styles.cooldownText}>
                  * Có thể sửa lại sau {getDaysUntilEdit()} ngày
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.targetEditRow}>
              <TextInput
                style={styles.targetInput}
                keyboardType="numeric"
                value={formatMoneyInput(targetInput)}
                onChangeText={(text) => setTargetInput(formatMoneyInput(text))}
                placeholder="Nhập mục tiêu..."
              />
              <TouchableOpacity style={styles.saveTargetBtn} onPress={handleSaveTarget}>
                <Text style={styles.saveTargetBtnText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Action Tabs (Deposit / Withdraw) */}
        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, type === 'deposit' && styles.tabActiveDeposit]} 
            onPress={() => setType('deposit')}
          >
            <Text style={[styles.tabText, type === 'deposit' && styles.tabTextActive]}>Nạp Heo</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, type === 'withdraw' && styles.tabActiveWithdraw]} 
            onPress={() => setType('withdraw')}
          >
            <Text style={[styles.tabText, type === 'withdraw' && styles.tabTextActive]}>Rút Tiền</Text>
          </TouchableOpacity>
        </View>

        {/* Amount Display */}
        <View style={[styles.amountDisplay, type === 'withdraw' ? styles.borderWithdraw : styles.borderDeposit]}>
          <Text style={[styles.amountText, type === 'deposit' ? styles.depositText : styles.withdrawText]}>
            {formatCurrency(amount)}
          </Text>
          <Text style={styles.currencyLabel}>VNĐ</Text>
        </View>

        {/* Keypad */}
        <Text style={styles.sectionTitle}>Chọn mệnh giá</Text>
        <Keypad amount={amount} onAddAmount={handleAddAmount} onClear={handleClearAmount} />

        {/* Execute Button */}
        <TouchableOpacity 
          style={[styles.saveButton, type === 'deposit' ? styles.saveDeposit : styles.saveWithdraw]} 
          onPress={executeTransaction}
        >
          <Text style={styles.saveButtonText}>
            {type === 'deposit' ? 'Xác Nhận Nạp' : 'Xác Nhận Rút'}
          </Text>
        </TouchableOpacity>
        
        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#f59e0b',
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  balancesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 16,
  },
  balanceCol: {
    flex: 1,
  },
  balanceLabel: {
    color: '#fef3c7',
    fontSize: 13,
    marginBottom: 4,
  },
  balanceAmount: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  balanceDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 12,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
  },
  targetCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 12,
  },
  targetDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  targetValueText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  editBtn: {
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  editBtnDisabled: {
    backgroundColor: '#f1f5f9',
  },
  targetEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  targetInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  saveTargetBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveTargetBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  progressText: {
    fontSize: 13,
    color: '#64748b',
  },
  cooldownText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 8,
    fontStyle: 'italic',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  tabActiveDeposit: {
    backgroundColor: '#f59e0b',
  },
  tabActiveWithdraw: {
    backgroundColor: '#ef4444',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  amountDisplay: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
  },
  borderDeposit: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  borderWithdraw: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  amountText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  depositText: {
    color: '#f59e0b',
  },
  withdrawText: {
    color: '#ef4444',
  },
  currencyLabel: {
    fontSize: 20,
    color: '#64748b',
    marginLeft: 8,
    marginTop: 16,
  },
  saveButton: {
    marginTop: 24,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveDeposit: {
    backgroundColor: '#f59e0b',
  },
  saveWithdraw: {
    backgroundColor: '#ef4444',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SavingScreen;
