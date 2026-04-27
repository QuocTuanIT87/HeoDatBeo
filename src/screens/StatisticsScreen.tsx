import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { storage } from '../store/storage';
import { Transaction, UserProfile, CategoryBudget } from '../types';
import { formatCurrency } from '../utils/format';
import { useIsFocused } from '@react-navigation/native';
import { Trash2 } from 'lucide-react-native';

type FilterPeriod = 'day' | 'week' | 'month' | 'year' | 'all' | 'custom';
type FilterType = 'all' | 'expense' | 'income';

const DEFAULT_EXPENSE_CATEGORIES = ['Ăn uống', 'Xăng cộ', 'Grab', 'Tiền Trọ', 'Khác'];
const DEFAULT_INCOME_CATEGORIES = ['Lương', 'Khác'];

const StatisticsScreen = () => {
  const isFocused = useIsFocused();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  
  const [period, setPeriod] = useState<FilterPeriod>('day');
  const [type, setType] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deletedCategoryFilter, setDeletedCategoryFilter] = useState<string>('all');
  const [displayLimit, setDisplayLimit] = useState<number>(10);

  // Custom date range state
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    if (isFocused) {
      loadTransactions();
    }
  }, [isFocused]);

  useEffect(() => {
    applyFilters(period, type, categoryFilter, transactions, customStartDate, customEndDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, type, categoryFilter, transactions, customStartDate, customEndDate, deletedCategoryFilter, categoryBudgets, profile]);

  useEffect(() => {
    if (categoryFilter !== 'Khác') setDeletedCategoryFilter('all');
  }, [categoryFilter]);

  const loadTransactions = async () => {
    const data = await storage.getTransactions();
    const p = await storage.getUserProfile();
    const cats = await storage.getCategoryBudgets();
    setTransactions(data);
    setProfile(p);
    setCategoryBudgets(cats);
  };

  const applyFilters = (p: FilterPeriod, t: FilterType, c: string, data: Transaction[], start: Date, end: Date) => {
    const now = new Date();
    let filtered = data;

    // Bỏ qua giao dịch tiết kiệm khỏi Thống kê (YC 1 mới)
    filtered = filtered.filter(tx => tx.category !== 'Tiết kiệm' && tx.category !== 'Rút tiết kiệm');

    // Filter by Period
    if (p !== 'all') {
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.timestamp);
        if (p === 'day') {
          return txDate.toDateString() === now.toDateString();
        } else if (p === 'month') {
          return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        } else if (p === 'year') {
          return txDate.getFullYear() === now.getFullYear();
        } else if (p === 'week') {
          // Simple week check (within last 7 days)
          const diffTime = Math.abs(now.getTime() - txDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 7;
        } else if (p === 'custom') {
          // Compare dates (start of start date to end of end date)
          const startTime = new Date(start).setHours(0, 0, 0, 0);
          const endTime = new Date(end).setHours(23, 59, 59, 999);
          return tx.timestamp >= startTime && tx.timestamp <= endTime;
        }
        return true;
      });
    }

    // Filter by Type
    if (t !== 'all') {
      filtered = filtered.filter(tx => tx.type === t);
    }

    // Filter by Category
    if (c === 'Khác') {
      // Hiển thị giao dịch có danh mục đã bị xóa (đã được đổi category thành 'Khác')
      filtered = filtered.filter(tx => tx.category === 'Khác');
      if (deletedCategoryFilter !== 'all') {
        filtered = filtered.filter(tx => tx.categorySnapshot === deletedCategoryFilter);
      }
    } else if (c !== 'all') {
      filtered = filtered.filter(tx => (tx.categorySnapshot || tx.category) === c);
    }

    setFilteredTransactions(filtered);
    setDisplayLimit(10);
  };

  // YC 1, 2, 3: Hoàn tiền thông minh khi xóa giao dịch
  const handleDelete = (tx: Transaction) => {
    // YC 2: Chỉ được xóa trong vòng 5 phút kể từ khi lưu
    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    const elapsed = Date.now() - tx.timestamp;
    if (elapsed > FIVE_MINUTES_MS) {
      const minutesAgo = Math.floor(elapsed / 60000);
      Alert.alert(
        'Không thể xóa',
        `Giao dịch này được tạo cách đây ${minutesAgo} phút. Chỉ có thể xóa giao dịch trong vòng 5 phút kể từ khi lưu.`
      );
      return;
    }

    Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa giao dịch này không?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Xóa', 
        style: 'destructive',
        onPress: async () => {
          // Xóa giao dịch trước
          const success = await storage.deleteTransaction(tx.id);
          if (!success) {
            Alert.alert('Lỗi', 'Không thể xóa giao dịch.');
            return;
          }

          // Lấy profile & budgets hiện tại
          const p = await storage.getUserProfile();
          const cats = await storage.getCategoryBudgets();
          if (!p) { loadTransactions(); return; }

          const catName = tx.categorySnapshot || tx.category;

          if (tx.type === 'expense') {
            if (catName === 'Tiết kiệm') {
              // YC 3: Xóa giao dịch nạp tiết kiệm → hoàn tiền vào tổng và unallocated
              const updatedProfile = { ...p, initialBalance: p.initialBalance + tx.amount };
              await storage.saveUserProfile(updatedProfile);
            } else {
              // YC 1: Xóa giao dịch chi thường
              // Cộng lại initialBalance để tổng số dư tăng
              const updatedProfile = { ...p, initialBalance: p.initialBalance + tx.amount };
              await storage.saveUserProfile(updatedProfile);

              // Nếu danh mục vẫn còn tồn tại → cộng tiền vào budget danh mục đó
              const existingCat = cats.find(b => b.name === catName);
              if (existingCat) {
                const updatedCats = cats.map(b =>
                  b.name === catName ? { ...b, budget: b.budget + tx.amount } : b
                );
                await storage.saveCategoryBudgets(updatedCats);
              }
              // Nếu danh mục đã bị xóa/đổi tên: tiền về unallocated (initialBalance đã được +)
            }
          } else if (tx.type === 'income') {
            if (catName === 'Rút tiết kiệm') {
              // YC 3: Xóa giao dịch rút tiết kiệm → trừ lại khỏi tổng
              const updatedProfile = { ...p, initialBalance: p.initialBalance - tx.amount };
              await storage.saveUserProfile(updatedProfile);
            } else {
              // YC 2: Xóa giao dịch thu tiền thường → trừ khỏi tổng số dư và unallocated
              const updatedProfile = { ...p, initialBalance: p.initialBalance - tx.amount };
              await storage.saveUserProfile(updatedProfile);
            }
          }

          loadTransactions();
        }
      }
    ]);
  };




  // Lấy danh sách các tên danh mục đã xóa có trong giao dịch (theo period + type hiện tại)
  const getDeletedCategoryOptions = (): string[] => {
    const now = new Date();
    let filtered = transactions;
    if (period !== 'all') {
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.timestamp);
        if (period === 'day') return txDate.toDateString() === now.toDateString();
        if (period === 'month') return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        if (period === 'year') return txDate.getFullYear() === now.getFullYear();
        if (period === 'week') {
          const diff = Math.ceil(Math.abs(now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
          return diff <= 7;
        }
        if (period === 'custom') {
          const startTime = new Date(customStartDate).setHours(0, 0, 0, 0);
          const endTime = new Date(customEndDate).setHours(23, 59, 59, 999);
          return tx.timestamp >= startTime && tx.timestamp <= endTime;
        }
        return true;
      });
    }
    if (type !== 'all') filtered = filtered.filter(tx => tx.type === type);
    const deleted = new Set<string>();
    filtered.filter(tx => tx.category === 'Khác').forEach(tx => {
      if (tx.categorySnapshot && tx.categorySnapshot !== 'Khác') {
        deleted.add(tx.categorySnapshot);
      }
    });
    return Array.from(deleted);
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const dateStr = new Date(item.timestamp).toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hour: '2-digit', minute: '2-digit'
    });
    const isExpense = item.type === 'expense';
    // YC 6: Hiển thị tên danh mục gốc tại thời điểm tạo giao dịch
    const displayCategory = item.categorySnapshot || item.category;
    // Tên tùy chỉnh (VD: "Nuôi heo béo")
    const displayName = item.name;

    // Kiểm tra có thể xóa không (trong 5 phút)
    const canDelete = (Date.now() - item.timestamp) <= 5 * 60 * 1000;

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardCategory}>{displayCategory}</Text>
            {displayName ? (
              <Text style={styles.cardName}>{displayName}</Text>
            ) : null}
          </View>
          <Text style={[styles.cardAmount, isExpense ? styles.expenseText : styles.incomeText]}>
            {isExpense ? '-' : '+'}{formatCurrency(item.amount)} đ
          </Text>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>{dateStr}</Text>
          <View style={styles.actionRow}>
            {canDelete ? (
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
                <Trash2 color="#ef4444" size={20} />
              </TouchableOpacity>
            ) : (
              <View style={[styles.actionButton, { opacity: 0.3 }]}>
                <Trash2 color="#94a3b8" size={20} />
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };


  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentPicker = showPicker;
    if (Platform.OS === 'android') setShowPicker(null);
    if (selectedDate) {
      if (currentPicker === 'start') {
        setCustomStartDate(selectedDate);
        if (selectedDate > customEndDate) setCustomEndDate(selectedDate);
      } else if (currentPicker === 'end') {
        if (selectedDate < customStartDate) {
           Alert.alert('Lỗi', 'Ngày đến không được nhỏ hơn ngày từ.');
        } else {
           setCustomEndDate(selectedDate);
        }
      }
    }
  };

  const formatDateShort = (date: Date) => {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const getFilterCategories = () => {
    // Danh mục chi tiền lấy từ CategoryBudgets (tab Chia Tiền)
    const expenseCats = categoryBudgets.length > 0
      ? categoryBudgets.map(b => b.name)
      : DEFAULT_EXPENSE_CATEGORIES;

    let cats: string[];
    if (type === 'all') {
      cats = Array.from(new Set([
        ...(profile?.incomeCategories || DEFAULT_INCOME_CATEGORIES),
        ...expenseCats,
      ]));
    } else if (type === 'income') {
      cats = profile?.incomeCategories || DEFAULT_INCOME_CATEGORIES;
    } else {
      cats = expenseCats;
    }

    const includesKhac = cats.includes('Khác');
    cats = cats.filter(c => c !== 'Khác');

    // Thêm 'Khác' vào cuối cùng nếu nó có trong danh mục hoặc có giao dịch
    const hasKhacTx = transactions.some(tx => {
      if (type !== 'all' && tx.type !== type) return false;
      return tx.category === 'Khác';
    });
    if (includesKhac || hasKhacTx) {
      cats.push('Khác');
    }

    return cats;
  };

  const handleTypeChange = (newType: FilterType) => {
    setType(newType);
    setCategoryFilter('all');
    setDeletedCategoryFilter('all');
  };

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const net = totalIncome - totalExpense;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thống kê</Text>
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodFilters}>
          {(['day', 'week', 'month', 'year', 'custom', 'all'] as FilterPeriod[]).map(p => {
            const labels = { day: 'Hôm nay', week: 'Tuần này', month: 'Tháng này', year: 'Năm nay', custom: 'Tùy chỉnh', all: 'Tất cả' };
            return (
              <TouchableOpacity 
                key={p} 
                style={[styles.periodBadge, period === p && styles.periodBadgeActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{labels[p]}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {period === 'custom' && (
          <View style={styles.customDateContainer}>
             <Text style={styles.dateLabel}>Từ:</Text>
             <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('start')}>
               <Text style={styles.dateBtnText}>{formatDateShort(customStartDate)}</Text>
             </TouchableOpacity>

             <Text style={styles.dateLabel}>Đến:</Text>
             <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('end')}>
               <Text style={styles.dateBtnText}>{formatDateShort(customEndDate)}</Text>
             </TouchableOpacity>
          </View>
        )}

        <View style={styles.typeTabs}>
          <TouchableOpacity 
            style={[styles.typeTab, type === 'all' && styles.typeTabActive]}
            onPress={() => handleTypeChange('all')}
          >
            <Text style={[styles.typeTabText, type === 'all' && styles.typeTabTextActive]}>Tất cả</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeTab, type === 'expense' && styles.typeTabActiveExpense]}
            onPress={() => handleTypeChange('expense')}
          >
            <Text style={[styles.typeTabText, type === 'expense' && styles.typeTabTextActive]}>Chi Tiền</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeTab, type === 'income' && styles.typeTabActiveIncome]}
            onPress={() => handleTypeChange('income')}
          >
            <Text style={[styles.typeTabText, type === 'income' && styles.typeTabTextActive]}>Thu Tiền</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryFilters}>
          <TouchableOpacity 
            style={[styles.categoryBadge, categoryFilter === 'all' && styles.categoryBadgeActive]}
            onPress={() => setCategoryFilter('all')}
          >
            <Text style={[styles.categoryText, categoryFilter === 'all' && styles.categoryTextActive]}>Tất cả</Text>
          </TouchableOpacity>
          {getFilterCategories().map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.categoryBadge, categoryFilter === cat && styles.categoryBadgeActive]}
              onPress={() => setCategoryFilter(cat)}
            >
              <Text style={[styles.categoryText, categoryFilter === cat && styles.categoryTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sub-filter khi chọn "Khác" — hiển thị danh mục đã bị xóa */}
        {categoryFilter === 'Khác' && (
          <View style={styles.deletedSubFilter}>
            <Text style={styles.deletedSubFilterLabel}>📂 Lọc theo danh mục đã xóa:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryFilters}>
              <TouchableOpacity
                style={[styles.deletedCatBadge, deletedCategoryFilter === 'all' && styles.deletedCatBadgeActive]}
                onPress={() => setDeletedCategoryFilter('all')}
              >
                <Text style={[styles.deletedCatText, deletedCategoryFilter === 'all' && styles.deletedCatTextActive]}>Tất cả</Text>
              </TouchableOpacity>
              {getDeletedCategoryOptions().map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.deletedCatBadge, deletedCategoryFilter === cat && styles.deletedCatBadgeActive]}
                  onPress={() => setDeletedCategoryFilter(cat)}
                >
                  <Text style={[styles.deletedCatText, deletedCategoryFilter === cat && styles.deletedCatTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <FlatList
        data={filteredTransactions.slice(0, displayLimit)}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
          if (displayLimit < filteredTransactions.length) {
            setDisplayLimit(prev => prev + 10);
          }
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có giao dịch nào.</Text>
          </View>
        }
      />

      <View style={styles.summaryContainer}>
         <View style={styles.summaryRow}>
           <Text style={styles.summaryLabel}>Tổng thu:</Text>
           <Text style={styles.summaryIncome}>+{formatCurrency(totalIncome)} đ</Text>
         </View>
         <View style={styles.summaryRow}>
           <Text style={styles.summaryLabel}>Tổng chi:</Text>
           <Text style={styles.summaryExpense}>-{formatCurrency(totalExpense)} đ</Text>
         </View>
         <View style={[styles.summaryRow, styles.summaryNetTop]}>
           <Text style={styles.summaryLabelBold}>Còn lại:</Text>
           <Text style={[styles.summaryAmount, { color: net >= 0 ? '#10b981' : '#ef4444' }]}>
             {net >= 0 ? '+' : ''}{formatCurrency(net)} đ
           </Text>
         </View>
      </View>

      {showPicker && (
        <DateTimePicker
          value={showPicker === 'start' ? customStartDate : customEndDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  filterSection: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  periodFilters: {
    paddingHorizontal: 16,
    gap: 8,
  },
  periodBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  periodBadgeActive: {
    backgroundColor: '#3b82f6',
  },
  periodText: {
    color: '#64748b',
    fontWeight: '600',
  },
  periodTextActive: {
    color: '#ffffff',
  },
  customDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  dateLabel: {
    color: '#64748b',
    fontWeight: '500',
  },
  dateBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateBtnText: {
    color: '#334155',
    fontWeight: '500',
  },
  typeTabs: {
    flexDirection: 'row',
    marginTop: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  typeTabActive: { backgroundColor: '#3b82f6' },
  typeTabActiveExpense: { backgroundColor: '#ef4444' },
  typeTabActiveIncome: { backgroundColor: '#10b981' },
  typeTabText: {
    fontWeight: '600',
    color: '#64748b',
  },
  typeTabTextActive: {
    color: '#ffffff',
  },
  categoryFilters: {
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 12,
  },
  categoryBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  categoryBadgeActive: {
    backgroundColor: '#475569',
    borderColor: '#475569',
  },
  categoryText: {
    color: '#64748b',
    fontWeight: '500',
    fontSize: 13,
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardCategory: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  cardName: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    fontStyle: 'italic',
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  expenseText: {
    color: '#ef4444',
  },
  incomeText: {
    color: '#10b981',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: 14,
    color: '#94a3b8',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#64748b',
  },
  summaryLabelBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
  },
  summaryIncome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  summaryExpense: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  summaryNetTop: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginBottom: 0,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Sub-filter danh mục đã xóa
  deletedSubFilter: {
    backgroundColor: '#fff7ed',
    borderTopWidth: 1,
    borderTopColor: '#fed7aa',
    paddingTop: 10,
    paddingBottom: 4,
  },
  deletedSubFilterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#c2410c',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  deletedCatBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fb923c',
    backgroundColor: '#fff7ed',
  },
  deletedCatBadgeActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  deletedCatText: {
    color: '#c2410c',
    fontWeight: '600',
    fontSize: 13,
  },
  deletedCatTextActive: {
    color: '#ffffff',
  },
});

export default StatisticsScreen;
