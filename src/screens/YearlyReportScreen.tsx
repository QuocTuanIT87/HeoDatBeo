import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Alert } from "../components/CustomAlert";
import { storage } from "../store/storage";
import { Transaction, CategoryBudget, UserProfile } from "../types";
import { formatCurrency } from "../utils/format";
import { resolveCategoryName } from "../utils/category";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { ArrowLeft, Share2 } from "lucide-react-native";
import { exportYearlyPdfReport } from "../utils/pdfReport";
import { styles } from "../styles/YearlyReportScreen";

const YearlyReportScreen = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const p = await storage.getUserProfile();
      setProfile(p);

      const budgets = await storage.getCategoryBudgets();
      setCategoryBudgets(budgets);

      const txs = await storage.getTransactions();
      setTransactions(txs);

      // Determine available years
      const yearsSet = new Set<number>();
      txs.forEach((tx) => {
        if (tx.timestamp) {
          const y = new Date(tx.timestamp).getFullYear();
          if (!isNaN(y)) {
            yearsSet.add(y);
          }
        }
      });

      const currentYear = new Date().getFullYear();
      if (yearsSet.size === 0) {
        yearsSet.add(currentYear);
      }

      const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);
      setAvailableYears(sortedYears);

      // Default selection to current year if available, otherwise the latest year
      if (yearsSet.has(currentYear)) {
        setSelectedYear(currentYear);
      } else {
        setSelectedYear(sortedYears[0]);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Lỗi", "Không thể tải dữ liệu báo cáo.");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleExportPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await exportYearlyPdfReport(selectedYear);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Lỗi", e.message || "Không thể xuất file PDF báo cáo năm.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Helper to sort category totals with "Khác" at the very bottom
  const prepareCategoryEntries = (totals: Record<string, number>): [string, number][] => {
    const entries = Object.entries(totals);
    const nonKhacEntries = entries.filter(([cat]) => cat !== "Khác");
    nonKhacEntries.sort((a, b) => b[1] - a[1]);
    const khacAmount = totals["Khác"] || 0;
    return [...nonKhacEntries, ["Khác", khacAmount]];
  };

  // Helper to extract category details (notes and amounts)
  const getCategoryDetails = (txs: Transaction[], categoryName: string, type: "income" | "expense") => {
    const catTxs = txs.filter(
      (tx) => tx.type === type && resolveCategoryName(tx, profile, categoryBudgets) === categoryName
    );
    if (catTxs.length === 0) return null;

    const hasAnyNote = catTxs.some((tx) => tx.note && tx.note.trim() !== "");
    if (!hasAnyNote) return null;

    const noteGroups: Record<string, number> = {};
    let noNoteTotal = 0;

    catTxs.forEach((tx) => {
      const note = tx.note ? tx.note.trim() : "";
      if (note) {
        noteGroups[note] = (noteGroups[note] || 0) + tx.amount;
      } else {
        noNoteTotal += tx.amount;
      }
    });

    const sortedNotes = Object.entries(noteGroups).sort((a, b) => b[1] - a[1]);

    return {
      sortedNotes,
      noNoteTotal,
    };
  };

  // Data processing for selected year
  let yearTxs = transactions.filter((tx) => {
    const date = new Date(tx.timestamp);
    return date.getFullYear() === selectedYear;
  });

  // Exclude transfer/savings target like in Statistics Screen to match official stats and PDF
  yearTxs = yearTxs.filter(
    (tx) =>
      tx.categoryId !== "system_tiet_kiem" &&
      tx.categoryId !== "system_rut_tiet_kiem" &&
      tx.categoryId !== "system_xoa_quy" &&
      !tx.categoryId?.startsWith("fund_")
  );

  // Group transactions by month
  const monthlyData: Record<number, Transaction[]> = {};
  for (let m = 0; m < 12; m++) {
    monthlyData[m] = [];
  }

  yearTxs.forEach((tx) => {
    const month = new Date(tx.timestamp).getMonth();
    monthlyData[month].push(tx);
  });

  // Calculate Yearly stats
  let yearlyIncome = 0;
  let yearlyExpense = 0;
  const yearlyIncomeCategoryTotals: Record<string, number> = {};
  const yearlyExpenseCategoryTotals: Record<string, number> = {};

  yearTxs.forEach((tx) => {
    const isExpense = tx.type === "expense";
    if (isExpense) {
      yearlyExpense += tx.amount;
    } else {
      yearlyIncome += tx.amount;
    }

    const catName = resolveCategoryName(tx, profile, categoryBudgets);
    if (isExpense) {
      yearlyExpenseCategoryTotals[catName] = (yearlyExpenseCategoryTotals[catName] || 0) + tx.amount;
    } else {
      yearlyIncomeCategoryTotals[catName] = (yearlyIncomeCategoryTotals[catName] || 0) + tx.amount;
    }
  });

  const yearlyNet = yearlyIncome - yearlyExpense;
  const netSign = yearlyNet >= 0 ? "+" : "";
  const netColorStyle = yearlyNet >= 0 ? styles.valueIncome : styles.valueExpense;

  const sortedYearlyIncomes = prepareCategoryEntries(yearlyIncomeCategoryTotals);
  const sortedYearlyExpenses = prepareCategoryEntries(yearlyExpenseCategoryTotals);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          disabled={isGeneratingPdf}
        >
          <ArrowLeft color="#0f172a" size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Báo cáo năm</Text>
        <TouchableOpacity
          onPress={handleExportPdf}
          style={styles.exportButton}
          disabled={isGeneratingPdf || isLoadingData}
        >
          <Share2 color="#f43f5e" size={20} />
        </TouchableOpacity>
      </View>

      {/* Generating PDF Loading Overlay */}
      {isGeneratingPdf && (
        <View style={styles.pdfLoadingOverlay}>
          <ActivityIndicator size="large" color="#f43f5e" />
          <Text style={styles.pdfLoadingText}>Đang tạo PDF báo cáo...</Text>
        </View>
      )}

      {/* Year Selector Horizontal Scroll */}
      <View style={styles.yearScrollContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.yearScrollContent}
        >
          {availableYears.map((year) => (
            <TouchableOpacity
              key={year}
              style={[
                styles.yearItem,
                selectedYear === year && styles.yearItemActive,
              ]}
              onPress={() => setSelectedYear(year)}
              disabled={isGeneratingPdf || isLoadingData}
            >
              <Text
                style={[
                  styles.yearText,
                  selectedYear === year && styles.yearTextActive,
                ]}
              >
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content */}
      {isLoadingData ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#f43f5e" />
        </View>
      ) : yearTxs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không có dữ liệu giao dịch cho năm {selectedYear}.</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Banner in PDF design */}
          <View style={styles.pdfLikeBanner}>
            <Text style={styles.appTitle}>🐷 Ứng Dụng Quản Lý Chi Tiêu Heo Đất Béo 🐷</Text>
            <Text style={styles.reportTitle}>Báo Cáo Tài Chính Năm {selectedYear}</Text>
            <Text style={styles.metaText}>
              Báo cáo hiển thị theo format định dạng xuất file PDF
            </Text>
          </View>

          {/* Section Summary Row */}
          <Text style={styles.sectionTitle}>TỔNG HỢP CẢ NĂM {selectedYear}</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Tổng Thu Nhập</Text>
              <Text style={[styles.summaryValue, styles.valueIncome]}>
                +{formatCurrency(yearlyIncome)} đ
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Tổng Chi Tiêu</Text>
              <Text style={[styles.summaryValue, styles.valueExpense]}>
                -{formatCurrency(yearlyExpense)} đ
              </Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Tích Lũy Ròng</Text>
              <Text style={[styles.summaryValue, netColorStyle]}>
                {netSign}{formatCurrency(yearlyNet)} đ
              </Text>
            </View>
          </View>

          {/* Income categories table card */}
          <View style={styles.tableCard}>
            <Text style={[styles.tableTitle, styles.valueIncome]}>🟢 Thu Nhập Theo Danh Mục</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Danh mục</Text>
              <Text style={styles.tableHeaderText}>Tổng thu</Text>
            </View>
            {sortedYearlyIncomes.length === 0 || yearlyIncome === 0 ? (
              <Text style={styles.noDataText}>Không có dữ liệu thu nhập</Text>
            ) : (
              sortedYearlyIncomes.map(([cat, amount]) => {
                if (amount === 0) return null;
                const details = getCategoryDetails(yearTxs, cat, "income");
                return (
                  <View key={cat} style={{ borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
                    <View style={styles.categoryRow}>
                      <View style={styles.categoryNameWrapperIncome}>
                        <Text style={styles.categoryName}>{cat}</Text>
                      </View>
                      <Text style={[styles.categoryAmount, styles.valueIncome]}>
                        +{formatCurrency(amount)} đ
                      </Text>
                    </View>
                    {/* Render Category Details if any notes exist */}
                    {details && (
                      <View style={styles.detailsContainer}>
                        <Text style={styles.detailsTitle}>Chi tiết ghi chú:</Text>
                        {details.sortedNotes.map(([note, noteAmt]) => (
                          <View key={note} style={styles.detailItem}>
                            <Text style={styles.detailBullet}>•</Text>
                            <Text style={styles.detailText}>{note}</Text>
                            <Text style={[styles.detailAmount, styles.valueIncome]}>
                              +{formatCurrency(noteAmt)} đ
                            </Text>
                          </View>
                        ))}
                        {details.noNoteTotal > 0 && (
                          <View style={styles.detailItem}>
                            <Text style={styles.detailBullet}>•</Text>
                            <Text style={styles.detailText}>Không ghi chú</Text>
                            <Text style={[styles.detailAmount, styles.valueIncome]}>
                              +{formatCurrency(details.noNoteTotal)} đ
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>

          {/* Expense categories table card */}
          <View style={styles.tableCard}>
            <Text style={[styles.tableTitle, styles.valueExpense]}>🔴 Chi Tiêu Theo Danh Mục</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Danh mục</Text>
              <Text style={styles.tableHeaderText}>Tổng chi</Text>
            </View>
            {sortedYearlyExpenses.length === 0 || yearlyExpense === 0 ? (
              <Text style={styles.noDataText}>Không có dữ liệu chi tiêu</Text>
            ) : (
              sortedYearlyExpenses.map(([cat, amount]) => {
                if (amount === 0) return null;
                const details = getCategoryDetails(yearTxs, cat, "expense");
                return (
                  <View key={cat} style={{ borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
                    <View style={styles.categoryRow}>
                      <View style={styles.categoryNameWrapperExpense}>
                        <Text style={styles.categoryName}>{cat}</Text>
                      </View>
                      <Text style={[styles.categoryAmount, styles.valueExpense]}>
                        -{formatCurrency(amount)} đ
                      </Text>
                    </View>
                    {/* Render Category Details if any notes exist */}
                    {details && (
                      <View style={styles.detailsContainer}>
                        <Text style={styles.detailsTitle}>Chi tiết ghi chú:</Text>
                        {details.sortedNotes.map(([note, noteAmt]) => (
                          <View key={note} style={styles.detailItem}>
                            <Text style={styles.detailBullet}>•</Text>
                            <Text style={styles.detailText}>{note}</Text>
                            <Text style={[styles.detailAmount, styles.valueExpense]}>
                              -{formatCurrency(noteAmt)} đ
                            </Text>
                          </View>
                        ))}
                        {details.noNoteTotal > 0 && (
                          <View style={styles.detailItem}>
                            <Text style={styles.detailBullet}>•</Text>
                            <Text style={styles.detailText}>Không ghi chú</Text>
                            <Text style={[styles.detailAmount, styles.valueExpense]}>
                              -{formatCurrency(details.noNoteTotal)} đ
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>

          {/* Monthly Details */}
          {Array.from({ length: 12 }, (_, i) => i).map((m) => {
            const monthTxs = monthlyData[m];
            if (monthTxs.length === 0) return null;

            // Calculate monthly stats
            let mIncome = 0;
            let mExpense = 0;
            const mIncomeCategoryTotals: Record<string, number> = {};
            const mExpenseCategoryTotals: Record<string, number> = {};

            monthTxs.forEach((tx) => {
              const isExpense = tx.type === "expense";
              if (isExpense) {
                mExpense += tx.amount;
              } else {
                mIncome += tx.amount;
              }

              const catName = resolveCategoryName(tx, profile, categoryBudgets);
              if (isExpense) {
                mExpenseCategoryTotals[catName] = (mExpenseCategoryTotals[catName] || 0) + tx.amount;
              } else {
                mIncomeCategoryTotals[catName] = (mIncomeCategoryTotals[catName] || 0) + tx.amount;
              }
            });

            const mNet = mIncome - mExpense;
            const mNetSign = mNet >= 0 ? "+" : "";
            const mNetColorStyle = mNet >= 0 ? styles.valueIncome : styles.valueExpense;

            const sortedMIncomes = prepareCategoryEntries(mIncomeCategoryTotals);
            const sortedMExpenses = prepareCategoryEntries(mExpenseCategoryTotals);

            const monthStr = (m + 1).toString().padStart(2, "0");

            return (
              <View key={m} style={styles.monthSection}>
                <Text style={styles.monthTitle}>Tháng {monthStr}/{selectedYear}</Text>

                {/* Monthly Summary Cards */}
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Thu Tháng</Text>
                    <Text style={[styles.summaryValue, styles.valueIncome]}>
                      +{formatCurrency(mIncome)} đ
                    </Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Chi Tháng</Text>
                    <Text style={[styles.summaryValue, styles.valueExpense]}>
                      -{formatCurrency(mExpense)} đ
                    </Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Thặng Dư</Text>
                    <Text style={[styles.summaryValue, mNetColorStyle]}>
                      {mNetSign}{formatCurrency(mNet)} đ
                    </Text>
                  </View>
                </View>

                {/* Monthly Income Categories */}
                <View style={styles.monthTableCard}>
                  <Text style={[styles.monthTableTitle, styles.valueIncome]}>🟢 Thu Nhập Theo Danh Mục</Text>
                  <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderText}>Danh mục</Text>
                    <Text style={styles.tableHeaderText}>Tổng thu</Text>
                  </View>
                  {sortedMIncomes.length === 0 || mIncome === 0 ? (
                    <Text style={styles.noDataText}>Không có thu nhập</Text>
                  ) : (
                    sortedMIncomes.map(([cat, amount]) => {
                      if (amount === 0) return null;
                      const details = getCategoryDetails(monthTxs, cat, "income");
                      return (
                        <View key={cat} style={{ borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
                          <View style={styles.categoryRow}>
                            <View style={styles.categoryNameWrapperIncome}>
                              <Text style={styles.categoryName}>{cat}</Text>
                            </View>
                            <Text style={[styles.categoryAmount, styles.valueIncome]}>
                              +{formatCurrency(amount)} đ
                            </Text>
                          </View>
                          {details && (
                            <View style={styles.detailsContainer}>
                              <Text style={styles.detailsTitle}>Chi tiết ghi chú:</Text>
                              {details.sortedNotes.map(([note, noteAmt]) => (
                                <View key={note} style={styles.detailItem}>
                                  <Text style={styles.detailBullet}>•</Text>
                                  <Text style={styles.detailText}>{note}</Text>
                                  <Text style={[styles.detailAmount, styles.valueIncome]}>
                                    +{formatCurrency(noteAmt)} đ
                                  </Text>
                                </View>
                              ))}
                              {details.noNoteTotal > 0 && (
                                <View style={styles.detailItem}>
                                  <Text style={styles.detailBullet}>•</Text>
                                  <Text style={styles.detailText}>Không ghi chú</Text>
                                  <Text style={[styles.detailAmount, styles.valueIncome]}>
                                    +{formatCurrency(details.noNoteTotal)} đ
                                  </Text>
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                      );
                    })
                  )}
                </View>

                {/* Monthly Expense Categories */}
                <View style={styles.monthTableCard}>
                  <Text style={[styles.monthTableTitle, styles.valueExpense]}>🔴 Chi Tiêu Theo Danh Mục</Text>
                  <View style={styles.tableHeader}>
                    <Text style={styles.tableHeaderText}>Danh mục</Text>
                    <Text style={styles.tableHeaderText}>Tổng chi</Text>
                  </View>
                  {sortedMExpenses.length === 0 || mExpense === 0 ? (
                    <Text style={styles.noDataText}>Không có chi tiêu</Text>
                  ) : (
                    sortedMExpenses.map(([cat, amount]) => {
                      if (amount === 0) return null;
                      const details = getCategoryDetails(monthTxs, cat, "expense");
                      return (
                        <View key={cat} style={{ borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
                          <View style={styles.categoryRow}>
                            <View style={styles.categoryNameWrapperExpense}>
                              <Text style={styles.categoryName}>{cat}</Text>
                            </View>
                            <Text style={[styles.categoryAmount, styles.valueExpense]}>
                              -{formatCurrency(amount)} đ
                            </Text>
                          </View>
                          {details && (
                            <View style={styles.detailsContainer}>
                              <Text style={styles.detailsTitle}>Chi tiết ghi chú:</Text>
                              {details.sortedNotes.map(([note, noteAmt]) => (
                                <View key={note} style={styles.detailItem}>
                                  <Text style={styles.detailBullet}>•</Text>
                                  <Text style={styles.detailText}>{note}</Text>
                                  <Text style={[styles.detailAmount, styles.valueExpense]}>
                                    -{formatCurrency(noteAmt)} đ
                                  </Text>
                                </View>
                              ))}
                              {details.noNoteTotal > 0 && (
                                <View style={styles.detailItem}>
                                  <Text style={styles.detailBullet}>•</Text>
                                  <Text style={styles.detailText}>Không ghi chú</Text>
                                  <Text style={[styles.detailAmount, styles.valueExpense]}>
                                    -{formatCurrency(details.noNoteTotal)} đ
                                  </Text>
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                      );
                    })
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

export default YearlyReportScreen;
