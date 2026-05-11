import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import {
  Wallet,
  PiggyBank,
  Layers,
  PlusCircle,
  X,
  ArrowDownCircle,
  ArrowUpCircle,
  Trash2,
  Eye,
  EyeOff,
  History,
} from "lucide-react-native";
import { storage } from "../store/storage";
import { UserProfile, Transaction, CategoryBudget, CustomFund } from "../types";
import { BottomTabParamList } from "../navigation/types";
import Keypad from "../components/Keypad";

type FundScreenNavigationProp = BottomTabNavigationProp<
  BottomTabParamList,
  "Funds"
>;

const FundScreen = () => {
  const navigation = useNavigation<FundScreenNavigationProp>();
  const isFocused = useIsFocused();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [totalAllocated, setTotalAllocated] = useState<number>(0);
  const [savingBalance, setSavingBalance] = useState<number>(0);
  const [unallocated, setUnallocated] = useState<number>(0);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAmount, setShowAmount] = useState(true);

  // Thêm Quỹ mới
  const [addFundModalVisible, setAddFundModalVisible] = useState(false);
  const [newFundName, setNewFundName] = useState("Quỹ ");

  // Nạp/Rút
  const [allocModalVisible, setAllocModalVisible] = useState(false);
  const [selectedFund, setSelectedFund] = useState<CustomFund | null>(null);
  const [amount, setAmount] = useState(0);
  const [txType, setTxType] = useState<"deposit" | "withdraw">("deposit");
  const manualInputRef = useRef<TextInput>(null);

  // Xóa quỹ
  const [deleteFundModalVisible, setDeleteFundModalVisible] = useState(false);
  const [fundToDelete, setFundToDelete] = useState<CustomFund | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    const p = await storage.getUserProfile();
    const budgets = await storage.getCategoryBudgets();
    const transactions = await storage.getTransactions();

    if (p) {
      setProfile(p);

      // Calculate total allocated (Quỹ Tiêu Sài)
      const allocated = budgets.reduce((sum, b) => sum + b.budget, 0);
      setTotalAllocated(allocated);

      // Calculate savings balance (Quỹ Tiết Kiệm)
      let calcSaving = 0;
      transactions.forEach((t) => {
        if (t.category === "Tiết kiệm" || t.category === "Rút tiết kiệm") {
          if (t.type === "expense" && t.category === "Tiết kiệm") {
            calcSaving += t.amount;
          } else if (t.type === "income" && t.category === "Rút tiết kiệm") {
            calcSaving -= t.amount;
          }
        }
      });
      setSavingBalance(calcSaving);

      // Calculate unallocated
      const unalloc = Math.max(0, p.initialBalance - allocated);
      setUnallocated(unalloc);

      // Calculate total balance
      let customFundsTotal = 0;
      if (p.customFunds) {
        customFundsTotal = p.customFunds.reduce((sum, f) => sum + f.balance, 0);
      }
      setTotalBalance(allocated + unalloc + calcSaving + customFundsTotal);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("vi-VN");
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

  const handleFundNameChange = (text: string) => {
    if (!text.startsWith("Quỹ ")) {
      setNewFundName("Quỹ ");
      return;
    }

    const words = text.split(" ");
    const capitalized = words.map((word) => {
      if (word.length > 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    });

    setNewFundName(capitalized.join(" "));
  };

  const handleAddFund = async () => {
    if (newFundName.trim() === "Quỹ" || newFundName.trim() === "Quỹ") {
      Alert.alert("Lỗi", "Vui lòng nhập tên quỹ hợp lệ.");
      return;
    }

    if (!profile) return;

    const newFund: CustomFund = {
      id: Date.now().toString(),
      name: newFundName.trim(),
      balance: 0,
    };

    const updatedProfile = {
      ...profile,
      customFunds: [...(profile.customFunds || []), newFund],
    };

    const success = await storage.saveUserProfile(updatedProfile);
    if (success) {
      setProfile(updatedProfile);
      setAddFundModalVisible(false);
      setNewFundName("Quỹ ");
    }
  };

  const openDeleteFundModal = (fund: CustomFund) => {
    setFundToDelete(fund);
    setDeleteConfirmText("");
    setDeleteFundModalVisible(true);
  };

  const handleConfirmDeleteFund = async () => {
    if (!fundToDelete || !profile) return;
    const expected = `DELETE ${fundToDelete.name}`;
    if (deleteConfirmText.trim() !== expected) {
      Alert.alert("Xác nhận không đúng", `Vui lòng nhập đúng: ${expected}`);
      return;
    }

    const fundBalance = fundToDelete.balance;
    const updatedFunds = (profile.customFunds || []).filter(
      (f) => f.id !== fundToDelete.id,
    );
    const updatedProfile = {
      ...profile,
      customFunds: updatedFunds,
      initialBalance: profile.initialBalance + fundBalance,
    };

    if (fundBalance > 0) {
      const tx: Transaction = {
        id: Date.now().toString(),
        type: "income",
        amount: fundBalance,
        category: "Xóa Quỹ",
        note: `Thu hồi từ ${fundToDelete.name}`,
        timestamp: Date.now(),
      };
      await storage.saveTransaction(tx);
    }

    await storage.saveUserProfile(updatedProfile);
    setDeleteFundModalVisible(false);
    setFundToDelete(null);
    loadData();
  };

  const openAllocModal = (fund: CustomFund) => {
    setSelectedFund(fund);
    setAmount(0);
    setTxType("deposit");
    setAllocModalVisible(true);
  };

  const executeTransaction = async () => {
    if (!selectedFund || !profile) return;
    if (amount <= 0) {
      Alert.alert("Chưa nhập số tiền", "Vui lòng nhập số tiền lớn hơn 0.");
      return;
    }

    if (txType === "deposit" && amount > unallocated) {
      Alert.alert(
        "Không đủ tiền",
        `Số dư chưa phân bổ (${formatCurrency(unallocated)} đ) không đủ để nạp.`,
      );
      return;
    }

    if (txType === "withdraw" && amount > selectedFund.balance) {
      Alert.alert(
        "Không đủ tiền",
        `Quỹ này chỉ còn ${formatCurrency(selectedFund.balance)} đ.`,
      );
      return;
    }

    // Update fund balance
    const updatedFunds = (profile.customFunds || []).map((f) => {
      if (f.id === selectedFund.id) {
        return {
          ...f,
          balance:
            txType === "deposit" ? f.balance + amount : f.balance - amount,
        };
      }
      return f;
    });

    // Update profile
    const updatedProfile = {
      ...profile,
      customFunds: updatedFunds,
      initialBalance:
        txType === "deposit"
          ? profile.initialBalance - amount
          : profile.initialBalance + amount,
    };

    // Create transaction
    const newTx: Transaction = {
      id: Date.now().toString(),
      type: txType === "deposit" ? "expense" : "income",
      amount: amount,
      category: selectedFund.name,
      name:
        txType === "deposit"
          ? `Nạp vào ${selectedFund.name}`
          : `Rút từ ${selectedFund.name}`,
      timestamp: Date.now(),
    };

    await storage.saveTransaction(newTx);
    await storage.saveUserProfile(updatedProfile);

    setAllocModalVisible(false);
    loadData();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Quản lý Quỹ</Text>
          <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => setShowAmount(!showAmount)}
              style={styles.eyeBtn}
            >
              {showAmount ? (
                <Eye color="#ffffff" size={20} />
              ) : (
                <EyeOff color="#ffffff" size={20} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("FundHistory" as any)}
              style={styles.eyeBtn}
            >
              <History color="#ffffff" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Tổng tài sản</Text>
          <Text style={styles.balanceAmount}>
            {showAmount ? `${formatCurrency(totalBalance)} đ` : "******"}
          </Text>
        </View>

        <View style={styles.unallocContainer}>
          <Text style={styles.unallocLabel}>Số dư chưa phân bổ</Text>
          <Text style={styles.unallocAmount}>
            {showAmount ? `${formatCurrency(unallocated)} đ` : "******"}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quỹ mặc định</Text>
        </View>

        {/* Quỹ Tiêu Sài */}
        <TouchableOpacity
          style={styles.fundCard}
          onPress={() => navigation.navigate("Budget")}
        >
          <View style={[styles.fundIcon, { backgroundColor: "#f3e8ff" }]}>
            <Layers color="#a855f7" size={24} />
          </View>
          <View style={styles.fundInfo}>
            <Text style={styles.fundName}>Quỹ Tiêu Sài</Text>
            <Text style={styles.fundDesc}>Quản lý chi tiêu hằng ngày</Text>
          </View>
          <View style={styles.fundBalanceContainer}>
            <Text style={styles.fundBalance}>
              {showAmount ? formatCurrency(totalAllocated) : "***"}
            </Text>
            <Text style={styles.currencyLabel}>đ</Text>
          </View>
        </TouchableOpacity>

        {/* Quỹ Tiết Kiệm */}
        <TouchableOpacity
          style={styles.fundCard}
          onPress={() => navigation.navigate("Savings")}
        >
          <View style={[styles.fundIcon, { backgroundColor: "#fef3c7" }]}>
            <PiggyBank color="#f59e0b" size={24} />
          </View>
          <View style={styles.fundInfo}>
            <Text style={styles.fundName}>Quỹ Tiết Kiệm</Text>
            <Text style={styles.fundDesc}>Tích lũy tương lai</Text>
          </View>
          <View style={styles.fundBalanceContainer}>
            <Text style={styles.fundBalance}>
              {showAmount ? formatCurrency(savingBalance) : "***"}
            </Text>
            <Text style={styles.currencyLabel}>đ</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quỹ tùy chỉnh</Text>
          <TouchableOpacity
            style={styles.addFundBtn}
            onPress={() => {
              setNewFundName("Quỹ ");
              setAddFundModalVisible(true);
            }}
          >
            <PlusCircle color="#3b82f6" size={20} />
            <Text style={styles.addFundText}>Thêm mới</Text>
          </TouchableOpacity>
        </View>

        {profile?.customFunds?.map((fund) => (
          <TouchableOpacity
            key={fund.id}
            style={styles.fundCard}
            onPress={() => openAllocModal(fund)}
          >
            <View style={[styles.fundIcon, { backgroundColor: "#e0f2fe" }]}>
              <Wallet color="#0ea5e9" size={24} />
            </View>
            <View style={styles.fundInfo}>
              <Text style={styles.fundName}>{fund.name}</Text>
              <Text style={styles.fundDesc}>Nhấn để nạp/rút</Text>
            </View>
            <View style={styles.fundBalanceContainer}>
              <Text style={styles.fundBalance}>
                {showAmount ? formatCurrency(fund.balance) : "***"}
              </Text>
              <Text style={styles.currencyLabel}>đ</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteFundBtn}
              onPress={() => openDeleteFundModal(fund)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 color="#ef4444" size={18} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {(!profile?.customFunds || profile.customFunds.length === 0) && (
          <View style={styles.emptyState}>
            <Wallet color="#cbd5e1" size={48} />
            <Text style={styles.emptyStateText}>
              Chưa có quỹ tùy chỉnh nào.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Thêm Quỹ */}
      <Modal
        visible={addFundModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddFundModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Tạo Quỹ Mới</Text>
              <TouchableOpacity onPress={() => setAddFundModalVisible(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Tên quỹ (vd: Quỹ Đầu Tư...)"
              placeholderTextColor="#94a3b8"
              value={newFundName}
              onChangeText={handleFundNameChange}
              autoCapitalize="words"
              autoFocus
              onSubmitEditing={handleAddFund}
            />
            <TouchableOpacity style={styles.confirmBtn} onPress={handleAddFund}>
              <Text style={styles.confirmBtnText}>Tạo Quỹ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Nạp Rút Quỹ Tùy Chỉnh */}
      <Modal
        visible={allocModalVisible}
        transparent
        animationType="slide"
        onShow={() => {
          setTimeout(() => {
            manualInputRef.current?.focus();
          }, 300);
        }}
        onRequestClose={() => setAllocModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.allocModalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{selectedFund?.name}</Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
              >
                {/* <TouchableOpacity onPress={toggleInputMethod}>
                  {profile?.inputMethod === "manual" ? (
                    <LayoutGrid color="#64748b" size={24} />
                  ) : (
                    <Keyboard color="#64748b" size={24} />
                  )}
                </TouchableOpacity> */}
                <TouchableOpacity onPress={() => setAllocModalVisible(false)}>
                  <X color="#64748b" size={24} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.modalSubtitle}>
              Số dư hiện tại:{" "}
              <Text style={styles.modalHighlight}>
                {selectedFund ? formatCurrency(selectedFund.balance) : 0} đ
              </Text>
            </Text>

            <View style={styles.tabs}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  txType === "deposit" && styles.tabActiveDeposit,
                ]}
                onPress={() => setTxType("deposit")}
              >
                <ArrowDownCircle
                  color={txType === "deposit" ? "#ffffff" : "#10b981"}
                  size={20}
                />
                <Text
                  style={[
                    styles.tabText,
                    txType === "deposit" && styles.tabTextActive,
                  ]}
                >
                  Nạp tiền
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  txType === "withdraw" && styles.tabActiveWithdraw,
                ]}
                onPress={() => setTxType("withdraw")}
              >
                <ArrowUpCircle
                  color={txType === "withdraw" ? "#ffffff" : "#ef4444"}
                  size={20}
                />
                <Text
                  style={[
                    styles.tabText,
                    txType === "withdraw" && styles.tabTextActive,
                  ]}
                >
                  Rút tiền
                </Text>
              </TouchableOpacity>
            </View>

            {profile?.inputMethod === "manual" ? (
              <TextInput
                ref={manualInputRef}
                style={styles.amountInputModal}
                keyboardType="numeric"
                placeholder="0 đ"
                placeholderTextColor="#94a3b8"
                value={amount === 0 ? "" : amount.toLocaleString("vi-VN")}
                onChangeText={(text) => {
                  const numericValue = text.replace(/[^0-9]/g, "");
                  setAmount(numericValue ? parseInt(numericValue, 10) : 0);
                }}
              />
            ) : (
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.amountInputModal}>
                  {amount > 0 ? formatCurrency(amount) + " đ" : "0 đ"}
                </Text>
                <Keypad
                  amount={amount}
                  onAddAmount={(val) => setAmount(amount + val)}
                  onClear={() => setAmount(0)}
                />
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.confirmAllocBtn,
                txType === "deposit" ? styles.bgDeposit : styles.bgWithdraw,
                amount <= 0 && styles.bgDisabled,
              ]}
              onPress={executeTransaction}
              disabled={amount <= 0}
            >
              <Text style={styles.confirmAllocBtnText}>Xác Nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Xóa Quỹ */}
      <Modal
        visible={deleteFundModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteFundModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: "#ef4444" }]}>🗑 Xóa Quỹ</Text>
              <TouchableOpacity onPress={() => setDeleteFundModalVisible(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.deleteWarningBox}>
              <Text style={styles.deleteWarningText}>
                ⚠️ Quỹ <Text style={{ fontWeight: "bold" }}>{fundToDelete?.name}</Text> sẽ bị xóa vĩnh viễn.
              </Text>
              {(fundToDelete?.balance ?? 0) > 0 && (
                <Text style={styles.deleteRefundText}>
                  💰 Số dư <Text style={{ fontWeight: "bold" }}>{formatCurrency(fundToDelete?.balance ?? 0)} đ</Text> sẽ được hoàn về tiền chưa phân bổ.
                </Text>
              )}
            </View>

            <Text style={styles.deleteHintText}>
              Nhập <Text style={styles.deleteHintCode}>DELETE {fundToDelete?.name}</Text> để xác nhận:
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={`DELETE ${fundToDelete?.name}`}
              placeholderTextColor="#94a3b8"
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              autoCapitalize="none"
            />

            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={styles.deleteCancelBtn}
                onPress={() => setDeleteFundModalVisible(false)}
              >
                <Text style={styles.deleteCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deleteConfirmBtn,
                  deleteConfirmText.trim() !== `DELETE ${fundToDelete?.name}` && styles.bgDisabled,
                ]}
                onPress={handleConfirmDeleteFund}
              >
                <Text style={styles.deleteConfirmText}>Xóa Quỹ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    backgroundColor: "#2563eb",
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#ffffff" },
  eyeBtn: { padding: 4 },
  balanceContainer: { marginBottom: 16 },
  balanceLabel: { fontSize: 14, color: "#bfdbfe", marginBottom: 4 },
  balanceAmount: { fontSize: 32, fontWeight: "bold", color: "#ffffff" },
  unallocContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  unallocLabel: { fontSize: 14, color: "#bfdbfe" },
  unallocAmount: { fontSize: 16, fontWeight: "bold", color: "#ffffff" },

  body: { flex: 1, padding: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#64748b" },
  addFundBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  addFundText: { fontSize: 14, color: "#3b82f6", fontWeight: "600" },

  fundCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  fundIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  fundInfo: { flex: 1 },
  fundName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  fundDesc: { fontSize: 13, color: "#64748b" },
  fundBalanceContainer: { alignItems: "flex-end", flexDirection: "row" },
  fundBalance: { fontSize: 16, fontWeight: "bold", color: "#0f172a" },
  currencyLabel: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 4,
    marginBottom: 2,
  },

  emptyState: { alignItems: "center", padding: 40, opacity: 0.5 },
  emptyStateText: { marginTop: 12, fontSize: 14, color: "#64748b" },

  deleteFundBtn: {
    padding: 8,
    marginLeft: 8,
  },
  deleteWarningBox: {
    backgroundColor: "#fff1f2",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fecdd3",
    gap: 8,
  },
  deleteWarningText: { fontSize: 14, color: "#be123c", lineHeight: 20 },
  deleteRefundText: { fontSize: 14, color: "#0f172a", lineHeight: 20 },
  deleteHintText: { fontSize: 14, color: "#475569", marginBottom: 8 },
  deleteHintCode: {
    fontFamily: "monospace",
    backgroundColor: "#f1f5f9",
    color: "#ef4444",
    fontWeight: "bold",
  },
  deleteActions: { flexDirection: "row", gap: 12 },
  deleteCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#f1f5f9",
  },
  deleteCancelText: { color: "#64748b", fontWeight: "600", fontSize: 15 },
  deleteConfirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#ef4444",
  },
  deleteConfirmText: { color: "#ffffff", fontWeight: "bold", fontSize: 15 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
  },
  allocModalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    marginTop: 100,
    marginBottom: "auto",
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#0f172a" },
  modalSubtitle: { fontSize: 15, color: "#64748b", marginBottom: 20 },
  modalHighlight: { fontWeight: "bold", color: "#0f172a" },

  textInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#0f172a",
    marginBottom: 24,
  },
  amountInputModal: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "center",
    marginVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 8,
  },

  confirmBtn: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },

  confirmAllocBtn: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  confirmAllocBtnText: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  bgDeposit: { backgroundColor: "#10b981" },
  bgWithdraw: { backgroundColor: "#ef4444" },
  bgDisabled: { backgroundColor: "#cbd5e1" },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  tabActiveDeposit: { backgroundColor: "#10b981", elevation: 2 },
  tabActiveWithdraw: { backgroundColor: "#ef4444", elevation: 2 },
  tabText: { fontSize: 15, fontWeight: "600", color: "#64748b" },
  tabTextActive: { color: "#ffffff" },
});

export default FundScreen;
