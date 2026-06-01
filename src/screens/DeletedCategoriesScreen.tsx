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
  FolderOpen,
} from "lucide-react-native";
import { UserProfile, CategoryBudget, Transaction } from "../types";
import { EXPENSE_ICONS, getIncomeIconSource } from "./HomeScreen";
import { isCategoryIdMatch, resolveCategoryName } from "../utils/category";
import { formatCurrency } from "../utils/format";
import { styles } from "../styles/DeletedCategoriesScreen";

const DeletedCategoriesScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const loadData = async () => {
    setLoading(true);
    try {
      const p = await storage.getUserProfile();
      const budgets = await storage.getCategoryBudgets();
      const txs = await storage.getTransactions();
      setProfile(p);
      setCategoryBudgets(budgets);
      setTransactions(txs);
    } catch (error) {
      console.error("Error loading deleted categories data:", error);
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

  const getDeletedExpenses = () => {
    return categoryBudgets.filter(
      (b) => b.deleteAt !== null && b.deleteAt !== undefined
    );
  };

  const getDeletedIncomes = () => {
    if (!profile || !profile.incomeCategories) return [];
    return profile.incomeCategories.filter(
      (c) => c.deleteAt !== null && c.deleteAt !== undefined
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

  const handleRestoreExpense = async (catId: string, catName: string) => {
    Alert.alert(
      "Khôi phục danh mục",
      `Bạn có chắc chắn muốn khôi phục danh mục chi tiêu "${catName}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Khôi phục",
          onPress: async () => {
            const budgets = await storage.getCategoryBudgets();
            const updated = budgets.map((b) =>
              b.id === catId ? { ...b, deleteAt: null } : b
            );
            const success = await storage.saveCategoryBudgets(updated);
            if (success) {
              Alert.alert("Thành công", `Đã khôi phục danh mục "${catName}".`);
              loadData();
            } else {
              Alert.alert("Lỗi", "Không thể khôi phục danh mục.");
            }
          },
        },
      ]
    );
  };

  const handleRestoreIncome = async (catId: string, catName: string) => {
    Alert.alert(
      "Khôi phục danh mục",
      `Bạn có chắc chắn muốn khôi phục danh mục thu nhập "${catName}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Khôi phục",
          onPress: async () => {
            const p = await storage.getUserProfile();
            if (p && p.incomeCategories) {
              const updated = p.incomeCategories.map((c) =>
                c.id === catId ? { ...c, deleteAt: null } : c
              );
              const updatedProfile = { ...p, incomeCategories: updated };
              const success = await storage.saveUserProfile(updatedProfile);
              if (success) {
                Alert.alert("Thành công", `Đã khôi phục danh mục "${catName}".`);
                loadData();
              } else {
                Alert.alert("Lỗi", "Không thể khôi phục danh mục.");
              }
            }
          },
        },
      ]
    );
  };

  const renderDeletedItem = ({ item }: { item: any }) => {
    const isExpenseTab = activeTab === "expense";
    const id = item.id;
    const name = item.name;
    const iconKey = item.icon || "default";

    const iconSource = isExpenseTab
      ? EXPENSE_ICONS[iconKey] || EXPENSE_ICONS["default"]
      : getIncomeIconSource(id, profile);

    const filteredTxs = transactions.filter(
      (tx) => tx.categoryId && isCategoryIdMatch(tx.categoryId, id)
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
            <View
              style={[
                styles.iconWrapper,
                { backgroundColor: isExpenseTab ? "#fee2e2" : "#dcfce7" },
              ]}
            >
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
              onPress={() =>
                isExpenseTab
                  ? handleRestoreExpense(id, name)
                  : handleRestoreIncome(id, name)
              }
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
                  return (
                    <View key={tx.id} style={styles.txItem}>
                      <View style={styles.txItemLeft}>
                        <Text style={styles.txName}>
                          {resolveCategoryName(tx, profile, categoryBudgets)}
                        </Text>
                        {tx.note && <Text style={styles.txNote}>{tx.note}</Text>}
                        <Text style={styles.txDate}>{dateStr}</Text>
                      </View>
                      <Text
                        style={[
                          styles.txAmount,
                          isExpenseTab ? styles.expenseText : styles.incomeText,
                        ]}
                      >
                        {isExpenseTab ? "-" : "+"}
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

  const currentList = activeTab === "expense" ? getDeletedExpenses() : getDeletedIncomes();

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
          <Text style={styles.headerTitle}>Danh mục bị xoá gần đây</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "expense" && styles.tabButtonActiveExpense,
          ]}
          onPress={() => setActiveTab("expense")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "expense" && styles.tabTextActive,
            ]}
          >
            Chi tiêu
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "income" && styles.tabButtonActiveIncome,
          ]}
          onPress={() => setActiveTab("income")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "income" && styles.tabTextActive,
            ]}
          >
            Thu nhập
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#d946ef" />
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item.id}
          renderItem={renderDeletedItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FolderOpen size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>
                Không có danh mục {activeTab === "expense" ? "chi tiêu" : "thu nhập"}{" "}
                nào bị xoá gần đây.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default DeletedCategoriesScreen;
