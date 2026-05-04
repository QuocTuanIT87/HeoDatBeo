import React, { useEffect, useRef, useState } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MinusCircle, PlusCircle, Eye, EyeOff } from "lucide-react-native";
import { storage } from "../store/storage";
import { Transaction, UserProfile, CategoryBudget } from "../types";
import { formatCurrency } from "../utils/format";
import Keypad from "../components/Keypad";
import { useIsFocused, useNavigation } from "@react-navigation/native";

const HIDE_BALANCE_KEY = "@hideBalance";

const DEFAULT_INCOME_CATEGORIES = ["Lương", "Thưởng", "Bán hàng"];

const HomeScreen = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [showBudgets, setShowBudgets] = useState(false);

  // Ghi nhớ trạng thái ẩn/hiện (YC 5)
  const toggleShowBudgets = async () => {
    const next = !showBudgets;
    setShowBudgets(next);
    try {
      await AsyncStorage.setItem(HIDE_BALANCE_KEY, JSON.stringify(!next)); // lưu trạng thái "ẩn"
    } catch (_) {}
  };
  const [totalBalance, setTotalBalance] = useState<number>(0);

  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<string>("");

  // Modal nhập danh mục tùy chỉnh khi chưa chọn danh mục
  const [customCatModalVisible, setCustomCatModalVisible] = useState(false);
  const [customCatInput, setCustomCatInput] = useState("");
  // Giữ pending amount để lưu sau khi nhập danh mục
  const pendingAmountRef = useRef<number>(0);

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    const p = await storage.getUserProfile();
    const cats = await storage.getCategoryBudgets();
    setProfile(p);
    setBudgets(cats);

    // Tổng số dư = tổng budget các danh mục + chưa phân bổ
    if (p) {
      const totalAllocated = cats.reduce((sum, c) => sum + c.budget, 0);
      const unallocated = Math.max(0, p.initialBalance - totalAllocated);
      setTotalBalance(totalAllocated + unallocated);
    }

    // Khôi phục trạng thái ẩn/hiện số tiền (YC 5)
    try {
      const hidden = await AsyncStorage.getItem(HIDE_BALANCE_KEY);
      if (hidden !== null) {
        setShowBudgets(!JSON.parse(hidden));
      }
    } catch (_) {}

    if (p && p.hasSeenGuide === false) {
      setShowWelcomeModal(true);
    }
  };

  const closeWelcomeModal = async (viewGuide: boolean) => {
    setShowWelcomeModal(false);
    if (profile) {
      const updatedProfile = { ...profile, hasSeenGuide: true };
      await storage.saveUserProfile(updatedProfile);
      setProfile(updatedProfile);
    }
    if (viewGuide) {
      (navigation as any).navigate('Guide');
    }
  };

  // Lưu giao dịch với danh mục cụ thể (có thể là danh mục tùy chỉnh)
  // customLabel: tên người dùng nhập tay — nếu có, category lưu là "Khác", categorySnapshot lưu tên gốc
  const saveTransaction = async (chosenCategory: string, customLabel?: string) => {
    if (type === "expense") {
      const catBudget = budgets.find((b) => b.name === chosenCategory);

      if (catBudget) {
        // === Danh mục có trong tab Chia Tiền → trừ từ budget danh mục ===
        if (amount > catBudget.budget) {
          Alert.alert(
            "Ngân sách không đủ",
            `Danh mục "${chosenCategory}" chỉ còn ${formatCurrency(catBudget.budget)} đ.`
          );
          return;
        }
        const updatedBudgets = budgets.map((b) =>
          b.name === chosenCategory ? { ...b, budget: b.budget - amount, spent: (b.spent || 0) + amount } : b
        );
        const budgetSaved = await storage.saveCategoryBudgets(updatedBudgets);
        if (!budgetSaved) {
          Alert.alert("Lỗi", "Không thể cập nhật ngân sách.");
          return;
        }
        if (profile) {
          await storage.saveUserProfile({
            ...profile,
            initialBalance: profile.initialBalance - amount,
          });
        }
      } else {
        // === Danh mục tùy chỉnh → lấy từ tiền chưa phân bổ ===
        if (!profile) return;
        const totalAllocated = budgets.reduce((sum, b) => sum + b.budget, 0);
        const unallocated = Math.max(0, profile.initialBalance - totalAllocated);
        if (amount > unallocated) {
          Alert.alert(
            "Tiền chưa phân bổ không đủ",
            `Bạn chỉ còn ${formatCurrency(unallocated)} đ chưa phân bổ. Vui lòng nhập số tiền nhỏ hơn hoặc bằng số đó.`
          );
          return;
        }
        // Chỉ trừ initialBalance (unallocated giảm), không đụng budget danh mục nào
        await storage.saveUserProfile({
          ...profile,
          initialBalance: profile.initialBalance - amount,
        });
      }

      // Lưu transaction
      // Nếu là danh mục nhập tay → gom vào "Khác", snapshot lưu tên gốc để truy vết
      const newTx: Transaction = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        type: "expense",
        amount,
        category: customLabel ? "Khác" : chosenCategory,
        categorySnapshot: customLabel ?? chosenCategory,
        timestamp: Date.now(),
      };
      const txSaved = await storage.saveTransaction(newTx);
      if (txSaved) {
        Alert.alert("Thành công", "Đã lưu khoản chi.");
        setAmount(0);
        setCategory("");
        loadData();
      } else {
        Alert.alert("Lỗi", "Không thể lưu giao dịch.");
      }
    } else {
      // Thu tiền: cộng vào initialBalance
      if (!profile) return;
      const updatedProfile = {
        ...profile,
        initialBalance: profile.initialBalance + amount,
      };
      const profileSaved = await storage.saveUserProfile(updatedProfile);

      const newTx: Transaction = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        type: "income",
        amount,
        category: customLabel ? "Khác" : chosenCategory,
        categorySnapshot: customLabel ?? chosenCategory,
        timestamp: Date.now(),
      };
      const txSaved = await storage.saveTransaction(newTx);
      if (profileSaved && txSaved) {
        Alert.alert(
          "Thành công",
          'Đã lưu khoản thu. Vào tab "Chia Tiền" để phân bổ.'
        );
        setAmount(0);
        setCategory("");
        loadData();
      } else {
        Alert.alert("Lỗi", "Không thể lưu giao dịch.");
      }
    }
  };

  const handleSave = async () => {
    if (amount <= 0) {
      Alert.alert("Chưa nhập số tiền", "Vui lòng nhập số tiền hợp lệ.");
      return;
    }

    if (!category) {
      // Hiện modal nhập danh mục tùy chỉnh
      pendingAmountRef.current = amount;
      setCustomCatInput("");
      setCustomCatModalVisible(true);
      return;
    }

    // Đã chọn danh mục → lưu bình thường
    await saveTransaction(category);
  };

  // Xác nhận lưu từ modal nhập danh mục tùy chỉnh
  // → Lưu category="Khác", categorySnapshot=tên người dùng nhập
  const handleConfirmCustomCategory = async () => {
    const trimmed = customCatInput.trim();
    if (!trimmed) {
      Alert.alert("Thiếu tên danh mục", "Vui lòng nhập tên danh mục.");
      return;
    }
    setCustomCatModalVisible(false);
    // Truyền trimmed làm customLabel → category DB = "Khác", snapshot = tên gốc
    await saveTransaction("Khác", trimmed);
  };

  // Hủy modal và xóa danh mục đang chọn
  const handleCancelCustomCat = () => {
    setCustomCatModalVisible(false);
    setCategory(""); // Xóa danh mục đã chọn để người dùng có thể tự nhập
  };

  const incomeCategories =
    profile?.incomeCategories || DEFAULT_INCOME_CATEGORIES;
  const expenseCategories = budgets.map((b) => b.name);
  const categories = type === "expense" ? expenseCategories : incomeCategories;

  // Budget của danh mục đang chọn (khi chi tiền)
  const selectedBudget =
    type === "expense"
      ? (budgets.find((b) => b.name === category)?.budget ?? null)
      : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Xin chào, {profile?.name} 👋</Text>
        <View style={styles.headerRow}>
          <Text style={styles.balanceLabel}>Số dư tổng</Text>
          <TouchableOpacity onPress={toggleShowBudgets} style={styles.eyeBtn}>
            {showBudgets ? (
              <Eye color="#ffffff" size={20} />
            ) : (
              <EyeOff color="#ffffff" size={20} />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.totalAmount}>
          {showBudgets ? `${formatCurrency(totalBalance)} đ` : "****** đ"}
        </Text>

        {/* Danh sách ngân sách các danh mục */}
        {showBudgets && budgets.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.budgetChips}
          >
            {budgets.map((b) => (
              <View key={b.name} style={styles.budgetChip}>
                <Text style={styles.chipName}>{b.name}</Text>
                <Text
                  style={[
                    styles.chipAmount,
                    { color: b.budget <= 0 ? "#fca5a5" : "#ffffff" },
                  ]}
                >
                  {formatCurrency(b.budget)} đ
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
      >
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, type === "expense" && styles.tabActiveExpense]}
            onPress={() => {
              setType("expense");
              setCategory("");
            }}
          >
            <MinusCircle
              color={type === "expense" ? "#ffffff" : "#ef4444"}
              size={20}
            />
            <Text
              style={[
                styles.tabText,
                type === "expense" && styles.tabTextActive,
              ]}
            >
              Chi Tiền
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, type === "income" && styles.tabActiveIncome]}
            onPress={() => {
              setType("income");
              setCategory("");
            }}
          >
            <PlusCircle
              color={type === "income" ? "#ffffff" : "#10b981"}
              size={20}
            />
            <Text
              style={[
                styles.tabText,
                type === "income" && styles.tabTextActive,
              ]}
            >
              Thu Tiền
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount display */}
        <View style={styles.amountDisplay}>
          <Text
            style={[
              styles.amountText,
              type === "expense" ? styles.expenseText : styles.incomeText,
            ]}
          >
            {formatCurrency(amount)}
          </Text>
          <Text style={styles.currencyLabel}>VNĐ</Text>
        </View>

        {/* Ngân sách còn lại của danh mục đang chọn */}
        {type === "expense" && category && selectedBudget !== null && (
          <View
            style={[
              styles.budgetHint,
              { backgroundColor: selectedBudget <= 0 ? "#fef2f2" : "#f0fdf4" },
            ]}
          >
            <Text
              style={[
                styles.budgetHintText,
                { color: selectedBudget <= 0 ? "#ef4444" : "#16a34a" },
              ]}
            >
              "{category}" còn: {formatCurrency(selectedBudget)} đ
            </Text>
          </View>
        )}

        {/* Categories */}
        <Text style={styles.sectionTitle}>
          {type === "expense" ? "Chọn danh mục chi" : "Nguồn thu"}
        </Text>

        {type === "expense" && budgets.length === 0 ? (
          <View style={styles.noBudgetBox}>
            <Text style={styles.noBudgetText}>
              Chưa có danh mục chi. Vào tab "Chia Tiền" để tạo và phân bổ tiền.
            </Text>
          </View>
        ) : (
          <View style={styles.categoryContainer}>
            {categories.map((cat) => {
              const catBudget =
                type === "expense" ? budgets.find((b) => b.name === cat) : null;
              const isSelected = category === cat;
              const isEmpty = catBudget != null && catBudget.budget <= 0;

              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryBadge,
                    isSelected && styles.categoryBadgeActive,
                    isEmpty && styles.categoryBadgeEmpty,
                  ]}
                  onPress={() => setCategory(isSelected ? "" : cat)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      isSelected && styles.categoryTextActive,
                      isEmpty && !isSelected && styles.categoryTextEmpty,
                    ]}
                  >
                    {cat}
                  </Text>
                  {catBudget != null && (
                    <Text
                      style={[
                        styles.categorySubAmount,
                        isSelected && { color: "#d1fae5" },
                        isEmpty && !isSelected && { color: "#fca5a5" },
                      ]}
                    >
                      {formatCurrency(catBudget.budget)} đ
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Keypad */}
        <Text style={styles.sectionTitle}>Chọn mệnh giá</Text>
        <Keypad
          amount={amount}
          onAddAmount={(val) => setAmount((prev) => prev + val)}
          onClear={() => setAmount(0)}
        />

        {/* Save button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            type === "expense" ? styles.saveExpense : styles.saveIncome,
          ]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Lưu Giao Dịch</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal nhập danh mục tùy chỉnh */}
      <Modal
        visible={customCatModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelCustomCat}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.customCatModal}>
            <Text style={styles.customCatTitle}>
              {type === "expense" ? "💸 Danh mục chi" : "💰 Danh mục thu"}
            </Text>
            <Text style={styles.customCatSubtitle}>
              Bạn chưa chọn danh mục. Nhập tên danh mục muốn lưu giao dịch này:
            </Text>
            <TextInput
              style={styles.customCatInput}
              placeholder="Nhập tên danh mục..."
              placeholderTextColor="#94a3b8"
              value={customCatInput}
              onChangeText={setCustomCatInput}
              autoFocus
              onSubmitEditing={handleConfirmCustomCategory}
              returnKeyType="done"
            />
            <View style={styles.customCatActions}>
              <TouchableOpacity
                style={styles.customCatCancelBtn}
                onPress={handleCancelCustomCat}
              >
                <Text style={styles.customCatCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.customCatConfirmBtn,
                  type === "expense" ? styles.customCatConfirmExpense : styles.customCatConfirmIncome,
                ]}
                onPress={handleConfirmCustomCategory}
              >
                <Text style={styles.customCatConfirmText}>Lưu giao dịch</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Chào mừng người mới */}
      <Modal
        visible={showWelcomeModal}
        transparent
        animationType="slide"
      >
        <View style={styles.welcomeModalOverlay}>
          <View style={styles.welcomeModalContent}>
            <Text style={styles.welcomeTitle}>Chào người mới! 👋</Text>
            <Text style={styles.welcomeText}>
              Heo Đất Béo là một ứng dụng quản lý tài chính theo phương pháp "Phân bổ phong bì".
              Để sử dụng hiệu quả, bạn nên xem qua hướng dẫn hoạt động của dòng tiền nhé.
            </Text>
            <View style={styles.welcomeActions}>
              <TouchableOpacity
                style={styles.welcomeSkipBtn}
                onPress={() => closeWelcomeModal(false)}
              >
                <Text style={styles.welcomeSkipText}>Bỏ qua</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.welcomeViewBtn}
                onPress={() => closeWelcomeModal(true)}
              >
                <Text style={styles.welcomeViewText}>Xem hướng dẫn</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: "#d946ef",
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    color: "#fdf4ff",
    fontSize: 15,
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceLabel: {
    color: "#fdf4ff",
    fontSize: 13,
    opacity: 0.9,
  },
  eyeBtn: {
    padding: 4,
  },
  totalAmount: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 2,
    marginBottom: 16,
  },
  budgetChips: {
    gap: 10,
    paddingBottom: 4,
  },
  budgetChip: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 110,
  },
  chipName: {
    color: "#fdf4ff",
    fontSize: 12,
    marginBottom: 2,
  },
  chipAmount: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  tabActiveExpense: { backgroundColor: "#ef4444" },
  tabActiveIncome: { backgroundColor: "#10b981" },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },
  tabTextActive: { color: "#ffffff" },
  amountDisplay: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  amountText: {
    fontSize: 48,
    fontWeight: "bold",
  },
  expenseText: { color: "#ef4444" },
  incomeText: { color: "#10b981" },
  currencyLabel: {
    fontSize: 20,
    color: "#64748b",
    marginLeft: 8,
    marginTop: 16,
  },
  budgetHint: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
  },
  budgetHintText: {
    fontSize: 14,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 12,
    marginTop: 8,
  },
  noBudgetBox: {
    backgroundColor: "#fff7ed",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  noBudgetText: {
    color: "#c2410c",
    fontSize: 14,
    lineHeight: 20,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    minWidth: 90,
  },
  categoryBadgeActive: {
    backgroundColor: "#3b82f6",
  },
  categoryBadgeEmpty: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  categoryText: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 14,
  },
  categoryTextActive: { color: "#ffffff" },
  categoryTextEmpty: { color: "#ef4444" },
  categorySubAmount: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "500",
  },
  saveButton: {
    marginTop: 24,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  saveExpense: { backgroundColor: "#ef4444" },
  saveIncome: { backgroundColor: "#10b981" },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  // Modal nhập danh mục tùy chỉnh
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  customCatModal: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  customCatTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
  },
  customCatSubtitle: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    marginBottom: 16,
  },
  customCatInput: {
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
    marginBottom: 20,
  },
  customCatActions: {
    flexDirection: "row",
    gap: 12,
  },
  customCatCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#f1f5f9",
  },
  customCatCancelText: {
    color: "#64748b",
    fontWeight: "600",
    fontSize: 15,
  },
  customCatConfirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  customCatConfirmExpense: {
    backgroundColor: "#ef4444",
  },
  customCatConfirmIncome: {
    backgroundColor: "#10b981",
  },
  customCatConfirmText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 15,
  },
  // Welcome Modal
  welcomeModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "flex-end",
  },
  welcomeModalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#d946ef",
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
    marginBottom: 24,
  },
  welcomeActions: {
    flexDirection: "row",
    gap: 12,
  },
  welcomeSkipBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#f1f5f9",
  },
  welcomeSkipText: {
    color: "#64748b",
    fontWeight: "600",
    fontSize: 15,
  },
  welcomeViewBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#d946ef",
  },
  welcomeViewText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 15,
  },
});

export default HomeScreen;
