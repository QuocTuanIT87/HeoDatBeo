import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { storage } from '../store/storage';
import { Transaction, UserProfile } from '../types';
import { formatCurrency } from '../utils/format';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Trash2 } from 'lucide-react-native';

const SavingHistoryScreen = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [displayLimit, setDisplayLimit] = useState<number>(10);

  useEffect(() => {
    if (isFocused) {
      loadTransactions();
    }
  }, [isFocused]);

  const loadTransactions = async () => {
    const data = await storage.getTransactions();
    const p = await storage.getUserProfile();
    if (!p) return;
    
    const savingTxs = data.filter(t => 
      t.timestamp >= p.initialBalanceTimestamp &&
      (t.category === 'Tiết kiệm' || t.category === 'Rút tiết kiệm')
    );
    setTransactions(savingTxs);
    setDisplayLimit(10);
  };

  const handleDelete = (tx: Transaction) => {
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
          const success = await storage.deleteTransaction(tx.id);
          if (!success) {
            Alert.alert('Lỗi', 'Không thể xóa giao dịch.');
            return;
          }

          const p = await storage.getUserProfile();
          if (!p) { loadTransactions(); return; }

          if (tx.type === 'expense' && tx.category === 'Tiết kiệm') {
            const updatedProfile = { ...p, initialBalance: p.initialBalance + tx.amount };
            await storage.saveUserProfile(updatedProfile);
          } else if (tx.type === 'income' && tx.category === 'Rút tiết kiệm') {
            const updatedProfile = { ...p, initialBalance: p.initialBalance - tx.amount };
            await storage.saveUserProfile(updatedProfile);
          }

          loadTransactions();
        }
      }
    ]);
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const dateStr = new Date(item.timestamp).toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hour: '2-digit', minute: '2-digit'
    });
    const isDeposit = item.category === 'Tiết kiệm';
    const canDelete = (Date.now() - item.timestamp) <= 5 * 60 * 1000;

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color="#ffffff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử Nạp / Rút Tiết Kiệm</Text>
      </View>
      <FlatList
        data={transactions.slice(0, displayLimit)}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
          if (displayLimit < transactions.length) {
            setDisplayLimit(prev => prev + 10);
          }
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có lịch sử nạp/rút tiết kiệm.</Text>
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
    backgroundColor: '#f59e0b',
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
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
  depositText: {
    color: '#10b981',
  },
  withdrawText: {
    color: '#ef4444',
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

export default SavingHistoryScreen;
