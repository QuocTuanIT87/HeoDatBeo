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
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Activity,
  History,
  LayoutGrid,
  List,
  Plus,
  RefreshCcw,
  Settings,
  X,
  Keyboard,
  Coins,
  ArrowUpCircle,
  ArrowDownCircle,
  Eye,
  EyeOff,
  PencilLine,
  PenOff,
  ChevronRight,
} from "lucide-react-native";
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
  const scrollRef = useRef<ScrollView>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [showBudgets, setShowBudgets] = useState(false);
  const [totalBalance, setTotalBalance] = useState<number>(0);

  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState<number>(0);

  // Modal chọn danh mục
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  // Modal ghi chú (sau khi chọn danh mục)
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [selectedCategoryForSave, setSelectedCategoryForSave] =
    useState<string>("");
  const [modalNoteInput, setModalNoteInput] = useState("");
  const [modalCustomCatName, setModalCustomCatName] = useState("");
  const [txDate, setTxDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");

  const openDatePicker = (mode: "date" | "time") => {
    setPickerMode(mode);
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTxDate(selectedDate);
    }
  };

  const formatTxDate = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };
  const formatTxTime = (d: Date) => {
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${min}`;
  };

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [manualInputModalVisible, setManualInputModalVisible] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const manualInputRef = useRef<TextInput>(null);

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

    if (p) {
      const totalAllocated = cats.reduce((sum, c) => sum + c.budget, 0);
      const unallocated = Math.max(0, p.initialBalance - totalAllocated);
      setTotalBalance(totalAllocated + unallocated);
    }

    try {
      const hidden = await AsyncStorage.getItem(HIDE_BALANCE_KEY);
      if (hidden !== null) {
        setShowBudgets(!JSON.parse(hidden));
      }
    } catch (_) {}

    // Tính số tài khoản từ giao dịch đầu tiên
    const txs = await storage.getTransactions();
    let firstTimestamp = p?.initialBalanceTimestamp || Date.now();
    if (txs.length > 0) {
      const minTs = Math.min(...txs.map((t) => t.timestamp));
      firstTimestamp = Math.min(firstTimestamp, minTs);
    }
    const d = new Date(firstTimestamp);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    setAccountNumber(`${dd}${mm}${yyyy}`);

    if (p && p.hasSeenGuide === false) {
      setShowWelcomeModal(true);
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

  const toggleShowBudgets = async () => {
    const next = !showBudgets;
    setShowBudgets(next);
    try {
      await AsyncStorage.setItem(HIDE_BALANCE_KEY, JSON.stringify(!next));
    } catch (_) {}
  };

  const closeWelcomeModal = async (viewGuide: boolean) => {
    setShowWelcomeModal(false);
    if (profile) {
      const updatedProfile = { ...profile, hasSeenGuide: true };
      await storage.saveUserProfile(updatedProfile);
      setProfile(updatedProfile);
    }
    if (viewGuide) {
      (navigation as any).navigate("Guide");
    }
  };

  const handleSave = () => {
    if (amount <= 0) {
      Alert.alert("Chưa nhập số tiền", "Vui lòng nhập số tiền hợp lệ.");
      return;
    }
    setManualInputModalVisible(false);
    setModalNoteInput("");
    // Mở modal chọn danh mục
    setCategoryPickerVisible(true);
  };

  // Khi người dùng chọn danh mục từ modal
  const handlePickCategory = (cat: string) => {
    // Kiểm tra ngân sách sơ bộ
    if (type === "expense") {
      const catBudget = budgets.find((b) => b.name === cat);
      // Danh mục "Khác" luôn chi từ tiền chưa phân bổ
      if (cat === "Khác" || (catBudget && catBudget.type === "direct")) {
        if (!profile) return;
        const totalAllocated = budgets.reduce((sum, b) => sum + b.budget, 0);
        const unallocated = Math.max(
          0,
          profile.initialBalance - totalAllocated,
        );
        if (amount > unallocated) {
          Alert.alert(
            "Tiền chưa phân bổ không đủ",
            `Danh mục "Khác" chi từ tiền chưa phân bổ. Bạn chỉ còn ${formatCurrency(unallocated)} đ.`,
          );
          return;
        }
      } else if (catBudget && (catBudget.type || "recharge") === "recharge") {
        if (amount > catBudget.budget) {
          Alert.alert(
            "Ngân sách không đủ",
            `Danh mục "${cat}" chỉ còn ${formatCurrency(catBudget.budget)} đ.`,
          );
          return;
        }
      }
    }
    setSelectedCategoryForSave(cat);
    setModalCustomCatName("");
    setTxDate(new Date());
    setCategoryPickerVisible(false);
    setNoteModalVisible(true);
  };

  // Xác nhận lưu sau khi nhập ghi chú
  const handleConfirmNote = async () => {
    setNoteModalVisible(false);
    const customLabel =
      selectedCategoryForSave === "Khác" && modalCustomCatName.trim()
        ? modalCustomCatName.trim()
        : undefined;
    await performSave(selectedCategoryForSave, modalNoteInput, txDate, customLabel);
  };

  const performSave = async (
    chosenCategory: string,
    note: string,
    transactionDate: Date,
    customLabel?: string,
  ) => {
    const amountToSave = amount;
    const finalNote = note.trim() || undefined;

    if (type === "expense") {
      const catBudget = budgets.find((b) => b.name === chosenCategory);

      if (catBudget) {
        if ((catBudget.type || "recharge") === "recharge") {
          if (amountToSave > catBudget.budget) {
            Alert.alert(
              "Ngân sách không đủ",
              `Danh mục "${chosenCategory}" chỉ còn ${formatCurrency(catBudget.budget)} đ.`,
            );
            return;
          }
          const updatedBudgets = budgets.map((b) =>
            b.name === chosenCategory
              ? {
                  ...b,
                  budget: b.budget - amountToSave,
                  spent: (b.spent || 0) + amountToSave,
                }
              : b,
          );
          await storage.saveCategoryBudgets(updatedBudgets);
          if (profile) {
            await storage.saveUserProfile({
              ...profile,
              initialBalance: profile.initialBalance - amountToSave,
            });
          }
        } else {
          // Loại "direct": chi từ tiền chưa phân bổ
          if (!profile) return;
          const totalAllocated = budgets.reduce((sum, b) => sum + b.budget, 0);
          const unallocated = Math.max(
            0,
            profile.initialBalance - totalAllocated,
          );
          if (amountToSave > unallocated) {
            Alert.alert(
              "Tiền chưa phân bổ không đủ",
              `Danh mục này chi từ tiền chưa phân bổ. Bạn chỉ còn ${formatCurrency(unallocated)} đ.`,
            );
            return;
          }
          // Cập nhật initialBalance, ngân sách túi direct không đổi (vì nó không quản lý ngân sách riêng)
          // Nhưng ta vẫn cần cập nhật spent của túi direct để thống kê
          const updatedBudgets = budgets.map((b) =>
            b.name === chosenCategory
              ? { ...b, spent: (b.spent || 0) + amountToSave }
              : b,
          );
          await storage.saveCategoryBudgets(updatedBudgets);
          await storage.saveUserProfile({
            ...profile,
            initialBalance: profile.initialBalance - amountToSave,
          });
        }
      } else {
        // Danh mục không có trong budgets (bao gồm "Khác") - chi từ tiền chưa phân bổ
        if (!profile) return;
        const totalAllocated = budgets.reduce((sum, b) => sum + b.budget, 0);
        const unallocated = Math.max(
          0,
          profile.initialBalance - totalAllocated,
        );
        if (amountToSave > unallocated) {
          Alert.alert(
            "Tiền chưa phân bổ không đủ",
            `Bạn chỉ còn ${formatCurrency(unallocated)} đ chưa phân bổ.`,
          );
          return;
        }
        await storage.saveUserProfile({
          ...profile,
          initialBalance: profile.initialBalance - amountToSave,
        });
      }

      const newTx: Transaction = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        type: "expense",
        amount: amountToSave,
        category: customLabel ? "Khác" : chosenCategory,
        categorySnapshot: customLabel ?? chosenCategory,
        note: finalNote,
        timestamp: transactionDate.getTime(),
      };
      await storage.saveTransaction(newTx);
      Alert.alert("Thành công", "Đã lưu khoản chi.");
    } else {
      if (!profile) return;
      const updatedProfile = {
        ...profile,
        initialBalance: profile.initialBalance + amountToSave,
      };
      await storage.saveUserProfile(updatedProfile);

      const newTx: Transaction = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        type: "income",
        amount: amountToSave,
        category: customLabel ? "Khác" : chosenCategory,
        categorySnapshot: customLabel ?? chosenCategory,
        note: finalNote,
        timestamp: transactionDate.getTime(),
      };
      await storage.saveTransaction(newTx);
      Alert.alert(
        "Thành công",
        'Đã lưu khoản thu. Vào tab "Chia Tiền" để phân bổ.',
      );
    }

    setAmount(0);
    loadData();
  };

  const incomeCategories =
    profile?.incomeCategories || DEFAULT_INCOME_CATEGORIES;
  const expenseCategories = budgets.map((b) => b.name);
  const pickerCategories =
    type === "expense" ? expenseCategories : incomeCategories;
  // Nút sáng lên khi có số tiền (> 0), Alert khi nhập < 1.000đ
  const canProceed = amount > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Xin chào, {profile?.name} 👋</Text>
        <View style={styles.accountRow}>
          <Text style={styles.accountLabel}>Số tài khoản: </Text>
          <Text style={styles.accountValue}>{accountNumber}</Text>
        </View>
        <View style={styles.headerRow}>
          <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
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
      </View>

      <View style={styles.tabSection}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, type === "expense" && styles.tabActiveExpense]}
            onPress={() => setType("expense")}
          >
            <ArrowDownCircle
              color={type === "expense" ? "#ffffff" : "#ef4444"}
              size={20}
            />
            <Text
              style={[
                styles.tabText,
                type === "expense" && styles.tabTextActive,
              ]}
            >
              Chi tiền
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, type === "income" && styles.tabActiveIncome]}
            onPress={() => setType("income")}
          >
            <ArrowUpCircle
              color={type === "income" ? "#ffffff" : "#10b981"}
              size={20}
            />
            <Text
              style={[
                styles.tabText,
                type === "income" && styles.tabTextActive,
              ]}
            >
              Thu tiền
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
        >
          {profile?.inputMethod !== "manual" && (
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
          )}

          {/* <View style={styles.inputMethodToggleRow}>
            <TouchableOpacity
              style={styles.quickToggleBtnCircle}
              onPress={toggleInputMethod}
            >
              {profile?.inputMethod === "manual" ? (
                <LayoutGrid color="#64748b" size={24} />
              ) : (
                <Keyboard color="#64748b" size={24} />
              )}
            </TouchableOpacity>
          </View> */}

          {profile?.inputMethod === "manual" ? (
            <View style={styles.manualInputSection}>
              <TouchableOpacity
                style={styles.openManualBtn}
                onPress={() => setManualInputModalVisible(true)}
              >
                <Text style={styles.openManualBtnText}>
                  {amount === 0
                    ? "Nhập số tiền"
                    : `Số tiền: ${formatCurrency(amount)} VNĐ`}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Keypad
                amount={amount}
                onAddAmount={(val) => setAmount((prev) => prev + val)}
                onClear={() => setAmount(0)}
              />
            </View>
          )}

          {profile?.inputMethod !== "manual" && (
            <TouchableOpacity
              style={[
                styles.saveButton,
                canProceed
                  ? type === "expense"
                    ? styles.saveExpense
                    : styles.saveIncome
                  : styles.saveDisabled,
                { marginTop: 10, marginBottom: 40 },
              ]}
              onPress={() => {
                if (amount < 1000) {
                  Alert.alert(
                    "Số tiền không hợp lệ",
                    "Vui lòng nhập số tiền ít nhất 1.000 đ.",
                  );
                  return;
                }
                handleSave();
              }}
              activeOpacity={canProceed ? 0.8 : 0.6}
            >
              <Text style={styles.saveButtonText}>Tiếp Theo →</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal chọn danh mục */}
      <Modal
        visible={categoryPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryPickerVisible(false)}
      >
        <View style={styles.catPickerOverlay}>
          <View style={styles.catPickerModal}>
            <View style={styles.catPickerHeader}>
              <View>
                <Text style={styles.customCatTitle}>
                  {type === "expense"
                    ? "💸 Chọn danh mục chi"
                    : "💰 Chọn nguồn thu"}
                </Text>
                <Text style={styles.catPickerSubtitle}>
                  Số tiền: {formatCurrency(amount)} đ
                </Text>
              </View>
              <TouchableOpacity onPress={() => setCategoryPickerVisible(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            {pickerCategories.length === 0 ? (
              <View style={styles.emptyCatContainer}>
                <Text style={styles.emptyCatText}>
                  Chưa có danh mục. Vào tab "Chia Tiền" để tạo danh mục.
                </Text>
              </View>
            ) : (
              <FlatList
                data={pickerCategories}
                keyExtractor={(item) => item}
                style={styles.catPickerList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const catBudget =
                    type === "expense"
                      ? budgets.find((b) => b.name === item)
                      : null;
                  const remaining = (() => {
                    if (!catBudget) return null;
                    if (catBudget.type === "direct") {
                      if (!profile) return 0;
                      const totalAllocated = budgets.reduce(
                        (s, b) => s + b.budget,
                        0,
                      );
                      return Math.max(
                        0,
                        profile.initialBalance - totalAllocated,
                      );
                    }
                    return catBudget.budget;
                  })();
                  return (
                    <TouchableOpacity
                      style={styles.catPickerItem}
                      onPress={() => handlePickCategory(item)}
                    >
                      <Text style={styles.catPickerItemName}>{item}</Text>
                      <View style={styles.catPickerItemRight}>
                        {remaining !== null && (
                          <Text
                            style={[
                              styles.catPickerItemBudget,
                              remaining <= 0 && { color: "#ef4444" },
                            ]}
                          >
                            {formatCurrency(remaining)} đ
                          </Text>
                        )}
                        <ChevronRight color="#94a3b8" size={18} />
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ItemSeparatorComponent={() => (
                  <View style={styles.catPickerSeparator} />
                )}
                ListFooterComponent={() => {
                  const totalAllocated = budgets.reduce(
                    (s, b) => s + b.budget,
                    0,
                  );
                  const unallocated = profile
                    ? Math.max(0, profile.initialBalance - totalAllocated)
                    : 0;
                  return (
                    <>
                      <View style={styles.catPickerSeparator} />
                      <TouchableOpacity
                        style={[styles.catPickerItem, styles.catPickerItemKhac]}
                        onPress={() => handlePickCategory("Khác")}
                      >
                        <View style={styles.catPickerKhacLabel}>
                          <Text
                            style={[
                              styles.catPickerItemName,
                              { color: "#7c3aed" },
                            ]}
                          >
                            Khác
                          </Text>
                          <Text style={styles.catPickerKhacHint}>
                            {type === "expense"
                              ? "Chi từ tiền chưa phân bổ"
                              : "Nguồn thu khác"}
                          </Text>
                        </View>
                        <View style={styles.catPickerItemRight}>
                          {type === "expense" && (
                            <Text
                              style={[
                                styles.catPickerItemBudget,
                                {
                                  color:
                                    unallocated <= 0 ? "#ef4444" : "#7c3aed",
                                },
                              ]}
                            >
                              {formatCurrency(unallocated)} đ
                            </Text>
                          )}
                          <ChevronRight color="#7c3aed" size={18} />
                        </View>
                      </TouchableOpacity>
                    </>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal ghi chú sau khi chọn danh mục */}
      <Modal
        visible={noteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.noteModal}>
            {/* Nút quay lại */}
            <TouchableOpacity
              style={styles.noteModalBackBtn}
              onPress={() => {
                setNoteModalVisible(false);
                setCategoryPickerVisible(true);
              }}
            >
              <Text style={styles.noteModalBackText}>
                ← Quay lại chọn danh mục
              </Text>
            </TouchableOpacity>

            <Text style={styles.customCatTitle}>
              {type === "expense"
                ? "💸 Hoàn tất chi tiền"
                : "💰 Hoàn tất thu tiền"}
            </Text>
            <Text style={styles.catPickerSubtitle}>
              Danh mục:{" "}
              {selectedCategoryForSave === "Khác" && modalCustomCatName.trim()
                ? modalCustomCatName.trim()
                : selectedCategoryForSave}{" "}
              — {formatCurrency(amount)} đ
            </Text>

            {selectedCategoryForSave === "Khác" && (
              <>
                <Text style={styles.modalFieldLabel}>
                  Tên danh mục (không bắt buộc)
                </Text>
                <TextInput
                  style={styles.modalNoteInput}
                  placeholder={'Để trống sẽ lưu là "Khác"...'}
                  placeholderTextColor="#94a3b8"
                  value={modalCustomCatName}
                  onChangeText={setModalCustomCatName}
                  returnKeyType="done"
                />
              </>
            )}

            <Text style={styles.modalFieldLabel}>Ngày giờ giao dịch</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => openDatePicker("date")}
              >
                <Text style={styles.datePickerBtnText}>{formatTxDate(txDate)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => openDatePicker("time")}
              >
                <Text style={styles.datePickerBtnText}>{formatTxTime(txDate)}</Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={txDate}
                mode={pickerMode}
                is24Hour={true}
                display="default"
                onChange={handleDateChange}
              />
            )}

            <Text style={styles.modalFieldLabel}>Ghi chú (không bắt buộc)</Text>
            <TextInput
              style={styles.modalNoteInput}
              placeholder="Nhập ghi chú nếu có..."
              placeholderTextColor="#94a3b8"
              value={modalNoteInput}
              onChangeText={setModalNoteInput}
              multiline
              numberOfLines={3}
            />

            <View style={styles.customCatActions}>
              <TouchableOpacity
                style={styles.customCatCancelBtn}
                onPress={() => setNoteModalVisible(false)}
              >
                <Text style={styles.customCatCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.customCatConfirmBtn,
                  type === "expense"
                    ? styles.customCatConfirmExpense
                    : styles.customCatConfirmIncome,
                ]}
                onPress={handleConfirmNote}
              >
                <Text style={styles.customCatConfirmText}>Xác nhận lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {manualInputModalVisible && (
        <View style={styles.modalOverlayCenter}>
          <View style={styles.manualInputModalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nhập số tiền</Text>
              <TouchableOpacity
                onPress={() => setManualInputModalVisible(false)}
              >
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <TextInput
              ref={manualInputRef}
              style={styles.manualInputLarge}
              keyboardType="numeric"
              placeholder="0 VNĐ"
              autoFocus={true}
              showSoftInputOnFocus={true}
              value={amount === 0 ? "" : amount.toLocaleString("vi-VN")}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9]/g, "");
                if (!numericValue) {
                  setAmount(0);
                } else {
                  setAmount(parseInt(numericValue, 10));
                }
              }}
            />

            <TouchableOpacity
              style={[
                styles.manualInputDoneBtn,
                canProceed
                  ? type === "expense"
                    ? styles.saveExpense
                    : styles.saveIncome
                  : styles.saveDisabled,
              ]}
              onPress={() => {
                if (amount < 1000) {
                  Alert.alert(
                    "Số tiền không hợp lệ",
                    "Vui lòng nhập số tiền ít nhất 1.000 đ.",
                  );
                  return;
                }
                setManualInputModalVisible(false);
                setTimeout(handleSave, 300);
              }}
            >
              <Text style={styles.manualInputDoneBtnText}>Tiếp Theo →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal visible={showWelcomeModal} transparent animationType="slide">
        <View style={styles.welcomeModalOverlay}>
          <View style={styles.welcomeModalContent}>
            <Text style={styles.welcomeTitle}>Chào người mới! 👋</Text>
            <Text style={styles.welcomeText}>
              Heo Đất Béo là một ứng dụng quản lý tài chính theo phương pháp
              "Phân bổ phong bì". Để sử dụng hiệu quả, bạn nên xem qua hướng dẫn
              hoạt động của dòng tiền nhé.
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
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    backgroundColor: "#5596e0ff",
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  accountLabel: { color: "#fdf4ff", fontSize: 12, opacity: 0.8 },
  accountValue: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  greeting: { color: "#fdf4ff", fontSize: 15, marginBottom: 6 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceLabel: { color: "#fdf4ff", fontSize: 13, opacity: 0.9 },
  eyeBtn: { padding: 4 },
  totalAmount: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 2,
    marginBottom: 16,
  },
  budgetChips: { gap: 10, paddingBottom: 4 },
  budgetChip: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 110,
  },
  chipName: { color: "#fdf4ff", fontSize: 12, marginBottom: 2 },
  chipAmount: { color: "#ffffff", fontSize: 15, fontWeight: "bold" },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 20, paddingTop: 10 },
  tabSection: {
    paddingHorizontal: 20,
    marginTop: -25,
    zIndex: 10,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 6,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  tabActiveExpense: { backgroundColor: "#ef4444" },
  tabActiveIncome: { backgroundColor: "#10b981" },
  tabText: { fontSize: 15, fontWeight: "600", color: "#64748b" },
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
  amountText: { fontSize: 48, fontWeight: "bold" },
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
  budgetHintText: { fontSize: 14, fontWeight: "600" },
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
  noBudgetText: { color: "#c2410c", fontSize: 14, lineHeight: 20 },
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
  categoryBadgeActive: { backgroundColor: "#3b82f6" },
  categoryBadgeEmpty: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  categoryText: { color: "#475569", fontWeight: "600", fontSize: 14 },
  categoryTextActive: { color: "#ffffff" },
  categoryTextEmpty: { color: "#ef4444" },
  categorySubAmount: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "500",
  },
  modalFieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 6,
    marginTop: 10,
  },
  modalNoteInput: {
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
    marginBottom: 20,
    textAlignVertical: "top",
    minHeight: 80,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  saveExpense: { backgroundColor: "#ef4444" },
  saveIncome: { backgroundColor: "#10b981" },
  saveDisabled: { backgroundColor: "#cbd5e1", elevation: 0, shadowOpacity: 0 },
  saveButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  // Footer / Manual Input Styles
  footerAction: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  manualInputSection: {
    marginBottom: 16,
  },
  manualInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    paddingRight: 12,
  },
  manualInput: {
    flex: 1,
    padding: 16,
    fontSize: 26,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "center",
  },
  clearManualBtn: {
    padding: 8,
  },
  openManualBtn: {
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#3b82f6",
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  openManualBtnText: {
    color: "#3b82f6",
    fontSize: 18,
    fontWeight: "bold",
  },
  manualInputModalBox: {
    backgroundColor: "#ffffff",
    width: "96%",
    borderRadius: 24,
    padding: 24,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
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
  manualInputDoneBtn: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  manualInputDoneBtnText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalOverlayTop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 100,
  },
  modalOverlayCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: "30%",
    zIndex: 999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "flex-end",
    paddingHorizontal: 0,
  },
  catPickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "flex-end",
  },
  customCatModal: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    width: "100%",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    paddingBottom: 40,
  },
  noteModal: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    width: "100%",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    paddingBottom: 40,
    minHeight: "60%",
  },
  noteModalBackBtn: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginBottom: 12,
  },
  noteModalBackText: {
    color: "#3b82f6",
    fontSize: 14,
    fontWeight: "600",
  },
  customCatTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
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
  customCatActions: { flexDirection: "row", gap: 12 },
  datePickerBtn: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  datePickerBtnText: {
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "500",
  },
  customCatCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#f1f5f9",
  },
  customCatCancelText: { color: "#64748b", fontWeight: "600", fontSize: 15 },
  customCatConfirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  customCatConfirmExpense: { backgroundColor: "#ef4444" },
  customCatConfirmIncome: { backgroundColor: "#10b981" },
  customCatConfirmText: { color: "#ffffff", fontWeight: "bold", fontSize: 15 },
  welcomeModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  welcomeModalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  welcomeActions: { flexDirection: "row", gap: 12, width: "100%" },
  welcomeSkipBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  welcomeSkipText: { color: "#64748b", fontWeight: "600" },
  welcomeViewBtn: {
    flex: 2,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#d946ef",
  },
  welcomeViewText: { color: "#ffffff", fontWeight: "bold" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
  },
  inputMethodToggleRow: {
    flexDirection: "row",
    paddingHorizontal: 6,
    marginBottom: 8,
  },
  quickToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  quickToggleBtnCircle: {
    backgroundColor: "#ffffff",
    width: 34,
    height: 34,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  // Category Picker Modal Styles
  catPickerModal: {
    backgroundColor: "#ffffff",
    width: "100%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    marginTop: 80,
    flex: 1,
  },
  catPickerKhacLabel: {
    flex: 1,
  },
  catPickerKhacHint: {
    fontSize: 12,
    color: "#7c3aed",
    opacity: 0.7,
    marginTop: 2,
  },
  catPickerItemKhac: {
    backgroundColor: "#f5f3ff",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  catPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  catPickerSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
    marginBottom: 8,
  },
  catPickerList: {
    marginTop: 8,
    flex: 1,
  },
  catPickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  catPickerItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    flex: 1,
  },
  catPickerItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  catPickerItemBudget: {
    fontSize: 15,
    fontWeight: "700",
    color: "#10b981",
  },
  catPickerSeparator: {
    height: 1,
    backgroundColor: "#f1f5f9",
  },
  emptyCatContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyCatText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 22,
  },
});

export default HomeScreen;
