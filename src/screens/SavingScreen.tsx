import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Image,
} from "react-native";
import { Alert } from "../components/CustomAlert";
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
  LayoutGrid,
  Keyboard,
  ArrowUpCircle,
  ArrowDownCircle,
  RotateCcw,
  Coins,
  Bitcoin,
} from "lucide-react-native";
import { storage } from "../store/storage";
import {
  Transaction,
  UserProfile,
  CategoryBudget,
  SavingHistoryItem,
} from "../types";
import { formatCurrency, formatPercent } from "../utils/format";
import Keypad from "../components/Keypad";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { styles } from "../styles/SavingScreen";

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
  const [showAmount, setShowAmount] = useState(false);
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
      let lastWithdrawal = withdrawals[0].timestamp;
      for (let i = 1; i < withdrawals.length; i++) {
        if (withdrawals[i].timestamp > lastWithdrawal) {
          lastWithdrawal = withdrawals[i].timestamp;
        }
      }
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

    if (amount < 1000) {
      Alert.alert("Số tiền không đủ", "Vui lòng nhập số tiền ít nhất 1.000 đ.");
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
        {/* Top bar: Avatar + năm + actions */}
        <View style={styles.headerTopBar}>
          <View style={styles.profileSection}>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          
          </View>
        </View>

        {/* Bank Card: Mục tiêu năm + Số tiền */}
        <View style={styles.bankCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardBrandWrapper}>
              <PiggyBank color="#f59e0b" size={16} />
              <Text style={styles.cardBrandText}>HEO ĐẤT BÉO {currentYear}</Text>
            </View>
             
            <View style={styles.row}>
              <TouchableOpacity
                onPress={() => navigation.navigate("SavingHistory")}
                style={styles.historyBtn}
              >
                <HistoryIcon color="#ffffff" size={15} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate("GoldHistory")}
                style={styles.goldBtn}
              >
                <Bitcoin color="#fbbf24" size={15} />
              </TouchableOpacity>
              <View style={styles.cardChip} />
            </View>
          </View>

          {/* Mục tiêu năm ở đầu */}
          <Text style={styles.cardGoalLabel}>MỤC TIÊU NĂM {currentYear}</Text>
          <View style={styles.cardGoalRow}>
            {profile?.savingTarget ? (
              isEditingTarget ? (
                <View style={styles.inlineEditRow}>
                  <TextInput
                    style={styles.inlineInput}
                    keyboardType="numeric"
                    value={targetInput}
                    onChangeText={(text) => setTargetInput(formatMoneyInput(text))}
                    placeholder="Nhập số tiền..."
                    placeholderTextColor="rgba(255,255,255,0.5)"
                  />
                  <TouchableOpacity style={styles.inlineSaveBtn} onPress={handleSaveTarget}>
                    <Text style={styles.inlineSaveBtnText}>Lưu</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.inlineCancelBtn} onPress={() => setIsEditingTarget(false)}>
                    <X color="rgba(255,255,255,0.7)" size={18} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Text style={styles.cardGoalAmount}>
                    {showAmount ? `${formatCurrency(profile.savingTarget)} đ` : "•••••• đ"}
                  </Text>
                  <TouchableOpacity
                    style={[styles.goalEditBtn, !canEditTarget() && styles.goalEditBtnDisabled]}
                    onPress={() => {
                      if (canEditTarget()) {
                        setTargetInput(formatMoneyInput(profile.savingTarget!.toString()));
                        setIsEditingTarget(true);
                      } else {
                        Alert.alert("Thông báo", `Bạn chỉ có thể sửa mục tiêu sau ${getDaysUntilEdit()} ngày nữa.`);
                      }
                    }}
                  >
                    <Edit2 color={canEditTarget() ? "#fbbf24" : "rgba(255,255,255,0.3)"} size={16} />
                  </TouchableOpacity>
                </View>
              )
            ) : (
              <View style={styles.inlineEditRow}>
                <TextInput
                  style={styles.inlineInput}
                  keyboardType="numeric"
                  value={targetInput}
                  onChangeText={(text) => setTargetInput(formatMoneyInput(text))}
                  placeholder="Đặt mục tiêu năm..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                />
                <TouchableOpacity style={styles.inlineSaveBtn} onPress={handleSaveTarget}>
                  <Text style={styles.inlineSaveBtnText}>Đặt</Text>
                </TouchableOpacity>
              </View>
            )}
            {profile?.savingHistory && profile.savingHistory.length > 0 && !isEditingTarget && (
              <TouchableOpacity
                onPress={() => navigation.navigate("SavingHistory")}
                style={styles.viewHistoryBtn}
              >
                <Text style={styles.viewHistoryText}>Lịch sử</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tiến trình */}
          {profile?.savingTarget && !isEditingTarget && (
            <View style={{ marginTop: 8, marginBottom: 14 }}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, (savingBalance / profile.savingTarget) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressHint}>
                {formatPercent((savingBalance / profile.savingTarget) * 100)}% mục tiêu
              </Text>
            </View>
          )}

          {/* Số tiền đang có trong Heo ở dưới */}
          <View style={styles.cardStats}>
            <View style={styles.cardStat}>
              <Text style={styles.cardStatLabel}>ĐANG CÓ TRONG HEO</Text>
              <Text style={[styles.cardStatValue, { color: "#fcd34d" }]}>
                {showAmount ? `${formatCurrency(savingBalance)} đ` : "••••••"}
              </Text>
            </View>
             <TouchableOpacity
              onPress={() => setShowAmount(!showAmount)}
              style={styles.eyeBtn}
            >
              {showAmount ? (
                <Eye color="#ffffff" size={15} />
              ) : (
                <EyeOff color="#ffffff" size={15} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
      >

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, type === "deposit" && styles.tabActiveDeposit]}
            onPress={() => setType("deposit")}
          >
            <ArrowUpCircle
              color={type === "deposit" ? "#ffffff" : "#10b981"}
              size={20}
            />
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
            <ArrowDownCircle
              color={type === "withdraw" ? "#ffffff" : "#ef4444"}
              size={20}
            />
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
                  7 ngày được rút 1 lần, tối đa 500.000đ/lần.
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
                hideClearButton={true}
              />
            )}
            {profile?.inputMethod !== "manual" && (
              <View style={styles.actionButtonRow}>
                <TouchableOpacity
                  disabled={amount === 0}
                  style={[
                    styles.saveButton,
                    styles.actionNextBtn,
                    amount > 0
                      ? type === "deposit"
                        ? styles.saveDeposit
                        : styles.saveWithdraw
                      : styles.saveDisabled,
                  ]}
                  onPress={executeTransaction}
                  activeOpacity={amount > 0 ? 0.8 : 1}
                >
                  <Text style={styles.saveButtonText}>
                    {type === "deposit" ? "Xác Nhận Nạp" : "Xác Nhận Rút"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cancelButton, styles.actionCancelBtn]}
                  onPress={() => setAmount(0)}
                  activeOpacity={0.8}
                >
                  <RotateCcw color="#ef4444" size={22} />
                </TouchableOpacity>
              </View>
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

export default SavingScreen;
