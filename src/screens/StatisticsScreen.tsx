import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { storage } from '../store/storage';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/format';
import { useIsFocused } from '@react-navigation/native';
import { Trash2, Edit } from 'lucide-react-native';

type FilterPeriod = 'day' | 'week' | 'month' | 'year' | 'all' | 'custom';
type FilterType = 'all' | 'expense' | 'income';

const StatisticsScreen = () => {
  const isFocused = useIsFocused();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  
  const [period, setPeriod] = useState<FilterPeriod>('day');
  const [type, setType] = useState<FilterType>('all');

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
    applyFilters(period, type, transactions, customStartDate, customEndDate);
  }, [period, type, transactions, customStartDate, customEndDate]);

  const loadTransactions = async () => {
    const data = await storage.getTransactions();
    setTransactions(data);
  };

  const applyFilters = (p: FilterPeriod, t: FilterType, data: Transaction[], start: Date, end: Date) => {
    const now = new Date();
    let filtered = data;

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

    setFilteredTransactions(filtered);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa giao dịch này không?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Xóa', 
        style: 'destructive',
        onPress: async () => {
          const success = await storage.deleteTransaction(id);
          if (success) {
            loadTransactions();
          }
        }
      }
    ]);
  };

  const handleEdit = (tx: Transaction) => {
    // Basic conceptual edit. Since building a full modal edit flow takes more time, 
    // an alert or a simple edit could be done, but we'll show an info alert for now.
    Alert.alert('Tính năng đang phát triển', 'Chức năng sửa xin nâng cấp vào phiên bản sau. Bạn có thể xóa và nhập lại.');
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const dateStr = new Date(item.timestamp).toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hour: '2-digit', minute: '2-digit'
    });
    const isExpense = item.type === 'expense';

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardCategory}>{item.category}</Text>
          <Text style={[styles.cardAmount, isExpense ? styles.expenseText : styles.incomeText]}>
            {isExpense ? '-' : '+'}{formatCurrency(item.amount)} đ
          </Text>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>{dateStr}</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
              <Edit color="#3b82f6" size={20} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
              <Trash2 color="#ef4444" size={20} />
            </TouchableOpacity>
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
            onPress={() => setType('all')}
          >
            <Text style={[styles.typeTabText, type === 'all' && styles.typeTabTextActive]}>Tất cả</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeTab, type === 'expense' && styles.typeTabActiveExpense]}
            onPress={() => setType('expense')}
          >
            <Text style={[styles.typeTabText, type === 'expense' && styles.typeTabTextActive]}>Chi Tiền</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeTab, type === 'income' && styles.typeTabActiveIncome]}
            onPress={() => setType('income')}
          >
            <Text style={[styles.typeTabText, type === 'income' && styles.typeTabTextActive]}>Thu Tiền</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có giao dịch nào.</Text>
          </View>
        }
      />

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

// ... Wait, need to add import for ScrollView because I missed it.
import { ScrollView } from 'react-native';

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
    marginBottom: 8,
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
  listContent: {
    padding: 16,
    gap: 12,
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
});

export default StatisticsScreen;
