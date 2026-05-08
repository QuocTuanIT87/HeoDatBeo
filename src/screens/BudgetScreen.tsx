import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  PlusCircle,
  Trash2,
  X,
  Wallet,
} from "lucide-react-native";
import { storage } from "../store/storage";
import { CategoryBudget, UserProfile } from "../types";
import { formatCurrency } from "../utils/format";
import Keypad from "../components/Keypad";
import { useIsFocused } from "@react-navigation/native";

// Màn hình BudgetScreen: Quản lý chia tiền vào các danh mục chi tiêu theo tháng
const BudgetScreen = () => {
  const isFocused = useIsFocused();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [unallocated, setUnallocated] = useState<number>(0); // Số dư chưa phân bổ

  const [allocModalVisible, setAllocModalVisible] = useState(false);
  const [selectedCat, setSelectedCat] = useState<CategoryBudget | null>(null);
  const [allocAmount, setAllocAmount] = useState<number>(0);
  const [allocType, setAllocType] = useState<"deposit" | "withdraw">("deposit");

  // Modal: Thêm danh mục mới
  const [addCatModalVisible, setAddCatModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  // Modal: Xác nhận xóa danh mục (Bảo mật cao)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [catToDelete, setCatToDelete] = useState<CategoryBudget | null>(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [hasTxToDelete, setHasTxToDelete] = useState(false);

  const now = new Date();
  const currentMonthStr = `tháng ${now.getMonth() + 1}`;

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    const p = await storage.getUserProfile();
    let cats = await storage.getCategoryBudgets();
    const txs = await storage.getTransactions();

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const spentMap: Record<string, number> = {};
    txs.forEach((tx) => {
      if (tx.type === "expense") {
        const d = new Date(tx.timestamp);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          const catName = tx.categorySnapshot || tx.category;
          spentMap[catName] = (spentMap[catName] || 0) + tx.amount;
        }
      }
    });

    cats = cats.map((c) => ({
      ...c,
      spent: spentMap[c.name] || 0,
    }));

    setProfile(p);
    setBudgets(cats);

    if (p) {
      const totalAllocated = cats.reduce((sum, c) => sum + c.budget, 0);
      setUnallocated(Math.max(0, p.initialBalance - totalAllocated));
    }
  };

  const openAllocModal = (cat: CategoryBudget) => {
    setSelectedCat(cat);
    setAllocAmount(0);
    setAllocType("deposit");
    setAllocModalVisible(true);
  };

  const handleAllocate = async () => {
    if (!selectedCat || allocAmount <= 0) {
      Alert.alert("Lỗi", "Vui lòng nhập số tiền hợp lệ.");
      return;
    }
    if (allocType === "deposit" && allocAmount > unallocated) {
      Alert.alert(
        "Không đủ tiền",
        `Số dư chưa phân bổ chỉ còn ${formatCurrency(unallocated)} đ.`,
      );
      return;
    }
    if (allocType === "withdraw" && allocAmount > selectedCat.budget) {
      Alert.alert(
        "Không đủ tiền",
        `Danh mục này chỉ còn ${formatCurrency(selectedCat.budget)} đ.`,
      );
      return;
    }

    const updated = budgets.map((b) =>
      b.name === selectedCat.name
        ? {
            ...b,
            budget:
              allocType === "deposit"
                ? b.budget + allocAmount
                : b.budget - allocAmount,
            spent: b.spent || 0,
          }
        : b,
    );
    const success = await storage.saveCategoryBudgets(updated);
    if (success) {
      setBudgets(updated);
      setUnallocated((prev) =>
        allocType === "deposit" ? prev - allocAmount : prev + allocAmount,
      );
      setAllocModalVisible(false);
      setAllocAmount(0);
      Alert.alert(
        "Thành công",
        `Đã ${allocType === "deposit" ? "nạp" : "rút"} ${formatCurrency(allocAmount)} đ ${allocType === "deposit" ? "vào" : "từ"} "${selectedCat.name}".`,
      );
    }
  };

  const handleAddCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;

    if (name === "Tiết kiệm" || name === "Rút tiết kiệm") {
      Alert.alert("Lỗi", "Tên danh mục này đã được sử dụng hệ thống.");
      return;
    }

    if (budgets.find((b) => b.name === name)) {
      Alert.alert("Lỗi", "Danh mục này đã tồn tại.");
      return;
    }
    const updated = [...budgets, { name, budget: 0, spent: 0 }];
    const success = await storage.saveCategoryBudgets(updated);
    if (success) {
      setBudgets(updated);
      setNewCatName("");
      setAddCatModalVisible(false);
    }
  };

  const handleOpenDeleteConfirm = async (cat: CategoryBudget) => {
    const txs = await storage.getTransactions();
    const hasTx = txs.some(
      (t) => (t.categorySnapshot || t.category) === cat.name,
    );
    setCatToDelete(cat);
    setHasTxToDelete(hasTx);
    setDeleteInput("");
    setDeleteConfirmModal(true);
  };

  const handleFinalDelete = async () => {
    if (!catToDelete) return;
    const requiredText = `DELETE ${catToDelete.name}`;
    if (deleteInput !== requiredText) {
      Alert.alert("Sai cú pháp", `Vui lòng nhập chính xác: ${requiredText}`);
      return;
    }

    const updated = budgets.filter((b) => b.name !== catToDelete.name);
    const success = await storage.saveCategoryBudgets(updated);
    if (success) {
      setBudgets(updated);
      setUnallocated((prev) => prev + catToDelete.budget);

      if (hasTxToDelete) {
        const txs = await storage.getTransactions();
        const updatedTxs = txs.map((t) => {
          if ((t.categorySnapshot || t.category) === catToDelete.name) {
            return {
              ...t,
              category: "Khác",
              categorySnapshot: catToDelete.name,
            };
          }
          return t;
        });
        await storage.updateTransactionsBulk(updatedTxs);
      }
      setDeleteConfirmModal(false);
      setCatToDelete(null);
      Alert.alert("Thành công", `Đã xóa danh mục "${catToDelete.name}".`);
    }
  };

  const totalBalance = budgets.reduce((sum, c) => sum + c.budget, 0) + unallocated;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Wallet color="#ffffff" size={26} />
          <Text style={styles.headerTitle}>Chia tiền chi tiêu {currentMonthStr}</Text>
        </View>

        <View style={styles.headerCards}>
          <View style={styles.headerCard}>
            <Text style={styles.headerCardLabel}>Số dư tổng</Text>
            <Text style={styles.headerCardValue}>{formatCurrency(totalBalance)} đ</Text>
          </View>
          <View style={styles.headerDivider} />
          <View style={styles.headerCard}>
            <Text style={styles.headerCardLabel}>Chưa phân bổ</Text>
            <Text style={[styles.headerCardValue, { color: unallocated <= 0 ? "#fca5a5" : "#fcd34d" }]}>
              {formatCurrency(unallocated)} đ
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ngân sách tháng này</Text>
          <TouchableOpacity style={styles.addCatBtn} onPress={() => setAddCatModalVisible(true)}>
            <PlusCircle color="#7c3aed" size={22} />
            <Text style={styles.addCatText}>Thêm túi</Text>
          </TouchableOpacity>
        </View>

        {budgets.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Chưa có "túi chi tiêu" nào. Nhấn "Thêm" để tạo và bắt đầu chia tiền.</Text>
          </View>
        ) : (
          budgets.map((cat) => {
            const spent = cat.spent || 0;
            const total = cat.budget + spent;
            const percentSpent = total > 0 ? (spent / total) * 100 : (spent > 0 ? 100 : 0);
            const percentRemaining = 100 - percentSpent;

            let progressColor = "#10b981"; 
            if (percentRemaining < 20) progressColor = "#ef4444"; 
            else if (percentRemaining < 50) progressColor = "#f59e0b";

            return (
              <TouchableOpacity key={cat.name} style={styles.catCard} onPress={() => openAllocModal(cat)}>
                <View style={styles.catInfo}>
                  <View style={styles.catNameRow}>
                    <Text style={styles.catName}>{cat.name}</Text>
                    <Text style={[styles.catBudget, { color: cat.budget <= 0 ? "#ef4444" : "#7c3aed" }]}>
                      {formatCurrency(cat.budget)} đ
                    </Text>
                  </View>

                  <View style={styles.progressContainer}>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${Math.min(100, percentSpent)}%`, backgroundColor: progressColor },
                        ]}
                      />
                    </View>
                    <View style={styles.progressLabelRow}>
                      <Text style={styles.progressText}>Đã dùng: {formatCurrency(spent)} đ</Text>
                      <Text style={styles.progressPercent}>{Math.round(percentSpent)}%</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleOpenDeleteConfirm(cat)}>
                  <Trash2 color="#cbd5e1" size={18} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal: Nạp/Rút tiền */}
      <Modal visible={allocModalVisible} transparent animationType="slide" onRequestClose={() => setAllocModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Phân bổ cho "{selectedCat?.name}"</Text>
              <TouchableOpacity onPress={() => setAllocModalVisible(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.allocTabs}>
              <TouchableOpacity style={[styles.allocTab, allocType === "deposit" && styles.allocTabActiveDeposit]} onPress={() => setAllocType("deposit")}>
                <Text style={[styles.allocTabText, allocType === "deposit" && styles.allocTabTextActive]}>Nạp thêm</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.allocTab, allocType === "withdraw" && styles.allocTabActiveWithdraw]} onPress={() => setAllocType("withdraw")}>
                <Text style={[styles.allocTabText, allocType === "withdraw" && styles.allocTabTextActive]}>Rút ra</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {allocType === "deposit" ? "Tiền chưa phân bổ: " : "Tiền trong túi: "}
              <Text style={styles.modalHighlight}>
                {formatCurrency(allocType === "deposit" ? unallocated : (selectedCat?.budget || 0))} đ
              </Text>
            </Text>

            <View style={styles.amountDisplayModal}>
              <Text style={styles.amountTextModal}>{formatCurrency(allocAmount)}</Text>
              <Text style={styles.currencyLabelModal}>VNĐ</Text>
            </View>

            <Keypad amount={allocAmount} onAddAmount={(val) => setAllocAmount((prev) => prev + val)} onClear={() => setAllocAmount(0)} />

            <TouchableOpacity style={[styles.confirmBtn, allocType === "withdraw" && styles.confirmBtnWithdraw]} onPress={handleAllocate}>
              <Text style={styles.confirmBtnText}>{allocType === "deposit" ? "Xác nhận nạp" : "Xác nhận rút"}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal: Xác nhận xóa (Bảo mật) */}
      <Modal visible={deleteConfirmModal} transparent animationType="fade" onRequestClose={() => setDeleteConfirmModal(false)}>
        <View style={styles.modalOverlayCenter}>
          <View style={styles.inputModalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: "#ef4444" }]}>Xác nhận xóa vĩnh viễn</Text>
              <TouchableOpacity onPress={() => setDeleteConfirmModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.deleteMsg}>
              Bạn đang xóa túi <Text style={{ fontWeight: "bold" }}>"{catToDelete?.name}"</Text>. 
              Hành động này sẽ hoàn trả <Text style={{ fontWeight: "bold", color: "#10b981" }}>{formatCurrency(catToDelete?.budget || 0)} đ</Text> vào số dư chưa phân bổ.
            </Text>

            {hasTxToDelete && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ Lưu ý: Các giao dịch cũ của túi này sẽ được chuyển sang danh mục "Khác" để giữ lại lịch sử thống kê.
                </Text>
              </View>
            )}

            <Text style={styles.deleteLabel}>Nhập chính xác dòng chữ sau để xóa:</Text>
            <Text style={styles.requiredText}>DELETE {catToDelete?.name}</Text>
            
            <TextInput
              style={[styles.textInput, { borderColor: deleteInput === `DELETE ${catToDelete?.name}` ? "#10b981" : "#ef4444" }]}
              placeholder="Nhập vào đây..."
              value={deleteInput}
              onChangeText={setDeleteInput}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: deleteInput === `DELETE ${catToDelete?.name}` ? "#ef4444" : "#cbd5e1" }]}
              onPress={handleFinalDelete}
              disabled={deleteInput !== `DELETE ${catToDelete?.name}`}
            >
              <Text style={styles.confirmBtnText}>Tôi chắc chắn muốn xóa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Thêm danh mục */}
      <Modal visible={addCatModalVisible} transparent animationType="fade" onRequestClose={() => setAddCatModalVisible(false)}>
        <View style={styles.modalOverlayCenter}>
          <View style={styles.inputModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm túi chi tiêu</Text>
              <TouchableOpacity onPress={() => setAddCatModalVisible(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.textInput} placeholder="Tên danh mục (vd: Ăn uống, Xăng xe...)" value={newCatName} onChangeText={setNewCatName} autoFocus onSubmitEditing={handleAddCategory} />
            <TouchableOpacity style={styles.confirmBtn} onPress={handleAddCategory}>
              <Text style={styles.confirmBtnText}>Tạo túi mới</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { backgroundColor: "#7c3aed", padding: 24, paddingTop: 60, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, elevation: 4 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  headerTitle: { color: "#ffffff", fontSize: 22, fontWeight: "bold" },
  headerCards: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, padding: 16, alignItems: "center" },
  headerCard: { flex: 1 },
  headerDivider: { width: 1, height: 35, backgroundColor: "rgba(255,255,255,0.3)", marginHorizontal: 12 },
  headerCardLabel: { color: "#ede9fe", fontSize: 13, marginBottom: 4 },
  headerCardValue: { color: "#ffffff", fontSize: 17, fontWeight: "bold" },
  body: { flex: 1 },
  bodyContent: { padding: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },
  addCatBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#ede9fe", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addCatText: { color: "#7c3aed", fontWeight: "600", fontSize: 14 },
  emptyBox: { backgroundColor: "#ffffff", borderRadius: 16, padding: 32, alignItems: "center", borderStyle: "dashed", borderWidth: 1, borderColor: "#cbd5e1" },
  emptyText: { color: "#94a3b8", fontSize: 15, textAlign: "center", lineHeight: 22 },
  catCard: { backgroundColor: "#ffffff", borderRadius: 20, padding: 18, marginBottom: 14, flexDirection: "row", alignItems: "center", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  catInfo: { flex: 1 },
  catNameRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  catName: { fontSize: 17, fontWeight: "bold", color: "#334155" },
  catBudget: { fontSize: 16, fontWeight: "bold" },
  progressContainer: { marginTop: 4 },
  progressTrack: { height: 8, backgroundColor: "#f1f5f9", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  progressLabelRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  progressText: { fontSize: 13, color: "#64748b" },
  progressPercent: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  deleteBtn: { padding: 10, marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.7)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#ffffff", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 19, fontWeight: "bold", color: "#0f172a" },
  allocTabs: { flexDirection: "row", backgroundColor: "#f1f5f9", borderRadius: 12, padding: 4, marginBottom: 20 },
  allocTab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  allocTabActiveDeposit: { backgroundColor: "#10b981" },
  allocTabActiveWithdraw: { backgroundColor: "#ef4444" },
  allocTabText: { fontWeight: "bold", color: "#64748b" },
  allocTabTextActive: { color: "#ffffff" },
  modalSubtitle: { fontSize: 15, color: "#64748b", marginBottom: 16 },
  modalHighlight: { color: "#0f172a", fontWeight: "bold" },
  amountDisplayModal: { backgroundColor: "#f8fafc", borderRadius: 16, padding: 20, alignItems: "center", flexDirection: "row", justifyContent: "center", marginBottom: 20, borderWidth: 1, borderColor: "#e2e8f0" },
  amountTextModal: { fontSize: 32, fontWeight: "bold", color: "#0f172a" },
  currencyLabelModal: { fontSize: 16, color: "#64748b", marginLeft: 8, marginTop: 8 },
  confirmBtn: { backgroundColor: "#7c3aed", paddingVertical: 16, borderRadius: 16, alignItems: "center", marginTop: 24 },
  confirmBtnWithdraw: { backgroundColor: "#ef4444" },
  confirmBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  modalOverlayCenter: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  inputModalContent: { backgroundColor: "#ffffff", borderRadius: 24, padding: 24, width: "100%", elevation: 20 },
  textInput: { borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 12, padding: 16, fontSize: 16, color: "#0f172a", marginBottom: 10, backgroundColor: "#f8fafc" },
  deleteMsg: { fontSize: 14, color: "#475569", lineHeight: 22, marginBottom: 12 },
  warningBox: { backgroundColor: "#fff7ed", padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: "#fed7aa" },
  warningText: { fontSize: 13, color: "#c2410c", lineHeight: 18 },
  deleteLabel: { fontSize: 14, fontWeight: "600", color: "#334155", marginTop: 10, marginBottom: 4 },
  requiredText: { fontSize: 16, fontWeight: "bold", color: "#ef4444", marginBottom: 12, backgroundColor: "#fef2f2", padding: 10, borderRadius: 8, textAlign: "center", borderStyle: "dashed", borderWidth: 1, borderColor: "#fca5a5" },
});

export default BudgetScreen;
