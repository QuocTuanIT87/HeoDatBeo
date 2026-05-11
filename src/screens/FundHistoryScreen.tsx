import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { storage } from '../store/storage';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/format';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Trash2, Wallet } from 'lucide-react-native';

const FundHistoryScreen = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [displayLimit, setDisplayLimit] = useState<number>(20);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    const data = await storage.getTransactions();
    const p = await storage.getUserProfile();
    if (!p) return;
    
    const fundTxs = data.filter(t => 
      t.timestamp >= p.initialBalanceTimestamp &&
      (
        (p.customFunds && p.customFunds.some(f => f.name === t.category)) ||
        t.category === "Xóa Quỹ"
      )
    ).sort((a, b) => b.timestamp - a.timestamp);
    
    setTransactions(fundTxs);
    setDisplayLimit(20);
  };

  const handleDeleteLog = (tx: Transaction) => {
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const elapsed = Date.now() - tx.timestamp;
    if (elapsed > THREE_DAYS_MS) {
      Alert.alert(
        'Không thể xóa',
        'Giao dịch quỹ đã quá 3 ngày, không thể xóa.'
      );
      return;
    }

    Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa giao dịch này không?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Xóa', 
        style: 'destructive',
        onPress: async () => {
          const success = await storage.deleteTransaction(tx.id);
          if (!success) {
            Alert.alert('Lỗi', 'Không thể xóa giao dịch.');
            return;
          }

          const p = await storage.getUserProfile();
          if (p) {
            if (tx.type === "expense") {
              if (p.customFunds && p.customFunds.some(f => f.name === tx.category)) {
                // Xóa nạp quỹ -> Trừ quỹ, cộng lại unallocated
                const updatedFunds = p.customFunds.map(f => 
                  f.name === tx.category ? { ...f, balance: Math.max(0, f.balance - tx.amount) } : f
                );
                await storage.saveUserProfile({
                  ...p,
                  initialBalance: p.initialBalance + tx.amount,
                  customFunds: updatedFunds
                });
              }
            } else if (tx.type === "income") {
              if (tx.category === "Xóa Quỹ") {
                // Xóa giao dịch "Xóa quỹ" -> Giảm unallocated, nhưng không khôi phục được quỹ đã xóa
                await storage.saveUserProfile({ ...p, initialBalance: p.initialBalance - tx.amount });
              } else if (p.customFunds && p.customFunds.some(f => f.name === tx.category)) {
                // Xóa rút quỹ -> Cộng lại quỹ, trừ unallocated
                const updatedFunds = p.customFunds.map(f => 
                  f.name === tx.category ? { ...f, balance: f.balance + tx.amount } : f
                );
                await storage.saveUserProfile({
                  ...p,
                  initialBalance: p.initialBalance - tx.amount,
                  customFunds: updatedFunds
                });
              }
            }
          }
          loadData();
        }
      }
    ]);
  };

  const renderLogItem = ({ item }: { item: Transaction }) => {
    const dateStr = new Date(item.timestamp).toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hour: '2-digit', minute: '2-digit'
    });
    const isDeposit = item.type === "expense";
    const canDelete = (Date.now() - item.timestamp) <= 3 * 24 * 60 * 60 * 1000;

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardCategory}>{item.category}</Text>
            {item.name ? (
              <Text style={styles.cardName}>{item.name}</Text>
            ) : null}
          </View>
          <Text style={[styles.cardAmount, isDeposit ? styles.depositText : styles.withdrawText]}>
            {isDeposit ? '+' : '-'}{formatCurrency(item.amount)} đ
          </Text>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>{dateStr}</Text>
          {canDelete && (
            <TouchableOpacity onPress={() => handleDeleteLog(item)} style={styles.actionButton}>
              <Trash2 color="#ef4444" size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color="#ffffff" size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Wallet color="#ffffff" size={24} />
          <Text style={styles.headerTitle}>Lịch sử Quỹ</Text>
        </View>
      </View>

      <FlatList
        data={transactions.slice(0, displayLimit)}
        keyExtractor={item => item.id}
        renderItem={renderLogItem}
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
          if (displayLimit < transactions.length) {
            setDisplayLimit(prev => prev + 20);
          }
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có lịch sử nạp/rút quỹ.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#0ea5e9',
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
    paddingTop: 24,
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
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  depositText: { color: '#10b981' },
  withdrawText: { color: '#ef4444' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: 13,
    color: '#94a3b8',
  },
  actionButton: { padding: 4 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 15, textAlign: 'center' },
});

export default FundHistoryScreen;
