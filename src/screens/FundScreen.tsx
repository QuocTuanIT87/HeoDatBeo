import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  RefreshControl,
  Image,
} from "react-native";
import { Alert } from "../components/CustomAlert";
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
  RotateCcw,
  HelpCircle,
} from "lucide-react-native";
import { storage } from "../store/storage";
import { UserProfile, Transaction, CategoryBudget, CustomFund } from "../types";
import { BottomTabParamList } from "../navigation/types";
import Keypad from "../components/Keypad";
import { styles } from "../styles/FundScreen";

const FUND_ICONS: Record<string, any> = {
  default: require("../../assets/fund_icon/default.png"),
  spending: require("../../assets/fund_icon/spending.png"),
  save: require("../../assets/fund_icon/save.png"),
  alarm: require("../../assets/fund_icon/alarm.png"),
  application: require("../../assets/fund_icon/application.png"),
  borrow: require("../../assets/fund_icon/borrow.png"),
  buy: require("../../assets/fund_icon/buy.png"),
  car: require("../../assets/fund_icon/car.png"),
  earning: require("../../assets/fund_icon/earning.png"),
  "gold-bars": require("../../assets/fund_icon/gold-bars.png"),
  healthcare: require("../../assets/fund_icon/healthcare.png"),
  land: require("../../assets/fund_icon/land.png"),
  "laptop-screen": require("../../assets/fund_icon/laptop-screen.png"),
  prevention: require("../../assets/fund_icon/prevention.png"),
  travel: require("../../assets/fund_icon/travel.png"),
  "wedding-couple": require("../../assets/fund_icon/wedding-couple.png"),
};

type FundScreenNavigationProp = BottomTabNavigationProp<
  BottomTabParamList,
  "Funds"
>;

const FundScreen = () => {
  const navigation = useNavigation<FundScreenNavigationProp>();
  const isFocused = useIsFocused();

  const handleShowTotalFundInfo = () => {
    Alert.normal(
      "TỔNG TIỀN QUỸ",
      "Đây là tổng số tiền có trong các quỹ của bạn\n\nKhông bao gồm số dư chưa phân bổ",
      [
        {
          text: "Hướng dẫn",
          onPress: () => (navigation as any).navigate("Guide"),
        },
        {
          text: "Đóng",
          style: "cancel",
        },
      ]
    );
  };

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
  const [iconModalVisible, setIconModalVisible] = useState(false);
  const [pendingFund, setPendingFund] = useState<{
    id?: string;
    name: string;
  } | null>(null);

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
      if (p.customFunds === undefined) {
        p.customFunds = [
          { id: Date.now().toString() + "_1", name: "Quỹ Cho Vay", balance: 0 },
          {
            id: Date.now().toString() + "_2",
            name: "Quỹ Khẩn Cấp",
            balance: 0,
          },
          { id: Date.now().toString() + "_3", name: "Quỹ Đầu Tư", balance: 0 },
        ];
        await storage.saveUserProfile(p);
      }
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

      // Calculate total funds (excluding unallocated)
      let customFundsTotal = 0;
      if (p.customFunds) {
        customFundsTotal = p.customFunds.reduce((sum, f) => sum + f.balance, 0);
      }
      setTotalBalance(allocated + calcSaving + customFundsTotal);
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
    if (newFundName.trim() === "Quỹ" || newFundName.trim() === "") {
      Alert.alert("Lỗi", "Vui lòng nhập tên quỹ hợp lệ.");
      return;
    }

    if (!profile) return;

    // Đóng modal tên quỹ và mở modal chọn icon
    setPendingFund({ name: newFundName.trim() });
    setAddFundModalVisible(false);
    setIconModalVisible(true);
  };

  const openEditIconModal = (id: string, name: string) => {
    setPendingFund({ id, name });
    setIconModalVisible(true);
  };

  const handleSelectIcon = async (iconKey: string) => {
    if (!profile) return;

    if (pendingFund?.id) {
      // Đang chỉnh sửa icon của quỹ đã có
      let updatedProfile: UserProfile = { ...profile };
      if (pendingFund.id === "spending") {
        updatedProfile.spendingFundIcon = iconKey;
      } else if (pendingFund.id === "saving") {
        updatedProfile.savingFundIcon = iconKey;
      } else {
        const updatedFunds = (profile.customFunds || []).map((f) => {
          if (f.id === pendingFund.id) {
            return { ...f, icon: iconKey };
          }
          return f;
        });
        updatedProfile.customFunds = updatedFunds;
      }

      const success = await storage.saveUserProfile(updatedProfile);
      if (success) {
        setProfile(updatedProfile);
        setPendingFund(null);
        setIconModalVisible(false);
        loadData();
      }
      return;
    }

    if (!pendingFund) return;

    // Đang tạo quỹ mới
    const newFund: CustomFund = {
      id: Date.now().toString(),
      name: pendingFund.name,
      balance: 0,
      icon: iconKey,
    };

    const updatedProfile = {
      ...profile,
      customFunds: [...(profile.customFunds || []), newFund],
    };

    const success = await storage.saveUserProfile(updatedProfile);
    if (success) {
      setProfile(updatedProfile);
      setPendingFund(null);
      setIconModalVisible(false);
      setNewFundName("Quỹ ");
      loadData();
    }
  };

  const handleCancelIcon = () => {
    if (!pendingFund) {
      setIconModalVisible(false);
      return;
    }

    if (pendingFund.id) {
      setPendingFund(null);
      setIconModalVisible(false);
    } else {
      handleSelectIcon("default");
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
        category: `Xóa quỹ ${fundToDelete.name}`,
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

    const actionLabel = txType === "deposit" ? "Nạp tiền" : "Rút tiền";
    const emoji = txType === "deposit" ? "✅" : "💸";
    Alert.alert(
      `${emoji} ${actionLabel} thành công`,
      `Đã ${actionLabel.toLowerCase()} ${formatCurrency(amount)} đ ${
        txType === "deposit"
          ? `vào ${selectedFund.name}`
          : `từ ${selectedFund.name}`
      }.`,
      [{ text: "OK", style: "default" }],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Top bar with User Profile and history action */}
        <View style={styles.headerTopBar}>
          <View style={styles.profileSection}>
          </View>

          <View style={styles.headerActions}>
            {/* <TouchableOpacity
              onPress={() => navigation.navigate("FundHistory" as any)}
              style={styles.actionBtn}
              activeOpacity={0.7}
            >
              <History color="#ffffff" size={20} />
            </TouchableOpacity> */}
          </View>
        </View>

        {/* Bank Card / Account card */}
        <View style={styles.bankCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardBrandWrapper}>
              
              <Wallet color="#f59e0b" size={18} />
              <Text style={styles.cardBrandText}>HEO ĐẤT BÉO DIGITAL</Text>
            </View>
            <View style={styles.row}>
               <TouchableOpacity
              onPress={() => navigation.navigate("FundHistory" as any)}
              style={styles.actionBtn}
              activeOpacity={0.7}
            >
              <History color="#ffffff" size={15} />
            </TouchableOpacity>
            <View style={styles.cardChip} />
            </View>
          </View>

          <View style={styles.cardMiddle}>
            <View style={styles.cardAccountLabelContainer}>
              <Text style={styles.cardAccountLabel}>TỔNG TIỀN QUỸ</Text>
              <TouchableOpacity
                onPress={handleShowTotalFundInfo}
                style={styles.helpIconTouch}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <HelpCircle color="#94a3b8" size={12} />
              </TouchableOpacity>
            </View>
            <View style={styles.row}>
              <Text style={styles.cardBalanceAmount}>
              {showAmount ? `${formatCurrency(totalBalance)} đ` : "•••••• đ"}
            </Text>
            <TouchableOpacity
              onPress={() => setShowAmount(!showAmount)}
              style={styles.cardEyeBtn}
              activeOpacity={0.7}
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
          <TouchableOpacity
            style={[styles.fundIcon, { backgroundColor: "#f3e8ff" }]}
            onPress={() => openEditIconModal("spending", "Quỹ Tiêu Sài")}
          >
            <Image
              source={
                FUND_ICONS[profile?.spendingFundIcon || "spending"] ||
                FUND_ICONS["spending"]
              }
              style={{ width: 28, height: 28, resizeMode: "contain" }}
            />
          </TouchableOpacity>
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
          <TouchableOpacity
            style={[styles.fundIcon, { backgroundColor: "#fef3c7" }]}
            onPress={() => openEditIconModal("saving", "Quỹ Tiết Kiệm")}
          >
            <Image
              source={
                FUND_ICONS[profile?.savingFundIcon || "save"] ||
                FUND_ICONS["save"]
              }
              style={{ width: 28, height: 28, resizeMode: "contain" }}
            />
          </TouchableOpacity>
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
          <Text style={styles.sectionTitle}>Quỹ khác</Text>
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
            <TouchableOpacity
              style={[styles.fundIcon, { backgroundColor: "#e0f2fe" }]}
              onPress={() => openEditIconModal(fund.id, fund.name)}
            >
              <Image
                source={
                  FUND_ICONS[fund.icon || "default"] || FUND_ICONS["default"]
                }
                style={{ width: 28, height: 28, resizeMode: "contain" }}
              />
            </TouchableOpacity>
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
                  hideClearButton={true}
                />
              </View>
            )}

            <View style={styles.actionButtonRow}>
              <TouchableOpacity
                style={[
                  styles.actionConfirmBtn,
                  txType === "deposit" ? styles.bgDeposit : styles.bgWithdraw,
                  amount <= 0 && styles.bgDisabled,
                ]}
                onPress={executeTransaction}
                disabled={amount <= 0}
              >
                <Text style={styles.confirmBtnText}>Xác Nhận</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCancelBtn}
                onPress={() => setAmount(0)}
              >
                <RotateCcw color="#ef4444" size={22} />
              </TouchableOpacity>
            </View>
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
              <Text style={[styles.modalTitle, { color: "#ef4444" }]}>
                🗑 Xóa Quỹ
              </Text>
              <TouchableOpacity
                onPress={() => setDeleteFundModalVisible(false)}
              >
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.deleteWarningBox}>
              <Text style={styles.deleteWarningText}>
                ⚠️ Quỹ{" "}
                <Text style={{ fontWeight: "bold" }}>{fundToDelete?.name}</Text>{" "}
                sẽ bị xóa vĩnh viễn.
              </Text>
              {(fundToDelete?.balance ?? 0) > 0 && (
                <Text style={styles.deleteRefundText}>
                  💰 Số dư{" "}
                  <Text style={{ fontWeight: "bold" }}>
                    {formatCurrency(fundToDelete?.balance ?? 0)} đ
                  </Text>{" "}
                  sẽ được hoàn về tiền chưa phân bổ.
                </Text>
              )}
            </View>

            <Text style={styles.deleteHintText}>
              Nhập{" "}
              <Text style={styles.deleteHintCode}>
                DELETE {fundToDelete?.name}
              </Text>{" "}
              để xác nhận:
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
                  deleteConfirmText.trim() !== `DELETE ${fundToDelete?.name}` &&
                    styles.bgDisabled,
                ]}
                onPress={handleConfirmDeleteFund}
              >
                <Text style={styles.deleteConfirmText}>Xóa Quỹ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Chọn Icon Quỹ */}
      <Modal
        visible={iconModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelIcon}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.iconModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn biểu tượng quỹ</Text>
              <TouchableOpacity onPress={handleCancelIcon}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>
            <Text style={styles.iconModalSubtitle}>
              Chọn biểu tượng đại diện cho quỹ "{pendingFund?.name}"
            </Text>

            <ScrollView
              contentContainerStyle={styles.iconGrid}
              showsVerticalScrollIndicator={false}
            >
              {Object.keys(FUND_ICONS).map((iconKey) => {
                return (
                  <TouchableOpacity
                    key={iconKey}
                    style={styles.iconGridItem}
                    onPress={() => handleSelectIcon(iconKey)}
                  >
                    <Image
                      source={FUND_ICONS[iconKey]}
                      style={styles.iconItemImage}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                { backgroundColor: "#64748b", marginTop: 16 },
              ]}
              onPress={handleCancelIcon}
            >
              <Text style={styles.confirmBtnText}>
                {pendingFund?.id ? "Hủy" : "Tạo quỹ"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};



export default FundScreen;
