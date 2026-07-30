import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Alert } from "../components/CustomAlert";
import { storage } from "../store/storage";
import { Transaction, SavingHistoryItem } from "../types";
import { formatCurrency, formatPercent } from "../utils/format";
import { resolveCategoryName } from "../utils/category";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { ArrowLeft, Trash2, Trophy, Clock } from "lucide-react-native";
import { styles } from "../styles/SavingHistoryScreen";
import { useLanguage } from "../i18n/LanguageContext";

const SavingHistoryScreen = () => {
  const { t } = useLanguage();
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  const [tab, setTab] = useState<"goals" | "logs">("goals");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goalHistory, setGoalHistory] = useState<SavingHistoryItem[]>([]);
  const [displayLimit, setDisplayLimit] = useState<number>(10);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    const data = await storage.getTransactions();
    const p = await storage.getUserProfile();
    if (!p) return;

    // Lọc log nạp rút
    const savingTxs = data
      .filter(
        (t) =>
          t.timestamp >= p.initialBalanceTimestamp &&
          (t.categoryId === "system_tiet_kiem" || t.categoryId === "system_rut_tiet_kiem"),
      )
      .sort((a, b) => b.timestamp - a.timestamp);

    setTransactions(savingTxs);
    setGoalHistory(p.savingHistory || []);
    setDisplayLimit(10);
  };

  const handleDeleteLog = async (tx: Transaction) => {
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const elapsed = Date.now() - tx.timestamp;
    if (elapsed > THREE_DAYS_MS) {
      Alert.alert(
        t("common.error"),
        "Giao dịch nạp/rút tiết kiệm đã quá 3 ngày, không thể xóa.",
      );
      return;
    }

    // Kiểm tra số dư chưa phân bổ nếu là giao dịch thu tiền (Rút tiết kiệm)
    if (tx.type === "income") {
      const p = await storage.getUserProfile();
      const cats = await storage.getCategoryBudgets();
      if (p) {
        const totalAllocated = cats.reduce((sum, b) => sum + b.budget, 0);
        const unallocated = p.initialBalance - totalAllocated;
        if (tx.amount > unallocated) {
          Alert.alert(
            t("common.error"),
            "Số tiền này đã được sử dụng hoặc phân bổ vào các Quỹ.",
          );
          return;
        }
      }
    }

    Alert.alert(
      t("common.warning"),
      t("stats.confirmDelete"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            const success = await storage.deleteTransaction(tx.id);
            if (!success) {
              Alert.alert(t("common.error"), "Không thể xóa giao dịch.");
              return;
            }

            const p = await storage.getUserProfile();
            if (p) {
              if (tx.type === "expense" && tx.categoryId === "system_tiet_kiem") {
                await storage.saveUserProfile({
                  ...p,
                  initialBalance: p.initialBalance + tx.amount,
                });
              } else if (
                tx.type === "income" &&
                tx.categoryId === "system_rut_tiet_kiem"
              ) {
                await storage.saveUserProfile({
                  ...p,
                  initialBalance: p.initialBalance - tx.amount,
                });
              }
            }
            loadData();
          },
        },
      ],
    );
  };

  const renderGoalItem = (item: SavingHistoryItem) => {
    const percent = item.target > 0 ? (item.achieved / item.target) * 100 : 0;
    return (
      <View key={item.year} style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalYear}>{t("savings.target", { year: String(item.year) })}</Text>
          <Trophy color={percent >= 100 ? "#f59e0b" : "#94a3b8"} size={20} />
        </View>
        <View style={styles.goalBody}>
          <View style={styles.goalStat}>
            <Text style={styles.goalStatLabel}>{t("savingHistory.targetTarget", { amount: "" })}</Text>
            <Text style={styles.goalStatValue}>
              {formatCurrency(item.target)} {t("common.currencySymbol")}
            </Text>
          </View>
          <View style={styles.goalStat}>
            <Text style={styles.goalStatLabel}>{t("savings.achieved")}</Text>
            <Text style={[styles.goalStatValue, { color: "#10b981" }]}>
              {formatCurrency(item.achieved)} {t("common.currencySymbol")}
            </Text>
          </View>
        </View>
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.min(100, percent)}%`,
                backgroundColor: percent >= 100 ? "#10b981" : "#3b82f6",
              },
            ]}
          />
        </View>
        <Text style={styles.goalFooter}>
          {formatPercent(percent)}%
        </Text>
      </View>
    );
  };

  const renderLogItem = ({ item }: { item: Transaction }) => {
    const dateStr = new Date(item.timestamp).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    const isDeposit = item.categoryId === "system_tiet_kiem";
    const canDelete = Date.now() - item.timestamp <= 3 * 24 * 60 * 60 * 1000;

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardCategory}>{resolveCategoryName(item, null, [], t)}</Text>
          </View>
          <Text
            style={[
              styles.cardAmount,
              isDeposit ? styles.depositText : styles.withdrawText,
            ]}
          >
            {isDeposit ? "+" : "-"}
            {formatCurrency(item.amount)} {t("common.currencySymbol")}
          </Text>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>{dateStr}</Text>
          {canDelete && (
            <TouchableOpacity
              onPress={() => handleDeleteLog(item)}
              style={styles.actionButton}
            >
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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft color="#ffffff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("savingHistory.headerTitle")}</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, tab === "goals" && styles.tabItemActive]}
          onPress={() => setTab("goals")}
        >
          <Trophy color={tab === "goals" ? "#f59e0b" : "#64748b"} size={18} />
          <Text
            style={[styles.tabText, tab === "goals" && styles.tabTextActive]}
          >
            {t("savingHistory.targetTab")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, tab === "logs" && styles.tabItemActive]}
          onPress={() => setTab("logs")}
        >
          <Clock color={tab === "logs" ? "#f59e0b" : "#64748b"} size={18} />
          <Text
            style={[styles.tabText, tab === "logs" && styles.tabTextActive]}
          >
            {t("savingHistory.logTab")}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === "goals" ? (
        <ScrollView contentContainerStyle={styles.listContent}>
          {goalHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {t("savingHistory.emptyTargets")}
              </Text>
            </View>
          ) : (
            goalHistory.sort((a, b) => b.year - a.year).map(renderGoalItem)
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={transactions.slice(0, displayLimit)}
          keyExtractor={(item) => item.id}
          renderItem={renderLogItem}
          contentContainerStyle={styles.listContent}
          onEndReached={() => {
            if (displayLimit < transactions.length) {
              setDisplayLimit((prev) => prev + 10);
            }
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {t("savingHistory.emptyLogs")}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default SavingHistoryScreen;
