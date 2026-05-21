import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Alert } from "../components/CustomAlert";
import {
  PlusCircle,
  Trash2,
  X,
  Wallet,
  Eye,
  EyeOff,
  PencilLine,
  PenOff,
  LayoutGrid,
  Keyboard,
  ArrowRightLeft,
  RotateCcw,
} from "lucide-react-native";
import { storage } from "../store/storage";
import { CategoryBudget, UserProfile } from "../types";
import { formatCurrency } from "../utils/format";
import Keypad from "../components/Keypad";
import { useIsFocused } from "@react-navigation/native";

export const EXPENSE_ICONS: Record<string, any> = {
  badminton: require("../../assets/expense_icon/badminton.png"),
  beer_mug: require("../../assets/expense_icon/beer-mug.png"),
  bicycle: require("../../assets/expense_icon/bicycle.png"),
  bill: require("../../assets/expense_icon/bill.png"),
  bill_1: require("../../assets/expense_icon/bill_1.png"),
  brand: require("../../assets/expense_icon/brand.png"),
  bus: require("../../assets/expense_icon/bus.png"),
  candies: require("../../assets/expense_icon/candies.png"),
  "card-games": require("../../assets/expense_icon/card-games.png"),
  "clean-clothes": require("../../assets/expense_icon/clean-clothes.png"),
  competitors: require("../../assets/expense_icon/competitors.png"),
  cooking: require("../../assets/expense_icon/cooking.png"),
  cosmetics: require("../../assets/expense_icon/cosmetics.png"),
  date: require("../../assets/expense_icon/date.png"),
  default: require("../../assets/expense_icon/default.png"),
  drink: require("../../assets/expense_icon/drink.png"),
  "electric-car": require("../../assets/expense_icon/electric-car.png"),
  "engine-oil": require("../../assets/expense_icon/engine-oil.png"),
  "flash-card": require("../../assets/expense_icon/flash-card.png"),
  fried_rice: require("../../assets/expense_icon/fried-rice.png"),
  "game-console": require("../../assets/expense_icon/game-console.png"),
  "gas-stove": require("../../assets/expense_icon/gas-stove.png"),
  "gift-card": require("../../assets/expense_icon/gift-card.png"),
  gift: require("../../assets/expense_icon/gift.png"),
  gloves: require("../../assets/expense_icon/gloves.png"),
  "hair-cut": require("../../assets/expense_icon/hair-cut.png"),
  http: require("../../assets/expense_icon/http.png"),
  "ice-cream": require("../../assets/expense_icon/ice-cream.png"),
  "interior-design": require("../../assets/expense_icon/interior-design.png"),
  "interior-design_1": require("../../assets/expense_icon/interior-design_1.png"),
  internet: require("../../assets/expense_icon/internet.png"),
  internet_2: require("../../assets/expense_icon/internet_2.png"),
  invoice: require("../../assets/expense_icon/invoice.png"),
  iphone: require("../../assets/expense_icon/iphone.png"),
  jewelry: require("../../assets/expense_icon/jewelry.png"),
  keyboard: require("../../assets/expense_icon/keyboard.png"),
  kitchen: require("../../assets/expense_icon/kitchen.png"),
  lockers: require("../../assets/expense_icon/lockers.png"),
  main_meal: require("../../assets/expense_icon/main_meal.png"),
  moon: require("../../assets/expense_icon/moon.png"),
  motorbike: require("../../assets/expense_icon/motorbike.png"),
  motorbike_1: require("../../assets/expense_icon/motorbike_1.png"),
  motorcycle: require("../../assets/expense_icon/motorcycle.png"),
  napkin: require("../../assets/expense_icon/napkin.png"),
  noodle: require("../../assets/expense_icon/noodle.png"),
  other: require("../../assets/expense_icon/other.png"),
  outreach: require("../../assets/expense_icon/outreach.png"),
  "parking-car": require("../../assets/expense_icon/parking-car.png"),
  party: require("../../assets/expense_icon/party.png"),
  petrol: require("../../assets/expense_icon/petrol.png"),
  pizza: require("../../assets/expense_icon/pizza.png"),
  plugin: require("../../assets/expense_icon/plugin.png"),
  premium: require("../../assets/expense_icon/premium.png"),
  private: require("../../assets/expense_icon/private.png"),
  rent_house: require("../../assets/expense_icon/rent_house.png"),
  review: require("../../assets/expense_icon/review.png"),
  ring: require("../../assets/expense_icon/ring.png"),
  shampoo: require("../../assets/expense_icon/shampoo.png"),
  shoes: require("../../assets/expense_icon/shoes.png"),
  smoothie: require("../../assets/expense_icon/smoothie.png"),
  "strawberry-cake": require("../../assets/expense_icon/strawberry-cake.png"),
  sweets: require("../../assets/expense_icon/sweets.png"),
  "teddy-bear": require("../../assets/expense_icon/teddy-bear.png"),
  tent: require("../../assets/expense_icon/tent.png"),
  "travel-luggage": require("../../assets/expense_icon/travel-luggage.png"),
  tree: require("../../assets/expense_icon/tree.png"),
  trophy: require("../../assets/expense_icon/trophy.png"),
  "watching-a-movie": require("../../assets/expense_icon/watching-a-movie.png"),
  "water-tap": require("../../assets/expense_icon/water-tap.png"),
  wedding: require("../../assets/expense_icon/wedding.png"),
  wrench: require("../../assets/expense_icon/wrench.png"),
  wristwatch: require("../../assets/expense_icon/wristwatch.png"),
};
// Màn hình BudgetScreen: Quản lý chia tiền vào các danh mục chi tiêu theo tháng
const BudgetScreen = () => {
  const isFocused = useIsFocused();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [unallocated, setUnallocated] = useState<number>(0); // Số dư chưa phân bổ

  // Modal: Chọn Icon
  const [iconModalVisible, setIconModalVisible] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<{
    name: string;
    type: "recharge" | "direct";
  } | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryBudget | null>(
    null,
  );

  const [allocModalVisible, setAllocModalVisible] = useState(false);
  const [selectedCat, setSelectedCat] = useState<CategoryBudget | null>(null);
  const [allocAmount, setAllocAmount] = useState<number>(0);
  const [allocType, setAllocType] = useState<"deposit" | "withdraw">("deposit");

  // Modal: Thêm danh mục mới
  const [addCatModalVisible, setAddCatModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"recharge" | "direct">(
    "recharge",
  );

  // Modal: Xác nhận xóa danh mục (Bảo mật cao)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [catToDelete, setCatToDelete] = useState<CategoryBudget | null>(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [hasTxToDelete, setHasTxToDelete] = useState(false);
  const [showAmount, setShowAmount] = useState(true);
  const [activeTab, setActiveTab] = useState<"recharge" | "direct">("recharge");

  const now = new Date();
  const currentMonthStr = `Tháng ${now.getMonth() + 1}`;

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

    // Chuyển sang bước chọn icon
    setPendingCategory({ name, type: newCatType });
    setAddCatModalVisible(false);
    setIconModalVisible(true);
  };

  const openEditIconModal = (cat: CategoryBudget) => {
    setEditingCategory(cat);
    setPendingCategory(null);
    setIconModalVisible(true);
  };

  const handleSelectIcon = async (iconKey: string) => {
    if (editingCategory) {
      const updated = budgets.map((b) => {
        if (b.name === editingCategory.name) {
          return { ...b, icon: iconKey };
        }
        return b;
      });
      const success = await storage.saveCategoryBudgets(updated);
      if (success) {
        setBudgets(updated);
        setEditingCategory(null);
        setIconModalVisible(false);
      }
      return;
    }

    if (!pendingCategory) return;
    const { name, type } = pendingCategory;

    const txs = await storage.getTransactions();
    let hasUpdatedTx = false;
    const updatedTxs = txs.map((tx) => {
      if (tx.category === "Khác" && tx.categorySnapshot === name) {
        hasUpdatedTx = true;
        return {
          ...tx,
          category: name,
        };
      }
      return tx;
    });

    if (hasUpdatedTx) {
      await storage.updateTransactionsBulk(updatedTxs);
    }

    const updated = [
      ...budgets,
      { name, budget: 0, spent: 0, type, icon: iconKey },
    ];
    const success = await storage.saveCategoryBudgets(updated);
    if (success) {
      setBudgets(updated);
      setNewCatName("");
      setNewCatType("recharge");
      setPendingCategory(null);
      setIconModalVisible(false);
    }
  };

  const handleOpenDeleteConfirm = async (cat: CategoryBudget) => {
    const isDirect = cat.type === "direct";
    const txs = await storage.getTransactions();
    const hasTx = txs.some(
      (t) => (t.categorySnapshot || t.category) === cat.name,
    );

    if (isDirect) {
      Alert.alert(
        "Xác nhận xóa",
        `Bạn có chắc chắn muốn xóa danh mục "${cat.name}"?${
          hasTx ? "\n\n⚠️ Các giao dịch cũ sẽ được chuyển sang mục 'Khác'." : ""
        }`,
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Xóa vĩnh viễn",
            style: "destructive",
            onPress: () => executeDeletion(cat, hasTx),
          },
        ],
      );
      return;
    }

    setCatToDelete(cat);
    setHasTxToDelete(hasTx);
    setDeleteInput("");
    setDeleteConfirmModal(true);
  };

  const executeDeletion = async (cat: CategoryBudget, hasTx: boolean) => {
    const updated = budgets.filter((b) => b.name !== cat.name);
    const success = await storage.saveCategoryBudgets(updated);
    if (success) {
      setBudgets(updated);
      setUnallocated((prev) => prev + cat.budget);

      if (hasTx) {
        const txs = await storage.getTransactions();
        const updatedTxs = txs.map((t) => {
          if ((t.categorySnapshot || t.category) === cat.name) {
            return {
              ...t,
              category: "Khác",
              categorySnapshot: cat.name,
            };
          }
          return t;
        });
        await storage.updateTransactionsBulk(updatedTxs);
      }
      setDeleteConfirmModal(false);
      setCatToDelete(null);
      Alert.alert("Thành công", `Đã xóa danh mục "${cat.name}".`);
    }
  };

  const handleFinalDelete = async () => {
    if (!catToDelete) return;
    const requiredText = `DELETE ${catToDelete.name}`;
    if (deleteInput !== requiredText) {
      Alert.alert("Sai cú pháp", `Vui lòng nhập chính xác: ${requiredText}`);
      return;
    }

    await executeDeletion(catToDelete, hasTxToDelete);
  };

  const handleSwitchCategoryType = (cat: CategoryBudget) => {
    const isDirect = cat.type === "direct";

    if (isDirect) {
      Alert.alert(
        "Chuyển đổi danh mục",
        `Bạn muốn chuyển "${cat.name}" thành danh mục Cần nạp tiền?`,
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Đồng ý",
            onPress: async () => {
              const updated = budgets.map((b) =>
                b.name === cat.name ? { ...b, type: "recharge" as const } : b,
              );
              const success = await storage.saveCategoryBudgets(updated);
              if (success) {
                setBudgets(updated);
                Alert.alert(
                  "Thành công",
                  `Đã chuyển "${cat.name}" thành Cần nạp tiền.`,
                );
              }
            },
          },
        ],
      );
    } else {
      Alert.alert(
        "Chuyển đổi danh mục",
        `Bạn muốn chuyển "${cat.name}" thành danh mục Chi trực tiếp?\n\nSố tiền còn lại trong túi (${formatCurrency(cat.budget)} đ) sẽ được hoàn trả vào tiền chưa phân bổ.`,
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Đồng ý",
            onPress: async () => {
              const returnedAmount = cat.budget;
              const updated = budgets.map((b) =>
                b.name === cat.name
                  ? { ...b, budget: 0, type: "direct" as const }
                  : b,
              );
              const success = await storage.saveCategoryBudgets(updated);
              if (success) {
                setBudgets(updated);
                setUnallocated((prev) => prev + returnedAmount);
                Alert.alert(
                  "Thành công",
                  `Đã chuyển "${cat.name}" thành Chi trực tiếp và hoàn lại ${formatCurrency(returnedAmount)} đ.`,
                );
              }
            },
          },
        ],
      );
    }
  };

  const totalBalance =
    budgets.reduce((sum, c) => sum + c.budget, 0) + unallocated;

  const renderCategoryItem = (cat: CategoryBudget) => {
    const spent = cat.spent || 0;
    const total = cat.budget + spent;
    const percentSpent =
      total > 0 ? (spent / total) * 100 : spent > 0 ? 100 : 0;
    const percentRemaining = 100 - percentSpent;

    let progressColor = "#10b981";
    if (percentRemaining < 20) progressColor = "#ef4444";
    else if (percentRemaining < 50) progressColor = "#f59e0b";

    const isDirect = cat.type === "direct";
    const iconSource =
      EXPENSE_ICONS[cat.icon || "default"] || EXPENSE_ICONS["default"];

    return (
      <TouchableOpacity
        key={cat.name}
        style={styles.catCard}
        onPress={() => (isDirect ? null : openAllocModal(cat))}
        activeOpacity={isDirect ? 1 : 0.7}
      >
        <TouchableOpacity
          style={styles.catIconContainer}
          onPress={() => openEditIconModal(cat)}
        >
          <Image source={iconSource} style={styles.catIcon} />
        </TouchableOpacity>
        <View style={styles.catInfo}>
          <View style={styles.catNameRow}>
            <Text style={styles.catName}>{cat.name}</Text>
          </View>
          {!isDirect && (
            <Text
              style={[
                styles.catBudget,
                {
                  color: cat.budget <= 0 ? "#ef4444" : "#7c3aed",
                  marginTop: 4,
                },
              ]}
            >
              {showAmount ? `${formatCurrency(cat.budget)} đ` : "******"}
            </Text>
          )}

          {!isDirect && (
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(100, percentSpent)}%`,
                      backgroundColor: progressColor,
                    },
                  ]}
                />
              </View>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressText}>
                  Đã dùng:{" "}
                  {showAmount ? `${formatCurrency(spent)} đ` : "******"}
                </Text>
                <Text style={styles.progressPercent}>
                  {Math.round(percentSpent)}%
                </Text>
              </View>
            </View>
          )}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            style={{ padding: 10 }}
            onPress={() => handleSwitchCategoryType(cat)}
          >
            <ArrowRightLeft color="#94a3b8" size={18} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleOpenDeleteConfirm(cat)}
          >
            <Trash2 color="#cbd5e1" size={18} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Top bar */}
        <View style={styles.headerTopBar}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {profile?.avatar ? (
                <Image
                  source={{ uri: profile.avatar }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : "U"}
                </Text>
              )}
              <View style={styles.avatarStatus} />
            </View>
            <View style={styles.profileTextWrapper}>
              <Text style={styles.greetingLabel}>Ngân sách chi tiêu,</Text>
              <Text style={styles.profileName} numberOfLines={1}>
                {profile?.name || "Người dùng"}
              </Text>
            </View>
          </View>

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
        </View>

        {/* Bank Card */}
        <View style={styles.bankCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardBrandWrapper}>
              <Wallet color="#f59e0b" size={16} />
              <Text style={styles.cardBrandText}>QUỸ TIÊU SÀI</Text>
            </View>
            <View style={styles.cardChip} />
          </View>

          <Text style={styles.cardBalanceLabel}>SỐ DƯ CHƯA PHÂN BỔ</Text>
          <Text style={styles.cardBalanceAmount}>
            {showAmount ? `${formatCurrency(unallocated)} đ` : "•••••• đ"}
          </Text>

          <View style={styles.cardStats}>
            <View style={styles.cardStat}>
              <Text style={styles.cardStatLabel}>TỔNG QUỸ</Text>
              <Text style={styles.cardStatValue}>
                {showAmount ? `${formatCurrency(totalBalance)} đ` : "••••••"}
              </Text>
            </View>
            <View style={styles.cardStatDivider} />
            <View style={styles.cardStat}>
              <Text style={styles.cardStatLabel}>KỲ HIỆN TẠI</Text>
              <Text style={styles.cardStatValue}>{currentMonthStr}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.tabSection}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "recharge" && styles.tabActive]}
            onPress={() => setActiveTab("recharge")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "recharge" && styles.tabTextActive,
              ]}
            >
              Cần nạp tiền
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "direct" && styles.tabActive]}
            onPress={() => setActiveTab("direct")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "direct" && styles.tabTextActive,
              ]}
            >
              Chi trực tiếp
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
      >
        <View style={styles.sectionHeader}>
          {/* <Text style={styles.sectionTitle}>
            {activeTab === "recharge" ? "Danh mục" : "Danh mục chi trực tiếp"}
          </Text> */}
          <TouchableOpacity
            style={styles.addCatBtn}
            onPress={() => {
              setNewCatType(activeTab);
              setAddCatModalVisible(true);
            }}
          >
            <PlusCircle color="#7c3aed" size={20} />
            <Text style={styles.addCatText}>Thêm mới danh mục chi tiêu</Text>
          </TouchableOpacity>
        </View>

        {activeTab === "direct" && (
          <View style={styles.tabNoteBox}>
            <Text style={styles.tabNoteText}>
              💡 Giao dịch từ các danh mục này sẽ được trừ trực tiếp vào số tiền
              chưa phân bổ của bạn.
            </Text>
          </View>
        )}

        {budgets.filter((b) => (b.type || "recharge") === activeTab).length ===
        0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              {activeTab === "recharge"
                ? "Chưa có túi chi tiêu nào cần nạp tiền."
                : "Chưa có danh mục chi trực tiếp nào."}
            </Text>
          </View>
        ) : (
          <View style={styles.listSection}>
            {budgets
              .filter((b) => (b.type || "recharge") === activeTab)
              .map((cat) => renderCategoryItem(cat))}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal: Nạp/Rút tiền */}
      <Modal
        visible={allocModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAllocModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <Image
                  source={
                    EXPENSE_ICONS[selectedCat?.icon || "default"] ||
                    EXPENSE_ICONS["default"]
                  }
                  style={{ width: 28, height: 28, resizeMode: "contain" }}
                />
                <Text style={styles.modalTitle}>
                  Phân bổ cho "{selectedCat?.name}"
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAllocModalVisible(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.allocTabs}>
              <TouchableOpacity
                style={[
                  styles.allocTab,
                  allocType === "deposit" && styles.allocTabActiveDeposit,
                ]}
                onPress={() => setAllocType("deposit")}
              >
                <Text
                  style={[
                    styles.allocTabText,
                    allocType === "deposit" && styles.allocTabTextActive,
                  ]}
                >
                  Nạp thêm
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.allocTab,
                  allocType === "withdraw" && styles.allocTabActiveWithdraw,
                ]}
                onPress={() => setAllocType("withdraw")}
              >
                <Text
                  style={[
                    styles.allocTabText,
                    allocType === "withdraw" && styles.allocTabTextActive,
                  ]}
                >
                  Rút ra
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {allocType === "deposit"
                ? "Tiền chưa phân bổ: "
                : "Tiền trong túi: "}
              <Text style={styles.modalHighlight}>
                {formatCurrency(
                  allocType === "deposit"
                    ? unallocated
                    : selectedCat?.budget || 0,
                )}{" "}
                đ
              </Text>
            </Text>

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
              <View style={styles.manualInputWrapper}>
                <TextInput
                  style={styles.manualInput}
                  keyboardType="numeric"
                  placeholder="Nhập số tiền..."
                  placeholderTextColor="#94a3b8"
                  autoFocus
                  value={
                    allocAmount === 0 ? "" : allocAmount.toLocaleString("vi-VN")
                  }
                  onChangeText={(text) => {
                    const numericValue = text.replace(/[^0-9]/g, "");
                    setAllocAmount(
                      numericValue ? parseInt(numericValue, 10) : 0,
                    );
                  }}
                />
              </View>
            ) : (
              <>
                <View style={styles.amountDisplayModal}>
                  <Text style={styles.amountTextModal}>
                    {formatCurrency(allocAmount)}
                  </Text>
                  <Text style={styles.currencyLabelModal}>VNĐ</Text>
                </View>

                <Keypad
                  amount={allocAmount}
                  onAddAmount={(val) => setAllocAmount((prev) => prev + val)}
                  onClear={() => setAllocAmount(0)}
                  hideClearButton={true}
                />
              </>
            )}

            <View style={styles.actionButtonRow}>
              <TouchableOpacity
                style={[
                  styles.actionConfirmBtn,
                  allocType === "deposit"
                    ? { backgroundColor: "#7c3aed" }
                    : { backgroundColor: "#ef4444" },
                  allocAmount === 0 && styles.confirmDisabled,
                ]}
                onPress={handleAllocate}
                disabled={allocAmount === 0}
              >
                <Text style={styles.confirmBtnText}>
                  {allocType === "deposit" ? "Xác nhận nạp" : "Xác nhận rút"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCancelBtn}
                onPress={() => setAllocAmount(0)}
              >
                <RotateCcw color="#ef4444" size={22} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal: Xác nhận xóa (Bảo mật) */}
      <Modal
        visible={deleteConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmModal(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.inputModalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: "#ef4444" }]}>
                Xác nhận xóa vĩnh viễn
              </Text>
              <TouchableOpacity onPress={() => setDeleteConfirmModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <Text style={styles.deleteMsg}>
              Bạn đang xóa túi{" "}
              <Text style={{ fontWeight: "bold" }}>"{catToDelete?.name}"</Text>.
              Hành động này sẽ hoàn trả{" "}
              <Text style={{ fontWeight: "bold", color: "#10b981" }}>
                {formatCurrency(catToDelete?.budget || 0)} đ
              </Text>{" "}
              vào số dư chưa phân bổ.
            </Text>

            {hasTxToDelete && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ Lưu ý: Các giao dịch cũ của túi này sẽ được chuyển sang
                  danh mục "Khác" để giữ lại lịch sử thống kê.
                </Text>
              </View>
            )}

            <Text style={styles.deleteLabel}>
              Nhập chính xác dòng chữ sau để xóa:
            </Text>
            <Text style={styles.requiredText}>DELETE {catToDelete?.name}</Text>

            <TextInput
              style={[
                styles.textInput,
                {
                  borderColor:
                    deleteInput === `DELETE ${catToDelete?.name}`
                      ? "#10b981"
                      : "#ef4444",
                },
              ]}
              placeholder="Nhập vào đây..."
              value={deleteInput}
              onChangeText={setDeleteInput}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                {
                  backgroundColor:
                    deleteInput === `DELETE ${catToDelete?.name}`
                      ? "#ef4444"
                      : "#cbd5e1",
                },
              ]}
              onPress={handleFinalDelete}
              disabled={deleteInput !== `DELETE ${catToDelete?.name}`}
            >
              <Text style={styles.confirmBtnText}>Tôi chắc chắn muốn xóa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Thêm danh mục */}
      <Modal
        visible={addCatModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddCatModalVisible(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.inputModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm danh mục chi tiêu</Text>
              <TouchableOpacity onPress={() => setAddCatModalVisible(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Tên danh mục (vd: Ăn uống, Xăng xe...)"
              placeholderTextColor="#94a3b8"
              value={newCatName}
              onChangeText={setNewCatName}
              autoFocus
              onSubmitEditing={handleAddCategory}
            />

            <Text style={styles.typeLabel}>
              Kiểu danh mục:{" "}
              {newCatType === "direct" ? "Không cần nạp" : "Cần nạp tiền"}
            </Text>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleAddCategory}
            >
              <Text style={styles.confirmBtnText}>Tạo danh mục mới</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Chọn Icon */}
      <Modal
        visible={iconModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          handleSelectIcon(
            editingCategory ? editingCategory.icon || "default" : "default",
          )
        }
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.iconModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn biểu tượng túi chi</Text>
              <TouchableOpacity
                onPress={() =>
                  handleSelectIcon(
                    editingCategory
                      ? editingCategory.icon || "default"
                      : "default",
                  )
                }
              >
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>
            <Text style={styles.iconModalSubtitle}>
              Chọn biểu tượng đại diện cho túi chi "
              {pendingCategory?.name || editingCategory?.name}"
            </Text>

            <ScrollView
              contentContainerStyle={styles.iconGrid}
              showsVerticalScrollIndicator={false}
            >
              {Object.keys(EXPENSE_ICONS).map((iconKey) => {
                return (
                  <TouchableOpacity
                    key={iconKey}
                    style={styles.iconGridItem}
                    onPress={() => handleSelectIcon(iconKey)}
                  >
                    <Image
                      source={EXPENSE_ICONS[iconKey]}
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
              onPress={() =>
                handleSelectIcon(
                  editingCategory
                    ? editingCategory.icon || "default"
                    : "default",
                )
              }
            >
              <Text style={styles.confirmBtnText}>
                {editingCategory ? "Hủy" : "Dùng biểu tượng mặc định"}
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
    backgroundColor: "#5596e0",
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 40,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  headerTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  avatarStatus: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10b981",
    borderWidth: 1.5,
    borderColor: "#5596e0",
  },
  profileTextWrapper: { marginLeft: 10 },
  greetingLabel: { color: "#cccccc", fontSize: 12 },
  profileName: { color: "#ffffff", fontSize: 15, fontWeight: "bold" },
  eyeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  bankCard: {
    backgroundColor: "#1e293b",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardBrandWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardBrandText: {
    color: "#f59e0b",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  cardChip: {
    width: 32,
    height: 24,
    borderRadius: 4,
    backgroundColor: "#f59e0b",
    opacity: 0.8,
  },
  cardBalanceLabel: {
    color: "#94a3b8",
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardBalanceAmount: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 18,
  },
  cardStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  cardStat: { flex: 1 },
  cardStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 12,
  },
  cardStatLabel: {
    color: "#94a3b8",
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardStatValue: { color: "#ffffff", fontSize: 14, fontWeight: "bold" },
  // Legacy styles kept for references but no longer used in header
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 16, color: "#fdf4ff", opacity: 0.9 },
  headerSubtitle: { fontSize: 13, color: "#fdf4ff", opacity: 0.7, marginTop: 4 },
  unallocatedBox: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  unallocatedAmount: { color: "#ffffff", fontSize: 32, fontWeight: "bold", marginLeft: 10 },
  headerCards: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, padding: 16, alignItems: "center" },
  headerCard: { flex: 1 },
  headerDivider: { width: 1, height: 35, backgroundColor: "rgba(255,255,255,0.3)", marginHorizontal: 12 },
  headerCardLabel: { color: "#ede9fe", fontSize: 13, marginBottom: 4 },
  headerCardValue: { color: "#ffffff", fontSize: 17, fontWeight: "bold" },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 20, paddingTop: 10 },
  tabSection: {
    paddingHorizontal: 20,
    marginTop: -25,
    zIndex: 10,
  },
  tabContainer: {
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
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: "#7c3aed",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748b",
  },
  tabTextActive: {
    color: "#ffffff",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },
  addCatBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f3ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  addCatText: { color: "#7c3aed", fontWeight: "bold", fontSize: 13 },
  emptyBox: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginTop: 20,
    elevation: 1,
  },
  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 22,
    fontSize: 15,
  },
  catCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  catInfo: { flex: 1 },
  catNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  catName: { fontSize: 17, fontWeight: "bold", color: "#334155" },
  catBudget: { fontSize: 16, fontWeight: "bold" },
  progressContainer: { marginTop: 16 },
  progressTrack: {
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  progressText: { fontSize: 13, color: "#64748b" },
  progressPercent: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  deleteBtn: { padding: 10, marginLeft: 10 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "flex-start",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    paddingBottom: 40,
    paddingTop: 90,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 19, fontWeight: "bold", color: "#0f172a" },
  allocTabs: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  allocTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  allocTabActiveDeposit: { backgroundColor: "#10b981" },
  allocTabActiveWithdraw: { backgroundColor: "#ef4444" },
  allocTabText: { fontWeight: "bold", color: "#64748b" },
  allocTabTextActive: { color: "#ffffff" },
  modalSubtitle: { fontSize: 15, color: "#64748b", marginBottom: 16 },
  modalHighlight: { color: "#0f172a", fontWeight: "bold" },
  amountDisplayModal: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  amountTextModal: { fontSize: 32, fontWeight: "bold", color: "#0f172a" },
  currencyLabelModal: {
    fontSize: 16,
    color: "#64748b",
    marginLeft: 8,
    marginTop: 8,
  },
  actionButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 24,
  },
  actionConfirmBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actionCancelBtn: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  confirmDisabled: {
    backgroundColor: "#cbd5e1",
    elevation: 0,
    shadowOpacity: 0,
  },
  cancelBtnText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "bold",
  },
  confirmBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  confirmBtn: {
    backgroundColor: "#7c3aed",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 24,
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  inputModalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    elevation: 20,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0f172a",
    marginBottom: 16,
    backgroundColor: "#f8fafc",
    textAlignVertical: "center",
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 10,
  },
  typeToggleRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  typeToggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  typeToggleBtnActive: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  typeToggleText: { fontSize: 14, color: "#64748b", fontWeight: "600" },
  typeToggleTextActive: { color: "#ffffff" },
  listSection: { marginBottom: 10 },
  listSectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#64748b",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  deleteMsg: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 22,
    marginBottom: 12,
  },
  warningBox: {
    backgroundColor: "#fff7ed",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  warningText: { fontSize: 13, color: "#c2410c", lineHeight: 18 },
  deleteLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginTop: 10,
    marginBottom: 4,
  },
  requiredText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ef4444",
    marginBottom: 12,
    backgroundColor: "#fef2f2",
    padding: 10,
    borderRadius: 8,
    textAlign: "center",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  tabNoteBox: {
    backgroundColor: "#eff6ff",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  tabNoteText: {
    fontSize: 10,
    color: "#1e40af",
    lineHeight: 18,
    fontWeight: "500",
  },
  inputMethodToggleRow: {
    flexDirection: "row",
    paddingHorizontal: 6,
    marginBottom: 16,
    marginTop: 10,
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
  manualInputWrapper: {
    marginBottom: 20,
  },
  manualInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 20,
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "center",
  },
  catIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f5f3ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  catIcon: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  iconModalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxHeight: "80%",
    elevation: 20,
  },
  iconModalSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 16,
    lineHeight: 20,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
  },
  iconGridItem: {
    width: "22%",
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  iconItemImage: {
    width: 38,
    height: 38,
    resizeMode: "contain",
  },
});

export default BudgetScreen;
