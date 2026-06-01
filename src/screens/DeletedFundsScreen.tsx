import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { Alert } from "../components/CustomAlert";
import { storage } from "../store/storage";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import {
  ArrowLeft,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Wallet,
} from "lucide-react-native";
import { UserProfile, CustomFund, Transaction } from "../types";
import { resolveCategoryName } from "../utils/category";
import { formatCurrency } from "../utils/format";
import { styles } from "../styles/DeletedFundsScreen";

const FUND_ICONS: Record<string, any> = {
  default: require("../../assets/fund_icon/default.png"),
  spending: require("../../assets/fund_icon/spending.png"),
  save: require("../../assets/fund_icon/save.png"),
  alarm: require("../../assets/fund_icon/alarm.png"),
  application: require("../../assets/fund_icon/application.png"),
  borrow: require("../../assets/fund_icon/borrow.png"),
  buy: require("../../assets/fund_icon/buy.png"),
  car: require("../../assets/fund_icon/car.png"),
  earning: require("../../assets/fund_icon/earning.png"),
  "gold-bars": require("../../assets/fund_icon/gold-bars.png"),
  healthcare: require("../../assets/fund_icon/healthcare.png"),
  land: require("../../assets/fund_icon/land.png"),
  "laptop-screen": require("../../assets/fund_icon/laptop-screen.png"),
  prevention: require("../../assets/fund_icon/prevention.png"),
  travel: require("../../assets/fund_icon/travel.png"),
  "wedding-couple": require("../../assets/fund_icon/wedding-couple.png"),
};

const DeletedFundsScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const loadData = async () => {
    setLoading(true);
    try {
      const p = await storage.getUserProfile();
      const txs = await storage.getTransactions();
      setProfile(p);
      setTransactions(txs);
    } catch (error) {
      console.error("Error loading deleted funds data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  const getDeletedFunds = (): CustomFund[] => {
    if (!profile || !profile.customFunds) return [];
    return profile.customFunds.filter(
      (f) => f.deleteAt !== null && f.deleteAt !== undefined
    );
  };

  const formatDeletionDate = (timestamp?: number | null) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} lúc ${hours}:${minutes}`;
  };

  const handleRestoreFund = async (fundId: string, fundName: string) => {
    Alert.alert(
      "Khôi phục Quỹ",
      `Bạn có chắc chắn muốn khôi phục quỹ "${fundName}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Khôi phục",
          onPress: async () => {
            const p = await storage.getUserProfile();
            if (p && p.customFunds) {
              // Kiểm tra xem trùng tên với quỹ đang hoạt động không
              const activeExists = p.customFunds.some(
                (f) => (f.deleteAt === null || f.deleteAt === undefined) && f.name === fundName
              );
              if (activeExists) {
                Alert.alert("Lỗi", `Đã có một quỹ hoạt động trùng tên "${fundName}". Không thể khôi phục.`);
                return;
              }

              const updated = p.customFunds.map((f) =>
                f.id === fundId ? { ...f, deleteAt: null } : f
              );
              const updatedProfile = { ...p, customFunds: updated };
              const success = await storage.saveUserProfile(updatedProfile);
              if (success) {
                Alert.alert("Thành công", `Đã khôi phục quỹ "${fundName}".`);
                loadData();
              } else {
                Alert.alert("Lỗi", "Không thể khôi phục quỹ.");
              }
            }
          },
        },
      ]
    );
  };

  const renderDeletedItem = ({ item }: { item: CustomFund }) => {
    const id = item.id;
    const name = item.name;
    const iconKey = item.icon || "default";
    const iconSource = FUND_ICONS[iconKey] || FUND_ICONS["default"];

    const filteredTxs = transactions.filter(
      (tx) => tx.categoryId === `fund_${id}`
    );

    const isExpanded = expandedIds.has(id);

    return (
      <View style={styles.card}>
        <View style={styles.cardMainRow}>
          <TouchableOpacity
            style={styles.cardLeft}
            onPress={() => toggleExpand(id)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, { backgroundColor: "#e0f2fe" }]}>
              <Image source={iconSource} style={styles.categoryIcon} />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{name}</Text>
              <Text style={styles.deletionDate}>
                Xóa: {formatDeletionDate(item.deleteAt)}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.cardRight}>
            <View style={styles.txCountBadge}>
              <Text style={styles.txCountText}>
                {filteredTxs.length} gd
              </Text>
            </View>

            <TouchableOpacity
              style={styles.restoreButton}
              onPress={() => handleRestoreFund(id, name)}
            >
              <RotateCcw size={14} color="#059669" />
              <Text style={styles.restoreButtonText}>Khôi phục</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => toggleExpand(id)}
            >
              {isExpanded ? (
                <ChevronUp size={20} color="#64748b" />
              ) : (
                <ChevronDown size={20} color="#64748b" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {isExpanded && (
          <View>
            <View style={styles.divider} />
            <Text style={styles.txSectionTitle}>Giao dịch đã ghi nhận:</Text>
            <View style={styles.txList}>
              {filteredTxs.length === 0 ? (
                <Text style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic" }}>
                  Không tìm thấy giao dịch nào.
                </Text>
              ) : (
                filteredTxs.map((tx) => {
                  const dateStr = new Date(tx.timestamp).toLocaleDateString(
                    "vi-VN",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  );
                  const isDeposit = tx.type === "expense";
                  return (
                    <View key={tx.id} style={styles.txItem}>
                      <View style={styles.txItemLeft}>
                        <Text style={styles.txName}>
                          {isDeposit ? "Nạp tiền vào quỹ" : "Rút tiền từ quỹ"}
                        </Text>
                        {tx.note && <Text style={styles.txNote}>{tx.note}</Text>}
                        <Text style={styles.txDate}>{dateStr}</Text>
                      </View>
                      <Text
                        style={[
                          styles.txAmount,
                          isDeposit ? styles.expenseText : styles.incomeText,
                        ]}
                      >
                        {isDeposit ? "+" : "-"}
                        {formatCurrency(tx.amount)} đ
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft color="#0f172a" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quỹ xoá gần đây</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#d946ef" />
        </View>
      ) : (
        <FlatList
          data={getDeletedFunds()}
          keyExtractor={(item) => item.id}
          renderItem={renderDeletedItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Wallet size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>
                Không có quỹ nào bị xoá gần đây.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default DeletedFundsScreen;
