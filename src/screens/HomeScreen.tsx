import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { Eye, EyeOff, PlusCircle, MinusCircle } from 'lucide-react-native';
import { storage } from '../store/storage';
import { Transaction, UserProfile } from '../types';
import { formatCurrency } from '../utils/format';
import Keypad from '../components/Keypad';
import { useIsFocused } from '@react-navigation/native';

const EXPENSE_CATEGORIES = ['Ăn uống', 'Xăng cộ', 'Grab', 'Tiền Trọ', 'Khác'];
const INCOME_CATEGORIES = ['Lương', 'Khác'];

const HomeScreen = () => {
  const isFocused = useIsFocused();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [showBalance, setShowBalance] = useState(true);

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('');

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
      
      let calcBalance = p.initialBalance;
      validTransactions.forEach(t => {
        if (t.type === 'income') calcBalance += t.amount;
        else if (t.type === 'expense') calcBalance -= t.amount;
      });
      setBalance(calcBalance);
    }
  };

  const handleAddAmount = (val: number) => {
    setAmount(prev => prev + val);
  };

  const handleClearAmount = () => {
    setAmount(0);
  };

  const handleSave = async () => {
    if (amount <= 0) {
      Alert.alert('Chưa nhập số tiền', 'Vui lòng nhập số tiền hợp lệ.');
      return;
    }

    if (type === 'expense' && amount > balance) {
      Alert.alert('Số dư không đủ', 'Số dư hiện tại không đủ để thực hiện khoản chi này.');
      return;
    }

    const finalCategory = category === 'Khác' ? customCategory.trim() : category;
    if (!finalCategory) {
      Alert.alert('Chưa chọn danh mục', 'Vui lòng chọn hoặc nhập danh mục.');
      return;
    }

    const newTx: Transaction = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type,
      amount,
      category: finalCategory,
      timestamp: Date.now(),
    };

    const success = await storage.saveTransaction(newTx);
    if (success) {
      Alert.alert('Thành công', 'Đã lưu giao dịch.');
      setAmount(0);
      setCategory('');
      setCustomCategory('');
      loadData(); // reload balance
    } else {
      Alert.alert('Lỗi', 'Không thể lưu giao dịch.');
    }
  };

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <View style={styles.container}>
      {/* Header section with balance */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Xin chào, {profile?.name}</Text>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Số dư hiện tại:</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>
              {showBalance ? `${formatCurrency(balance)} đ` : '****** đ'}
            </Text>
            <TouchableOpacity onPress={() => setShowBalance(!showBalance)} style={styles.eyeIcon}>
              {showBalance ? <Eye color="#ffffff" size={24} /> : <EyeOff color="#ffffff" size={24} />}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, type === 'expense' && styles.tabActiveExpense]} 
            onPress={() => { setType('expense'); setCategory(''); }}
          >
            <MinusCircle color={type === 'expense' ? '#ffffff' : '#ef4444'} size={20} />
            <Text style={[styles.tabText, type === 'expense' && styles.tabTextActive]}>Chi Tiền</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, type === 'income' && styles.tabActiveIncome]} 
            onPress={() => { setType('income'); setCategory(''); }}
          >
            <PlusCircle color={type === 'income' ? '#ffffff' : '#10b981'} size={20} />
            <Text style={[styles.tabText, type === 'income' && styles.tabTextActive]}>Thu Tiền</Text>
          </TouchableOpacity>
        </View>

        {/* Input Display */}
        <View style={styles.amountDisplay}>
          <Text style={[styles.amountText, type === 'expense' ? styles.expenseText : styles.incomeText]}>
            {formatCurrency(amount)}
          </Text>
          <Text style={styles.currencyLabel}>VNĐ</Text>
        </View>

        {/* Categories */}
        <Text style={styles.sectionTitle}>Danh mục</Text>
        <View style={styles.categoryContainer}>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.categoryBadge, category === cat && styles.categoryBadgeActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {category === 'Khác' && (
          <TextInput
            style={styles.customInput}
            placeholder="Nhập tên danh mục khác..."
            value={customCategory}
            onChangeText={setCustomCategory}
          />
        )}

        {/* Keypad */}
        <Text style={styles.sectionTitle}>Chọn mệnh giá</Text>
        <Keypad amount={amount} onAddAmount={handleAddAmount} onClear={handleClearAmount} />

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, type === 'expense' ? styles.saveExpense : styles.saveIncome]} 
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Lưu Giao Dịch</Text>
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
    backgroundColor: '#d946ef',
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    color: '#fdf4ff',
    fontSize: 16,
    marginBottom: 8,
  },
  balanceContainer: {
    marginTop: 8,
  },
  balanceLabel: {
    color: '#fdf4ff',
    fontSize: 14,
    opacity: 0.9,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  balanceAmount: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  eyeIcon: {
    marginLeft: 12,
    padding: 4,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  tabActiveExpense: {
    backgroundColor: '#ef4444',
  },
  tabActiveIncome: {
    backgroundColor: '#10b981',
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
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  amountText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  expenseText: {
    color: '#ef4444',
  },
  incomeText: {
    color: '#10b981',
  },
  currencyLabel: {
    fontSize: 20,
    color: '#64748b',
    marginLeft: 8,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 12,
    marginTop: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  categoryBadgeActive: {
    backgroundColor: '#3b82f6',
  },
  categoryText: {
    color: '#475569',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  customInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 24,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveExpense: {
    backgroundColor: '#ef4444',
  },
  saveIncome: {
    backgroundColor: '#10b981',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
