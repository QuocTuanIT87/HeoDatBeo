import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
  Modal,
  Dimensions,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { storage } from "../store/storage";
import { Transaction, UserProfile, CategoryBudget } from "../types";
import { formatCurrency } from "../utils/format";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import {
  Trash2,
  X,
  PieChart as PieChartIcon,
  BarChart2,
} from "lucide-react-native";
import { BarChart } from "react-native-gifted-charts";
import CustomPieChart from "../components/CustomPieChart";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";

const screenWidth = Dimensions.get("window").width;

type FilterPeriod = "day" | "month" | "year" | "all" | "custom";
type FilterType = "all" | "expense" | "income";

const DEFAULT_EXPENSE_CATEGORIES = [
  "Ăn uống",
  "Xăng cộ",
  "Grab",
  "Tiền Trọ",
  "Khác",
];
const DEFAULT_INCOME_CATEGORIES = ["Lương", "Khác"];

// --- Component thẻ giao dịch — tách ra ngoài để React.memo hoạt động hiệu quả ---
type TransactionCardProps = {
  item: Transaction;
  onDelete: (tx: Transaction) => void;
};

const TransactionCard = React.memo(
  ({ item, onDelete }: TransactionCardProps) => {
    const dateStr = new Date(item.timestamp).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    const isExpense = item.type === "expense";
    // Nếu là số dư đầu tiên, hiển thị tên 'Số dư đầu tiên' thay vì 'Khác' làm danh mục
    const displayCategory =
      item.name === "Số dư đầu tiên"
        ? item.name
        : item.categorySnapshot || item.category;
    const displayName = item.name === "Số dư đầu tiên" ? undefined : item.name;
    const canDelete = Date.now() - item.timestamp <= 5 * 60 * 1000;

    return (
      <View style={cardStyles.card}>
        <View style={cardStyles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={cardStyles.cardCategory}>{displayCategory}</Text>
            {displayName ? (
              <Text style={cardStyles.cardName}>{displayName}</Text>
            ) : null}
            {item.note ? (
              <Text style={cardStyles.cardNote}>{item.note}</Text>
            ) : null}
          </View>
          <Text
            style={[
              cardStyles.cardAmount,
              isExpense ? cardStyles.expenseText : cardStyles.incomeText,
            ]}
          >
            {isExpense ? "-" : "+"}
            {formatCurrency(item.amount)} đ
          </Text>
        </View>
        <View style={cardStyles.cardFooter}>
          <Text style={cardStyles.cardDate}>{dateStr}</Text>
          <View style={cardStyles.actionRow}>
            {canDelete ? (
              <TouchableOpacity
                onPress={() => onDelete(item)}
                style={cardStyles.actionButton}
              >
                <Trash2 color="#ef4444" size={20} />
              </TouchableOpacity>
            ) : (
              <View style={[cardStyles.actionButton, { opacity: 0.3 }]}>
                <Trash2 color="#94a3b8" size={20} />
              </View>
            )}
          </View>
        </View>
      </View>
    );
  },
);

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardCategory: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
  },
  cardName: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
    fontStyle: "italic",
  },
  cardNote: {
    fontSize: 13,
    color: "#475569",
    fontStyle: "italic",
    marginTop: 4,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  expenseText: {
    color: "#ef4444",
  },
  incomeText: {
    color: "#10b981",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardDate: {
    fontSize: 14,
    color: "#94a3b8",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
});

const StatisticsScreen = () => {
  const isFocused = useIsFocused();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);

  const [period, setPeriod] = useState<FilterPeriod>("day");
  const [type, setType] = useState<FilterType>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deletedCategoryFilter, setDeletedCategoryFilter] =
    useState<string>("all");
  const [displayLimit, setDisplayLimit] = useState<number>(10);

  // Tháng/năm đang chọn (độc lập với nhau)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null); // format "YYYY-MM"
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Danh sách tháng/năm có giao dịch (từ index)
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Modal
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  const [showPieChartModal, setShowPieChartModal] = useState(false);
  const [showBarChartModal, setShowBarChartModal] = useState(false);

  // CustomPieChart state
  const [selectedPieCategory, setSelectedPieCategory] = useState<string | null>(
    null,
  );

  // BarChart state
  const [selectedBarData, setSelectedBarData] = useState<{
    day: string;
    value: number;
    type: string;
  } | null>(null);

  // Custom date range state
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState<"start" | "end" | null>(null);

  useEffect(() => {
    if (isFocused) {
      loadTransactions();
    }
  }, [isFocused]);

  useEffect(() => {
    applyFilters(
      period,
      type,
      categoryFilter,
      transactions,
      customStartDate,
      customEndDate,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    period,
    type,
    categoryFilter,
    transactions,
    customStartDate,
    customEndDate,
    deletedCategoryFilter,
    categoryBudgets,
    profile,
    selectedMonth,
    selectedYear,
  ]);

  useEffect(() => {
    if (categoryFilter !== "Khác") setDeletedCategoryFilter("all");
  }, [categoryFilter]);

  const loadTransactions = async () => {
    const data = await storage.getTransactions();
    const p = await storage.getUserProfile();
    const cats = await storage.getCategoryBudgets();
    const dateIndex = await storage.getTransactionDateIndex();
    setTransactions(data);
    setProfile(p);
    setCategoryBudgets(cats);
    setAvailableMonths(dateIndex.months);
    setAvailableYears(dateIndex.years);
  };

  const applyFilters = (
    p: FilterPeriod,
    t: FilterType,
    c: string,
    data: Transaction[],
    start: Date,
    end: Date,
  ) => {
    const now = new Date();
    let filtered = data;

    // Bỏ qua giao dịch tiết kiệm khỏi Thống kê
    filtered = filtered.filter(
      (tx) => tx.category !== "Tiết kiệm" && tx.category !== "Rút tiết kiệm",
    );

    // Filter by Period
    if (p !== "all") {
      filtered = filtered.filter((tx) => {
        const txDate = new Date(tx.timestamp);
        if (p === "day") {
          return txDate.toDateString() === now.toDateString();
        } else if (p === "month") {
          // Dùng selectedMonth nếu có, fallback tháng hiện tại
          const targetMonth =
            selectedMonth ||
            `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          const txMonth = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;
          return txMonth === targetMonth;
        } else if (p === "year") {
          const targetYear = selectedYear ?? now.getFullYear();
          return txDate.getFullYear() === targetYear;
        } else if (p === "custom") {
          const startTime = new Date(start).setHours(0, 0, 0, 0);
          const endTime = new Date(end).setHours(23, 59, 59, 999);
          return tx.timestamp >= startTime && tx.timestamp <= endTime;
        }
        return true;
      });
    }

    // Filter by Type
    if (t !== "all") {
      filtered = filtered.filter((tx) => tx.type === t);
    }

    // Filter by Category
    if (c === "Khác") {
      filtered = filtered.filter((tx) => tx.category === "Khác");
      if (deletedCategoryFilter !== "all") {
        filtered = filtered.filter(
          (tx) =>
            tx.categorySnapshot === deletedCategoryFilter ||
            (deletedCategoryFilter === "Số dư đầu tiên" &&
              tx.name === "Số dư đầu tiên"),
        );
      }
    } else if (c !== "all") {
      filtered = filtered.filter(
        (tx) => (tx.categorySnapshot || tx.category) === c,
      );
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
        "Không thể xóa",
        `Giao dịch này được tạo cách đây ${minutesAgo} phút. Chỉ có thể xóa giao dịch trong vòng 5 phút kể từ khi lưu.`,
      );
      return;
    }

    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa giao dịch này không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            // Xóa giao dịch trước
            const success = await storage.deleteTransaction(tx.id);
            if (!success) {
              Alert.alert("Lỗi", "Không thể xóa giao dịch.");
              return;
            }

            // Lấy profile & budgets hiện tại
            const p = await storage.getUserProfile();
            const cats = await storage.getCategoryBudgets();
            if (!p) {
              loadTransactions();
              return;
            }

            const catName = tx.categorySnapshot || tx.category;

            if (tx.type === "expense") {
              if (catName === "Tiết kiệm") {
                // YC 3: Xóa giao dịch nạp tiết kiệm → hoàn tiền vào tổng và unallocated
                const updatedProfile = {
                  ...p,
                  initialBalance: p.initialBalance + tx.amount,
                };
                await storage.saveUserProfile(updatedProfile);
              } else {
                // YC 1: Xóa giao dịch chi thường
                // Cộng lại initialBalance để tổng số dư tăng
                const updatedProfile = {
                  ...p,
                  initialBalance: p.initialBalance + tx.amount,
                };
                await storage.saveUserProfile(updatedProfile);

                // Nếu danh mục vẫn còn tồn tại → cộng tiền vào budget danh mục đó
                const existingCat = cats.find((b) => b.name === catName);
                if (existingCat) {
                  const updatedCats = cats.map((b) =>
                    b.name === catName
                      ? {
                          ...b,
                          budget: b.budget + tx.amount,
                          spent: Math.max(0, (b.spent || 0) - tx.amount),
                        }
                      : b,
                  );
                  await storage.saveCategoryBudgets(updatedCats);
                }
                // Nếu danh mục đã bị xóa/đổi tên: tiền về unallocated (initialBalance đã được +)
              }
            } else if (tx.type === "income") {
              if (catName === "Rút tiết kiệm") {
                // YC 3: Xóa giao dịch rút tiết kiệm → trừ lại khỏi tổng
                const updatedProfile = {
                  ...p,
                  initialBalance: p.initialBalance - tx.amount,
                };
                await storage.saveUserProfile(updatedProfile);
              } else {
                // YC 2: Xóa giao dịch thu tiền thường → trừ khỏi tổng số dư và unallocated
                const updatedProfile = {
                  ...p,
                  initialBalance: p.initialBalance - tx.amount,
                };
                await storage.saveUserProfile(updatedProfile);
              }
            }

            loadTransactions();
          },
        },
      ],
    );
  };

  // Lấy danh sách các tên danh mục đã xóa có trong giao dịch (theo period + type hiện tại)
  const getDeletedCategoryOptions = (): string[] => {
    const now = new Date();
    let filtered = transactions;
    if (period !== "all") {
      filtered = filtered.filter((tx) => {
        const txDate = new Date(tx.timestamp);
        if (period === "day")
          return txDate.toDateString() === now.toDateString();
        if (period === "month") {
          const targetMonth =
            selectedMonth ||
            `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          const txMonth = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;
          return txMonth === targetMonth;
        }
        if (period === "year") {
          const targetYear = selectedYear ?? now.getFullYear();
          return txDate.getFullYear() === targetYear;
        }
        if (period === "custom") {
          const startTime = new Date(customStartDate).setHours(0, 0, 0, 0);
          const endTime = new Date(customEndDate).setHours(23, 59, 59, 999);
          return tx.timestamp >= startTime && tx.timestamp <= endTime;
        }
        return true;
      });
    }
    if (type !== "all") filtered = filtered.filter((tx) => tx.type === type);
    const deleted = new Set<string>();
    filtered
      .filter((tx) => tx.category === "Khác")
      .forEach((tx) => {
        if (tx.categorySnapshot && tx.categorySnapshot !== "Khác") {
          deleted.add(tx.categorySnapshot);
        } else if (tx.name === "Số dư đầu tiên") {
          deleted.add("Số dư đầu tiên");
        }
      });
    return Array.from(deleted);
  };

  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => (
      <TransactionCard item={item} onDelete={handleDelete} />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleDelete],
  );

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentPicker = showPicker;
    if (Platform.OS === "android") setShowPicker(null);
    if (selectedDate) {
      if (currentPicker === "start") {
        setCustomStartDate(selectedDate);
        if (selectedDate > customEndDate) setCustomEndDate(selectedDate);
      } else if (currentPicker === "end") {
        if (selectedDate < customStartDate) {
          Alert.alert("Lỗi", "Ngày đến không được nhỏ hơn ngày từ.");
        } else {
          setCustomEndDate(selectedDate);
        }
      }
    }
  };

  const formatDateShort = (date: Date) => {
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  };

  // Hiển thị nhãn badge tháng/năm đang chọn
  const getMonthBadgeLabel = () => {
    if (selectedMonth) {
      const [y, m] = selectedMonth.split("-");
      return `T${parseInt(m)}/${y}`;
    }
    const now = new Date();
    return `T${now.getMonth() + 1}/${now.getFullYear()}`;
  };

  const getYearBadgeLabel = () => {
    if (selectedYear) return `Năm ${selectedYear}`;
    return `Năm ${new Date().getFullYear()}`;
  };

  // Format tháng để hiển thị trong modal
  const formatMonthDisplay = (monthStr: string) => {
    const [y, m] = monthStr.split("-");
    return `Tháng ${parseInt(m)} năm ${y}`;
  };

  const getFilterCategories = () => {
    // Danh mục chi tiền lấy từ CategoryBudgets (tab Chia Tiền)
    const expenseCats =
      categoryBudgets.length > 0
        ? categoryBudgets.map((b) => b.name)
        : DEFAULT_EXPENSE_CATEGORIES;

    let cats: string[];
    if (type === "all") {
      cats = Array.from(
        new Set([
          ...(profile?.incomeCategories || DEFAULT_INCOME_CATEGORIES),
          ...expenseCats,
        ]),
      );
    } else if (type === "income") {
      cats = profile?.incomeCategories || DEFAULT_INCOME_CATEGORIES;
    } else {
      cats = expenseCats;
    }

    const includesKhac = cats.includes("Khác");
    cats = cats.filter((c) => c !== "Khác");

    // Thêm 'Khác' vào cuối cùng nếu nó có trong danh mục hoặc có giao dịch
    const hasKhacTx = transactions.some((tx) => {
      if (type !== "all" && tx.type !== type) return false;
      return tx.category === "Khác";
    });
    if (includesKhac || hasKhacTx) {
      cats.push("Khác");
    }

    return cats;
  };

  const handleTypeChange = (newType: FilterType) => {
    setType(newType);
    setCategoryFilter("all");
    setDeletedCategoryFilter("all");
  };

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const displayTotal =
    type === "income" ? totalIncome : type === "expense" ? totalExpense : null;

  const getPieChartData = () => {
    const expenses = filteredTransactions.filter((tx) => tx.type === "expense");
    const categoryTotals: Record<string, { total: number; baseCat: string }> =
      {};
    expenses.forEach((tx) => {
      const catName = tx.categorySnapshot || tx.category;
      if (!categoryTotals[catName]) {
        categoryTotals[catName] = { total: 0, baseCat: tx.category };
      }
      categoryTotals[catName].total += tx.amount;
    });

    const total = Object.values(categoryTotals).reduce(
      (sum, v) => sum + v.total,
      0,
    );
    if (total === 0) return [];

    const colors = [
      "#ef4444",
      "#f97316",
      "#f59e0b",
      "#84cc16",
      "#10b981",
      "#06b6d4",
      "#3b82f6",
      "#8b5cf6",
      "#d946ef",
      "#f43f5e",
      "#64748b",
    ];

    return Object.keys(categoryTotals)
      .map((catName, index) => ({
        name: catName,
        population: categoryTotals[catName].total,
        color: colors[index % colors.length],
        baseCategory: categoryTotals[catName].baseCat,
      }))
      .sort((a, b) => b.population - a.population);
  };

  const getNoteDetailsForCategory = (catName: string) => {
    const expenses = filteredTransactions.filter((tx) => tx.type === "expense");
    const targetTxs = expenses.filter((tx) => {
      const txCat = tx.categorySnapshot || tx.category;
      // Nếu là group Khác trong biểu đồ tròn
      if (catName === "Khác") {
        return tx.category === "Khác";
      }
      return txCat === catName;
    });

    const noteGroups: Record<string, number> = {};
    targetTxs.forEach((tx) => {
      const noteLabel = tx.note?.trim() || "(Không có ghi chú)";
      noteGroups[noteLabel] = (noteGroups[noteLabel] || 0) + tx.amount;
    });

    return Object.entries(noteGroups)
      .map(([note, total]) => ({ note, total }))
      .sort((a, b) => b.total - a.total);
  };

  const getBarChartData = () => {
    let year, month;
    if (selectedMonth) {
      const parts = selectedMonth.split("-");
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth();
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dailyIncomes = new Array(daysInMonth).fill(0);
    const dailyExpenses = new Array(daysInMonth).fill(0);

    filteredTransactions.forEach((tx) => {
      const d = new Date(tx.timestamp);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (tx.type === "income") dailyIncomes[day - 1] += tx.amount;
        else if (tx.type === "expense") dailyExpenses[day - 1] += tx.amount;
      }
    });

    const barData = [];
    for (let i = 0; i < daysInMonth; i++) {
      const dayStr = (i + 1).toString();
      barData.push({
        value: dailyIncomes[i],
        frontColor: "#10b981", // Income Green
        spacing: 2,
        label: dayStr,
        labelTextStyle: { color: "#94a3b8", fontSize: 10 },
        onPress: () =>
          setSelectedBarData({
            day: dayStr,
            value: dailyIncomes[i],
            type: "Thu",
          }),
      });
      barData.push({
        value: dailyExpenses[i],
        frontColor: "#ef4444", // Expense Red
        spacing: 16,
        onPress: () =>
          setSelectedBarData({
            day: dayStr,
            value: dailyExpenses[i],
            type: "Chi",
          }),
      });
    }

    return barData;
  };

  const renderBarChartContent = () => {
    const barData = getBarChartData();
    const chartWidth = Math.max(screenWidth - 40, (barData.length / 2) * 45);

    return (
      <View style={{ flex: 1, paddingBottom: 20 }}>
        <View style={styles.barChartHeader}>
          {selectedBarData ? (
            <Text style={styles.barTooltipText}>
              Ngày {selectedBarData.day} - {selectedBarData.type}:{" "}
              {formatCurrency(selectedBarData.value)} đ
            </Text>
          ) : (
            <Text style={styles.chartTitle}>Chạm vào cột để xem chi tiết</Text>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10 }}
        >
          <BarChart
            data={barData}
            width={chartWidth}
            height={220}
            barWidth={12}
            initialSpacing={10}
            noOfSections={5}
            yAxisThickness={0}
            xAxisThickness={0}
            yAxisTextStyle={{ color: "#94a3b8", fontSize: 10 }}
            formatYLabel={(label) => {
              const val = Number(label);
              if (val >= 1000) return (val / 1000).toFixed(0) + "k";
              return label;
            }}
            hideRules
          />
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Thống kê</Text>
          <TouchableOpacity
            onPress={() => setShowPieChartModal(true)}
            style={styles.chartButton}
          >
            <PieChartIcon color="#3b82f6" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodFilters}
        >
          {(["day", "month", "year", "custom", "all"] as FilterPeriod[]).map(
            (p) => {
              let label = "";
              if (p === "day") label = "Hôm nay";
              else if (p === "month")
                label = period === "month" ? getMonthBadgeLabel() : "Tháng";
              else if (p === "year")
                label = period === "year" ? getYearBadgeLabel() : "Năm";
              else if (p === "custom") label = "Tùy chỉnh";
              else if (p === "all") label = "Tất cả";
              return (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.periodBadge,
                    period === p && styles.periodBadgeActive,
                  ]}
                  onPress={() => {
                    setPeriod(p);
                    if (p === "month") setShowMonthModal(true);
                    else if (p === "year") setShowYearModal(true);
                  }}
                >
                  <Text
                    style={[
                      styles.periodText,
                      period === p && styles.periodTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            },
          )}
        </ScrollView>

        {period === "custom" && (
          <View style={styles.customDateContainer}>
            <Text style={styles.dateLabel}>Từ:</Text>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowPicker("start")}
            >
              <Text style={styles.dateBtnText}>
                {formatDateShort(customStartDate)}
              </Text>
            </TouchableOpacity>

            <Text style={styles.dateLabel}>Đến:</Text>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowPicker("end")}
            >
              <Text style={styles.dateBtnText}>
                {formatDateShort(customEndDate)}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.typeTabs}>
          <TouchableOpacity
            style={[styles.typeTab, type === "all" && styles.typeTabActive]}
            onPress={() => handleTypeChange("all")}
          >
            <Text
              style={[
                styles.typeTabText,
                type === "all" && styles.typeTabTextActive,
              ]}
            >
              Tất cả
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeTab,
              type === "expense" && styles.typeTabActiveExpense,
            ]}
            onPress={() => handleTypeChange("expense")}
          >
            <Text
              style={[
                styles.typeTabText,
                type === "expense" && styles.typeTabTextActive,
              ]}
            >
              Chi Tiền
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeTab,
              type === "income" && styles.typeTabActiveIncome,
            ]}
            onPress={() => handleTypeChange("income")}
          >
            <Text
              style={[
                styles.typeTabText,
                type === "income" && styles.typeTabTextActive,
              ]}
            >
              Thu Tiền
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryFilters}
        >
          <TouchableOpacity
            style={[
              styles.categoryBadge,
              categoryFilter === "all" && styles.categoryBadgeActive,
            ]}
            onPress={() => setCategoryFilter("all")}
          >
            <Text
              style={[
                styles.categoryText,
                categoryFilter === "all" && styles.categoryTextActive,
              ]}
            >
              Tất cả
            </Text>
          </TouchableOpacity>
          {getFilterCategories().map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryBadge,
                categoryFilter === cat && styles.categoryBadgeActive,
              ]}
              onPress={() => setCategoryFilter(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  categoryFilter === cat && styles.categoryTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sub-filter khi chọn "Khác" — hiển thị danh mục đã bị xóa */}
        {categoryFilter === "Khác" && (
          <View style={styles.deletedSubFilter}>
            <Text style={styles.deletedSubFilterLabel}>
              📂 Lọc theo danh mục đã xóa:
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryFilters}
            >
              <TouchableOpacity
                style={[
                  styles.deletedCatBadge,
                  deletedCategoryFilter === "all" &&
                    styles.deletedCatBadgeActive,
                ]}
                onPress={() => setDeletedCategoryFilter("all")}
              >
                <Text
                  style={[
                    styles.deletedCatText,
                    deletedCategoryFilter === "all" &&
                      styles.deletedCatTextActive,
                  ]}
                >
                  Tất cả
                </Text>
              </TouchableOpacity>
              {getDeletedCategoryOptions().map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.deletedCatBadge,
                    deletedCategoryFilter === cat &&
                      styles.deletedCatBadgeActive,
                  ]}
                  onPress={() => setDeletedCategoryFilter(cat)}
                >
                  <Text
                    style={[
                      styles.deletedCatText,
                      deletedCategoryFilter === cat &&
                        styles.deletedCatTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <FlatList
        data={filteredTransactions.slice(0, displayLimit)}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        // ListHeaderComponent={
        //   period === "month" ? (
        //     <View style={styles.barChartButtonContainer}>
        //       <TouchableOpacity
        //         style={styles.openBarChartBtn}
        //         onPress={() => {
        //           navigation.navigate("BarChart", {
        //             selectedMonth,
        //           });
        //         }}
        //       >
        //         <BarChart2 color="#3b82f6" size={20} />
        //         <Text style={styles.openBarChartBtnText}>Xem biểu đồ chi tiêu</Text>
        //       </TouchableOpacity>
        //     </View>
        //   ) : null
        // }
        onEndReached={() => {
          if (displayLimit < filteredTransactions.length) {
            setDisplayLimit((prev) => prev + 10);
          }
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có giao dịch nào.</Text>
          </View>
        }
      />

      {displayTotal !== null && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelBold}>Tổng:</Text>
            <Text
              style={[
                styles.summaryAmount,
                { color: type === "income" ? "#10b981" : "#ef4444" },
              ]}
            >
              {type === "expense" ? "-" : "+"}
              {formatCurrency(displayTotal)} đ
            </Text>
          </View>
        </View>
      )}

      {showPicker && (
        <DateTimePicker
          value={showPicker === "start" ? customStartDate : customEndDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Modal chọn tháng */}
      <Modal
        visible={showMonthModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMonthModal(false)}
        >
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn tháng</Text>
              <TouchableOpacity onPress={() => setShowMonthModal(false)}>
                <X color="#64748b" size={20} />
              </TouchableOpacity>
            </View>
            {availableMonths.length === 0 ? (
              <Text style={styles.modalEmpty}>Chưa có giao dịch nào</Text>
            ) : (
              <ScrollView
                style={styles.modalScroll}
                showsVerticalScrollIndicator={false}
              >
                {availableMonths.map((m) => {
                  const now = new Date();
                  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
                  const isSelected = (selectedMonth ?? currentMonth) === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.modalItem,
                        isSelected && styles.modalItemActive,
                      ]}
                      onPress={() => {
                        setSelectedMonth(m);
                        setShowMonthModal(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.modalItemText,
                          isSelected && styles.modalItemTextActive,
                        ]}
                      >
                        {formatMonthDisplay(m)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal chọn năm */}
      <Modal
        visible={showYearModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowYearModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearModal(false)}
        >
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn năm</Text>
              <TouchableOpacity onPress={() => setShowYearModal(false)}>
                <X color="#64748b" size={20} />
              </TouchableOpacity>
            </View>
            {availableYears.length === 0 ? (
              <Text style={styles.modalEmpty}>Chưa có giao dịch nào</Text>
            ) : (
              <ScrollView
                style={styles.modalScroll}
                showsVerticalScrollIndicator={false}
              >
                {availableYears.map((y) => {
                  const isSelected =
                    (selectedYear ?? new Date().getFullYear()) === y;
                  return (
                    <TouchableOpacity
                      key={y}
                      style={[
                        styles.modalItem,
                        isSelected && styles.modalItemActive,
                      ]}
                      onPress={() => {
                        setSelectedYear(y);
                        setShowYearModal(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.modalItemText,
                          isSelected && styles.modalItemTextActive,
                        ]}
                      >
                        Năm {y}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal biểu đồ tròn */}
      <Modal
        visible={showPieChartModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPieChartModal(false)}
      >
        <View style={styles.pieModalOverlay}>
          <View style={styles.pieModalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cơ cấu Chi Tiền</Text>
              <TouchableOpacity
                onPress={() => setShowPieChartModal(false)}
                style={{
                  padding: 8,
                  backgroundColor: "#f1f5f9",
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "#0f172a", fontWeight: "bold" }}>
                  Đóng
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pieChartWrapper}>
              <CustomPieChart
                data={getPieChartData()}
                selectedCategory={selectedPieCategory}
                onSelectCategory={setSelectedPieCategory}
                renderNoteDetails={(catName) => {
                  const details = getNoteDetailsForCategory(catName);
                  return (
                    <View>
                      {details.map((item, idx) => (
                        <View key={idx} style={styles.inlineNoteItem}>
                          <Text style={styles.inlineNoteText}>• {item.note}</Text>
                          <Text style={styles.inlineNoteAmount}>{formatCurrency(item.total)} đ</Text>
                        </View>
                      ))}
                    </View>
                  );
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal biểu đồ cột */}
      <Modal
        visible={showBarChartModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBarChartModal(false)}
      >
        <View style={styles.pieModalOverlay}>
          <View style={styles.pieModalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Biểu đồ Thu / Chi tháng</Text>
              <TouchableOpacity onPress={() => setShowBarChartModal(false)}>
                <X color="#64748b" size={20} />
              </TouchableOpacity>
            </View>
            {renderBarChartContent()}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#ffffff",
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
  },
  chartButton: {
    padding: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
  },
  barChartContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#334155",
    marginLeft: 16,
    marginBottom: 12,
  },
  pieModalOverlay: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  pieModalBox: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingBottom: 32,
    paddingTop: 40,
  },
  pieChartWrapper: {
    alignItems: "center",
    paddingVertical: 10,
    flex: 1, // Để danh sách chiếm hết phần còn lại
  },
  inlineNoteItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  inlineNoteText: {
    fontSize: 13,
    color: "#475569",
    flex: 1,
  },
  inlineNoteAmount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e293b",
  },
  barChartHeader: {
    padding: 16,
    alignItems: "center",
  },
  barTooltipText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3b82f6",
  },
  barChartButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  openBarChartBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  openBarChartBtnText: {
    color: "#3b82f6",
    fontWeight: "bold",
    fontSize: 16,
  },
  filterSection: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  periodFilters: {
    paddingHorizontal: 16,
    gap: 8,
  },
  periodBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  periodBadgeActive: {
    backgroundColor: "#3b82f6",
  },
  periodText: {
    color: "#64748b",
    fontWeight: "600",
  },
  periodTextActive: {
    color: "#ffffff",
  },
  customDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  dateLabel: {
    color: "#64748b",
    fontWeight: "500",
  },
  dateBtn: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  dateBtnText: {
    color: "#334155",
    fontWeight: "500",
  },
  typeTabs: {
    flexDirection: "row",
    marginTop: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  typeTabActive: { backgroundColor: "#3b82f6" },
  typeTabActiveExpense: { backgroundColor: "#ef4444" },
  typeTabActiveIncome: { backgroundColor: "#10b981" },
  typeTabText: {
    fontWeight: "600",
    color: "#64748b",
  },
  typeTabTextActive: {
    color: "#ffffff",
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
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  categoryBadgeActive: {
    backgroundColor: "#475569",
    borderColor: "#475569",
  },
  categoryText: {
    color: "#64748b",
    fontWeight: "500",
    fontSize: 13,
  },
  categoryTextActive: {
    color: "#ffffff",
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardCategory: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
  },
  cardName: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
    fontStyle: "italic",
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  expenseText: {
    color: "#ef4444",
  },
  incomeText: {
    color: "#10b981",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardDate: {
    fontSize: 14,
    color: "#94a3b8",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 16,
  },
  summaryContainer: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: "#64748b",
  },
  summaryLabelBold: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#334155",
  },
  summaryIncome: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10b981",
  },
  summaryExpense: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
  },
  summaryNetTop: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    marginBottom: 0,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  // Sub-filter danh mục đã xóa
  deletedSubFilter: {
    backgroundColor: "#fff7ed",
    borderTopWidth: 1,
    borderTopColor: "#fed7aa",
    paddingTop: 10,
    paddingBottom: 4,
  },
  deletedSubFilterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#c2410c",
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  deletedCatBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fb923c",
    backgroundColor: "#fff7ed",
  },
  deletedCatBadgeActive: {
    backgroundColor: "#ea580c",
    borderColor: "#ea580c",
  },
  deletedCatText: {
    color: "#c2410c",
    fontWeight: "600",
    fontSize: 13,
  },
  deletedCatTextActive: {
    color: "#ffffff",
  },
  // Modal chọn tháng/năm
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalBox: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    width: "100%",
    maxHeight: 420,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0f172a",
  },
  modalScroll: {
    maxHeight: 340,
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  modalItemActive: {
    backgroundColor: "#eff6ff",
  },
  modalItemText: {
    fontSize: 16,
    color: "#334155",
    fontWeight: "500",
  },
  modalItemTextActive: {
    color: "#3b82f6",
    fontWeight: "700",
  },
  modalEmpty: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 15,
    paddingVertical: 32,
  },
});

export default StatisticsScreen;
