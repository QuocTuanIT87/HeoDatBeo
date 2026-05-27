import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { storage } from '../store/storage';
import { Transaction, UserProfile } from '../types';
import { formatCurrency } from '../utils/format';
import { resolveCategoryName } from '../utils/category';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Wallet } from 'lucide-react-native';
import { styles } from '../styles/FundHistoryScreen';

const FUND_ICONS: Record<string, any> = {
  default: require('../../assets/fund_icon/default.png'),
  spending: require('../../assets/fund_icon/spending.png'),
  save: require('../../assets/fund_icon/save.png'),
  alarm: require('../../assets/fund_icon/alarm.png'),
  application: require('../../assets/fund_icon/application.png'),
  borrow: require('../../assets/fund_icon/borrow.png'),
  buy: require('../../assets/fund_icon/buy.png'),
  car: require('../../assets/fund_icon/car.png'),
  earning: require('../../assets/fund_icon/earning.png'),
  'gold-bars': require('../../assets/fund_icon/gold-bars.png'),
  healthcare: require('../../assets/fund_icon/healthcare.png'),
  land: require('../../assets/fund_icon/land.png'),
  'laptop-screen': require('../../assets/fund_icon/laptop-screen.png'),
  prevention: require('../../assets/fund_icon/prevention.png'),
  travel: require('../../assets/fund_icon/travel.png'),
  'wedding-couple': require('../../assets/fund_icon/wedding-couple.png'),
};

const FundHistoryScreen = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [displayLimit, setDisplayLimit] = useState<number>(20);
  const [activeFundNames, setActiveFundNames] = useState<string[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

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
        t.categoryId === "system_xoa_quy" ||
        t.category?.startsWith("Xóa quỹ") ||
        (t.name && (t.name.startsWith("Nạp vào ") || t.name.startsWith("Rút từ "))) ||
        t.categoryId?.startsWith("fund_") ||
        (p.customFunds && p.customFunds.some(f => f.name === t.category))
      )
    ).sort((a, b) => b.timestamp - a.timestamp);
    
    setTransactions(fundTxs);
    setProfile(p);
    setDisplayLimit(20);
    if (p.customFunds) {
      setActiveFundNames(p.customFunds.map(f => f.name));
    } else {
      setActiveFundNames([]);
    }
  };

  const getFundIconSource = (item: Transaction) => {
    if (!profile) return FUND_ICONS['default'];

    if (item.categoryId === "system_xoa_quy" || item.category?.startsWith("Xóa quỹ")) {
      return FUND_ICONS['default'];
    }

    if (item.categoryId?.startsWith("fund_")) {
      const fundId = item.categoryId.substring(5);
      const customFund = profile.customFunds?.find(f => f.id === fundId);
      if (customFund) {
        return FUND_ICONS[customFund.icon || 'default'] || FUND_ICONS['default'];
      }
    }

    let fundName = item.category || "";
    if (fundName.startsWith("Xóa quỹ ")) {
      fundName = fundName.replace("Xóa quỹ ", "");
    }

    if (fundName === "Quỹ Tiêu Sài" || item.name?.includes("Quỹ Tiêu Sài")) {
      return FUND_ICONS[profile.spendingFundIcon || 'spending'] || FUND_ICONS['spending'];
    }

    if (fundName === "Quỹ Tiết Kiệm" || fundName === "Tiết kiệm" || fundName === "Rút tiết kiệm" || item.name?.includes("Quỹ Tiết Kiệm")) {
      return FUND_ICONS[profile.savingFundIcon || 'save'] || FUND_ICONS['save'];
    }

    const customFund = profile.customFunds?.find(f => f.name === fundName);
    if (customFund) {
      return FUND_ICONS[customFund.icon || 'default'] || FUND_ICONS['default'];
    }

    return FUND_ICONS['default'];
  };

  const renderLogItem = ({ item }: { item: Transaction }) => {
    const dateStr = new Date(item.timestamp).toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit', 
      hour: '2-digit', minute: '2-digit'
    });
    const isDeposit = item.type === "expense";
    const iconSource = getFundIconSource(item);

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.iconContainer}>
            <Image source={iconSource} style={styles.iconImage} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.cardCategory}>{item.categoryId === "system_xoa_quy" ? (item.category || "Xóa quỹ") : resolveCategoryName(item, profile, [])}</Text>
            {item.name ? (
              <Text style={styles.cardName}>{item.name}</Text>
            ) : null}
          </View>
          <Text style={[styles.cardAmount, isDeposit ? styles.depositText : styles.withdrawText]}>
            {isDeposit ? '+' : '-'}{formatCurrency(item.amount)} đ
          </Text>
        </View>
        <View style={[styles.cardFooter, { paddingLeft: 56 }]}>
          <Text style={styles.cardDate}>{dateStr}</Text>
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



export default FundHistoryScreen;
