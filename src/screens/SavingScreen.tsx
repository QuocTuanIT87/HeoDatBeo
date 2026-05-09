import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import {
  PiggyBank,
  Edit2,
  Info,
  History as HistoryIcon,
  Eye,
  EyeOff,
  PencilLine,
  PenOff,
  X,
} from "lucide-react-native";
import { storage } from "../store/storage";
import {
  Transaction,
  UserProfile,
  CategoryBudget,
  SavingHistoryItem,
} from "../types";
import { formatCurrency } from "../utils/format";
import Keypad from "../components/Keypad";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";

const SavingScreen = () => {
  const isFocused = useIsFocused();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [unallocated, setUnallocated] = useState<number>(0);
  const [savingBalance, setSavingBalance] = useState<number>(0);
  const [cooldownRemainingDays, setCooldownRemainingDays] = useState<number>(0);

  const [type, setType] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState<number>(0);
  const [showAmount, setShowAmount] = useState(true);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const manualInputRef = React.useRef<TextInput>(null);

  // Target editing
  const [targetInput, setTargetInput] = useState<string>("");
  const [isEditingTarget, setIsEditingTarget] = useState(false);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    const p = await storage.getUserProfile();
    const cats = await storage.getCategoryBudgets();

    if (!p) return;

    const transactions = await storage.getTransactions();
    const validTransactions = transactions.filter(
      (t) => t.timestamp >= p.initialBalanceTimestamp,
    );

    // Tính tiết kiệm từ transactions (Tổng số tiền đang có trong Heo)
    let calcSaving = 0;
    validTransactions.forEach((t) => {
      if (t.type === "expense" && t.category === "Tiết kiệm")
        calcSaving += t.amount;
      else if (
        t.type === "income" &&
        (t.category === "Tiết kiệm" || t.category === "Rút tiết kiệm")
      )
        calcSaving -= t.amount;
    });

    // --- KIỂM TRA CHUYỂN NĂM (ARCHIVE) ---
    if (p.savingYear && p.savingYear < currentYear) {
      const historyItem: SavingHistoryItem = {
        year: p.savingYear,
        target: p.savingTarget || 0,
        achieved: calcSaving,
        timestamp: Date.now(),
      };
      const updatedProfile: UserProfile = {
        ...p,
        savingYear: currentYear,
        savingTarget: undefined,
        savingTargetTimestamp: undefined,
        savingHistory: [...(p.savingHistory || []), historyItem],
      };
      await storage.saveUserProfile(updatedProfile);
      setProfile(updatedProfile);
      Alert.alert(
        "Năm mới đã đến! 🧧",
        `Hệ thống đã lưu lại kết quả tiết kiệm năm ${p.savingYear} vào lịch sử. Hãy đặt mục tiêu mới cho năm ${currentYear} nhé!`,
      );
    } else {
      setProfile(p);
      if (!p.savingYear) {
        // Lần đầu sử dụng hoặc migration
        await storage.saveUserProfile({ ...p, savingYear: currentYear });
      }
    }

    setSavingBalance(calcSaving);

    // Tổng số dư = tổng các danh mục + số chưa phân bổ
    const totalAllocated = cats.reduce(
      (sum: number, c: CategoryBudget) => sum + c.budget,
      0,
    );
    const unalloc = Math.max(0, p.initialBalance - totalAllocated);
    setUnallocated(unalloc);
    setTotalBalance(totalAllocated + unalloc);

    // Tính ngày chờ rút tiền
    const withdrawals = transactions.filter(
      (t) => t.category === "Rút tiết kiệm",
    );
    if (withdrawals.length > 0) {
      const lastWithdrawal = Math.max(...withdrawals.map((t) => t.timestamp));
      const diffMs = Date.now() - lastWithdrawal;
      const diffDays = diffMs / (24 * 60 * 60 * 1000);
      setCooldownRemainingDays(diffDays < 7 ? Math.ceil(7 - diffDays) : 0);
    } else {
      setCooldownRemainingDays(0);
    }

    if (p.savingTarget) {
      setTargetInput(formatMoneyInput(p.savingTarget.toString()));
    }
  };

  const toggleInputMethod = async () => {
    const newMethod = profile?.inputMethod === "manual" ? "keypad" : "manual";
    if (profile) {
      const updatedProfile = {
        ...profile,
        inputMethod: newMethod as "manual" | "keypad",
      };
      setProfile(updatedProfile);
      await storage.saveUserProfile(updatedProfile);
    }
  };

  const formatMoneyInput = (text: string) => {
    const numericValue = text.replace(/[^0-9-]/g, "");
    if (!numericValue) return "";
    return parseInt(numericValue, 10).toLocaleString("vi-VN");
  };

  const canEditTarget = () => {
    if (!profile?.savingTargetTimestamp) return true;
    const days30 = 30 * 24 * 60 * 60 * 1000;
    return Date.now() - profile.savingTargetTimestamp >= days30;
  };

  const getDaysUntilEdit = () => {
    if (!profile?.savingTargetTimestamp) return 0;
    const days30 = 30 * 24 * 60 * 60 * 1000;
    const timePassed = Date.now() - profile.savingTargetTimestamp;
    if (timePassed >= days30) return 0;
    return Math.ceil((days30 - timePassed) / (24 * 60 * 60 * 1000));
  };

  const handleSaveTarget = async () => {
    const numTarget = parseInt(targetInput.replace(/[^\d]/g, ""), 10);
    if (isNaN(numTarget) || numTarget <= 0) {
      Alert.alert("Lỗi", "Vui lòng nhập mục tiêu hợp lệ.");
      return;
    }

    if (profile) {
      const updatedProfile = {
        ...profile,
        savingTarget: numTarget,
        savingTargetTimestamp: Date.now(),
        savingYear: currentYear,
      };
      await storage.saveUserProfile(updatedProfile);
      setProfile(updatedProfile);
      setIsEditingTarget(false);
      Alert.alert(
        "Thành công",
        `Đã thiết lập mục tiêu tiết kiệm cho năm ${currentYear}.`,
      );
    }
  };

  const executeTransaction = async () => {
    if (!profile?.savingTarget) {
      Alert.alert(
        "Chưa có mục tiêu",
        `Vui lòng đặt mục tiêu tiết kiệm cho năm ${currentYear} trước.`,
      );
      setIsEditingTarget(true);
      return;
    }

    if (amount <= 0) {
      Alert.alert("Chưa nhập số tiền", "Vui lòng nhập số tiền hợp lệ.");
      return;
    }

    if (type === "deposit" && amount > unallocated) {
      Alert.alert(
        "Lỗi",
        `Số dư chưa phân bổ (${formatCurrency(unallocated)} đ) không đủ.`,
      );
      return;
    }

    if (type === "withdraw") {
      if (amount > 500000) {
        Alert.alert("Không thể rút", "Mỗi lần chỉ được rút tối đa 500.000 đ.");
        return;
      }
      if (amount > savingBalance) {
        Alert.alert("Lỗi", "Số dư tiết kiệm không đủ.");
        return;
      }
      if (cooldownRemainingDays > 0) {
        Alert.alert(
          "Chưa thể rút",
          `Vui lòng đợi thêm ${cooldownRemainingDays} ngày nữa.`,
        );
        return;
      }

      const nowTs = new Date();
      const timeStr = `${nowTs.getHours().toString().padStart(2, "0")}:${nowTs.getMinutes().toString().padStart(2, "0")} - ${nowTs.getDate().toString().padStart(2, "0")}/${(nowTs.getMonth() + 1).toString().padStart(2, "0")}/${nowTs.getFullYear()}`;

      Alert.alert(
        "Xác nhận rút tiền",
        `Bạn rút ${formatCurrency(amount)} đ từ Heo Đất vào lúc:\n${timeStr}.\n\nBạn có chắc chắn muốn rút không?`,
        [
          { text: "Hủy bỏ", style: "cancel" },
          { text: "Đồng ý rút", onPress: () => performExecution() },
        ],
      );
    } else {
      performExecution();
    }
  };

  const performExecution = async () => {
    setManualModalVisible(false);
    if (profile) {
      const updatedProfile = {
        ...profile,
        initialBalance:
          type === "deposit"
            ? profile.initialBalance - amount
            : profile.initialBalance + amount,
      };
      await storage.saveUserProfile(updatedProfile);
    }

    const txCategory = type === "deposit" ? "Tiết kiệm" : "Rút tiết kiệm";
    const newTx: Transaction = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type: type === "deposit" ? "expense" : "income",
      amount,
      category: txCategory,
      categorySnapshot: txCategory,
      name: type === "deposit" ? "Nuôi heo béo" : "Rút tiền từ Heo Đất",
      timestamp: Date.now(),
    };

    await storage.saveTransaction(newTx);
    setAmount(0);
    loadData();
    Alert.alert(
      "Thành công",
      type === "deposit"
        ? "Đã nạp tiền vào Heo Đất thành công! 🐷"
        : "Đã rút tiền từ Heo Đất thành công! 💰",
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <PiggyBank color="#ffffff" size={28} />
            <Text style={styles.headerTitle}>Heo Đất {currentYear}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TouchableOpacity
              onPress={() => setShowAmount(!showAmount)}
              style={styles.eyeBtn}
            >
              {showAmount ? (
                <Eye color="#ffffff" size={24} />
              ) : (
                <EyeOff color="#ffffff" size={24} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("SavingHistory")}
              style={styles.historyBtn}
            >
              <HistoryIcon color="#ffffff" size={24} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.balancesContainer}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Số dư tổng</Text>
            <Text style={styles.balanceAmount}>
              {showAmount ? `${formatCurrency(totalBalance)} đ` : "******"}
            </Text>
          </View>
          <View style={styles.balanceRowDivider} />
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Chưa phân bổ</Text>
            <Text
              style={[
                styles.balanceAmount,
                { color: unallocated <= 0 ? "#fca5a5" : "#ffffff" },
              ]}
            >
              {showAmount ? `${formatCurrency(unallocated)} đ` : "******"}
            </Text>
          </View>
          <View style={styles.balanceRowDivider} />
          <View style={[styles.balanceRow, { marginBottom: 0 }]}>
            <Text style={styles.balanceLabel}>Đang có trong Heo</Text>
            <Text style={[styles.balanceAmount, { color: "#fcd34d" }]}>
              {showAmount ? `${formatCurrency(savingBalance)} đ` : "******"}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
      >
        <View style={styles.targetCard}>
          <View style={styles.targetHeader}>
            <Text style={styles.sectionTitle}>Mục tiêu năm {currentYear}</Text>
            {profile?.savingHistory && profile.savingHistory.length > 0 && (
              <TouchableOpacity
                onPress={() => navigation.navigate("SavingHistory")}
                style={styles.viewHistoryBtn}
              >
                <Text style={styles.viewHistoryText}>Xem lịch sử</Text>
              </TouchableOpacity>
            )}
          </View>

          {profile?.savingTarget ? (
            <View>
              {isEditingTarget ? (
                <View style={styles.targetEditRow}>
                  <TextInput
                    style={styles.targetInput}
                    keyboardType="numeric"
                    value={targetInput}
                    onChangeText={(text) =>
                      setTargetInput(formatMoneyInput(text))
                    }
                    placeholder="Nhập số tiền..."
                  />
                  <TouchableOpacity
                    style={styles.saveTargetBtn}
                    onPress={handleSaveTarget}
                  >
                    <Text style={styles.saveTargetBtnText}>Lưu</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setIsEditingTarget(false)}
                  >
                    <Text style={styles.cancelBtnText}>Hủy</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.targetDisplayRow}>
                  <Text style={styles.targetValueText}>
                    {showAmount
                      ? `${formatCurrency(profile.savingTarget)} đ`
                      : "******"}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.editBtn,
                      !canEditTarget() && styles.editBtnDisabled,
                    ]}
                    onPress={() => {
                      if (canEditTarget()) {
                        setTargetInput(
                          formatMoneyInput(profile.savingTarget!.toString()),
                        );
                        setIsEditingTarget(true);
                      } else {
                        Alert.alert(
                          "Thông báo",
                          `Bạn chỉ có thể sửa mục tiêu sau ${getDaysUntilEdit()} ngày nữa.`,
                        );
                      }
                    }}
                  >
                    <Edit2
                      color={canEditTarget() ? "#3b82f6" : "#94a3b8"}
                      size={18}
                    />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min(100, (savingBalance / profile.savingTarget) * 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                Đạt được{" "}
                {((savingBalance / profile.savingTarget) * 100).toFixed(1)}% mục
                tiêu
              </Text>
              {!canEditTarget() && !isEditingTarget && (
                <Text style={styles.cooldownText}>
                  * Có thể sửa lại sau {getDaysUntilEdit()} ngày
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.targetEditRow}>
              <TextInput
                style={styles.targetInput}
                keyboardType="numeric"
                value={targetInput}
                onChangeText={(text) => setTargetInput(formatMoneyInput(text))}
                placeholder="Nhập mục tiêu năm mới..."
              />
              <TouchableOpacity
                style={styles.saveTargetBtn}
                onPress={handleSaveTarget}
              >
                <Text style={styles.saveTargetBtnText}>Đặt mục tiêu</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, type === "deposit" && styles.tabActiveDeposit]}
            onPress={() => setType("deposit")}
          >
            <Text
              style={[
                styles.tabText,
                type === "deposit" && styles.tabTextActive,
              ]}
            >
              Nạp Heo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              type === "withdraw" && styles.tabActiveWithdraw,
            ]}
            onPress={() => setType("withdraw")}
          >
            <Text
              style={[
                styles.tabText,
                type === "withdraw" && styles.tabTextActive,
              ]}
            >
              Rút Tiền
            </Text>
          </TouchableOpacity>
        </View>

        {type === "withdraw" && cooldownRemainingDays > 0 ? (
          <View style={styles.cooldownContainer}>
            <View style={styles.cooldownCircle}>
              <Text style={styles.cooldownBigNumber}>
                {cooldownRemainingDays}
              </Text>
              <Text style={styles.cooldownDaysLabel}>Ngày chờ</Text>
            </View>
            <View style={styles.withdrawNotice}>
              <Info color="#ef4444" size={16} />
              <Text style={styles.withdrawNoticeText}>
                Bạn chỉ có thể rút tiết kiệm mỗi 7 ngày một lần.
              </Text>
            </View>
          </View>
        ) : (
          <>
            {type === "withdraw" && (
              <View style={styles.withdrawNotice}>
                <Info color="#ef4444" size={16} />
                <Text style={styles.withdrawNoticeText}>
                  Mỗi 7 ngày được rút 1 lần, tối đa 500.000đ/lần.
                </Text>
              </View>
            )}
            <View
              style={[
                styles.amountDisplay,
                type === "withdraw"
                  ? styles.borderWithdraw
                  : styles.borderDeposit,
              ]}
            >
              <Text
                style={[
                  styles.amountText,
                  type === "deposit" ? styles.depositText : styles.withdrawText,
                ]}
              >
                {formatCurrency(amount)}
              </Text>
              <Text style={styles.currencyLabel}>VNĐ</Text>
            </View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                {profile?.inputMethod === "manual"
                  ? "Nhập số tiền"
                  : "Chọn mệnh giá"}
              </Text>
              <TouchableOpacity
                style={styles.quickToggleBtnCircle}
                onPress={toggleInputMethod}
              >
                {profile?.inputMethod !== "manual" ? (
                  <PencilLine size={18} color="#3b82f6" />
                ) : (
                  <PenOff size={18} color="#3b82f6" />
                )}
              </TouchableOpacity>
            </View>

            {profile?.inputMethod === "manual" ? (
              <View style={styles.manualInputSection}>
                <TouchableOpacity
                  style={styles.openManualBtn}
                  onPress={() => setManualModalVisible(true)}
                >
                  <Text style={styles.openManualBtnText}>
                    {amount > 0
                      ? formatCurrency(amount) + " đ"
                      : "Nhập số tiền"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Keypad
                amount={amount}
                onAddAmount={(v) => setAmount((p) => p + v)}
                onClear={() => setAmount(0)}
              />
            )}
            {profile?.inputMethod !== "manual" && (
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  type === "deposit" ? styles.saveDeposit : styles.saveWithdraw,
                ]}
                onPress={executeTransaction}
              >
                <Text style={styles.saveButtonText}>
                  {type === "deposit" ? "Xác Nhận Nạp" : "Xác Nhận Rút"}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Nhập Tiền Tiết Kiệm (Manual) */}
      <Modal
        visible={manualModalVisible}
        transparent
        animationType="slide"
        onShow={() => {
          setTimeout(() => {
            manualInputRef.current?.focus();
          }, 300);
        }}
        onRequestClose={() => setManualModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.manualInputModalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Nhập số tiền tiết kiệm</Text>
              <TouchableOpacity onPress={() => setManualModalVisible(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <TextInput
              ref={manualInputRef}
              style={styles.manualInputLarge}
              keyboardType="numeric"
              placeholder="0 đ"
              placeholderTextColor="#94a3b8"
              value={amount === 0 ? "" : amount.toLocaleString("vi-VN")}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9]/g, "");
                setAmount(numericValue ? parseInt(numericValue, 10) : 0);
              }}
            />

            <TouchableOpacity
              style={[
                styles.confirmManualBtn,
                type === "withdraw" && styles.saveWithdraw,
              ]}
              onPress={executeTransaction}
            >
              <Text style={styles.confirmManualBtnText}>
                {type === "deposit" ? "Xác nhận nạp" : "Xác nhận rút"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    backgroundColor: "#f59e0b",
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: { color: "#ffffff", fontSize: 24, fontWeight: "bold" },
  historyBtn: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
  },
  eyeBtn: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
  },
  balancesContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
    padding: 16,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  balanceRowDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 8,
  },
  balanceLabel: { color: "#fef3c7", fontSize: 14 },
  balanceAmount: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  body: { flex: 1 },
  bodyContent: { padding: 20 },
  targetCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  targetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#334155" },
  viewHistoryBtn: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewHistoryText: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  targetDisplayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  targetValueText: { fontSize: 24, fontWeight: "bold", color: "#0f172a" },
  editBtn: { padding: 8, backgroundColor: "#eff6ff", borderRadius: 8 },
  editBtnDisabled: { backgroundColor: "#f1f5f9" },
  targetEditRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  targetInput: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  saveTargetBtn: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveTargetBtnText: { color: "#fff", fontWeight: "bold" },
  cancelBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelBtnText: { color: "#fff", fontWeight: "bold" },
  progressContainer: {
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 8,
  },
  progressBar: { height: "100%", backgroundColor: "#10b981" },
  progressText: { fontSize: 13, color: "#64748b" },
  cooldownText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 8,
    fontStyle: "italic",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  tabActiveDeposit: { backgroundColor: "#f59e0b" },
  tabActiveWithdraw: { backgroundColor: "#ef4444" },
  tabText: { fontSize: 16, fontWeight: "600", color: "#64748b" },
  tabTextActive: { color: "#ffffff" },
  withdrawNotice: {
    flexDirection: "row",
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  withdrawNoticeText: {
    fontSize: 13,
    color: "#b91c1c",
    flex: 1,
    lineHeight: 18,
    fontWeight: "500",
  },
  amountDisplay: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 1,
  },
  borderDeposit: { borderColor: "#f59e0b", backgroundColor: "#fffbeb" },
  borderWithdraw: { borderColor: "#ef4444", backgroundColor: "#fef2f2" },
  amountText: { fontSize: 48, fontWeight: "bold" },
  depositText: { color: "#f59e0b" },
  withdrawText: { color: "#ef4444" },
  currencyLabel: {
    fontSize: 20,
    color: "#64748b",
    marginLeft: 8,
    marginTop: 16,
  },
  saveButton: {
    marginTop: 24,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  saveDeposit: { backgroundColor: "#f59e0b" },
  saveWithdraw: { backgroundColor: "#ef4444" },
  saveButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  cooldownContainer: { alignItems: "center", paddingVertical: 10 },
  cooldownCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    borderColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  cooldownBigNumber: { fontSize: 40, fontWeight: "bold", color: "#ef4444" },
  cooldownDaysLabel: { fontSize: 14, color: "#94a3b8" },
  // Manual Input Styles
  manualInputSection: {
    marginBottom: 10,
    marginTop: 10,
  },
  manualInput: {
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 16,
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "center",
  },
  clearManualBtn: {
    marginTop: 4,
    alignSelf: "flex-end",
    padding: 4,
  },
  clearManualBtnText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },
  openManualBtn: {
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#3b82f6",
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: "center",
    marginBottom: 10,
  },
  openManualBtnText: {
    color: "#3b82f6",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "flex-start",
    paddingTop: 80,
    paddingHorizontal: 12,
  },
  manualInputModalBox: {
    backgroundColor: "#ffffff",
    width: "100%",
    borderRadius: 24,
    padding: 24,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  manualInputLarge: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "center",
    paddingVertical: 24,
    borderBottomWidth: 2,
    borderBottomColor: "#e2e8f0",
    marginBottom: 24,
  },
  confirmManualBtn: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  confirmManualBtnText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  quickToggleBtnCircle: {
    backgroundColor: "#ffffff",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
});

export default SavingScreen;
