import React, { useEffect, useState } from "react";
import {
  View,
  Text,
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
  ArrowRightLeft,
  RotateCcw,
  HelpCircle,
  PencilLine,
  Settings,
} from "lucide-react-native";
import { storage } from "../store/storage";
import { CategoryBudget, UserProfile } from "../types";
import { formatCurrency } from "../utils/format";
import { isCategoryIdMatch } from "../utils/category";
import Keypad from "../components/Keypad";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { styles } from "../styles/BudgetScreen";
import { Archive } from "lucide-react-native/icons";

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
  maintenance: require("../../assets/expense_icon/maintenance.png"),
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
  const navigation = useNavigation<any>();

  const handleShowTotalFundInfo = () => {
    Alert.normal(
      "TỔNG QUỸ TIÊU SÀI",
      "Đây là tổng số tiền trong các danh mục bạn đã chia tiền\n",
      [
        {
          text: "Hướng dẫn",
          onPress: () => {
            navigation.navigate("Guide");
          },
        },
        {
          text: "Đóng",
          style: "cancel",
        },
      ],
    );
  };

  const handleShowUnallocatedInfo = () => {
    Alert.normal(
      "SỐ DƯ CHƯA PHÂN BỔ",
      "Số dư chưa phân bổ là số tiền bạn dùng để phân chia vào danh mục cần nạp tiền và các loại quỹ.",
      [
        {
          text: "Hướng dẫn",
          onPress: () => {
            navigation.navigate("Guide");
          },
        },
        {
          text: "Đóng",
          style: "cancel",
        },
      ],
    );
  };

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
  const [showAmount, setShowAmount] = useState(false);
  const [activeTab, setActiveTab] = useState<"recharge" | "direct">("recharge");

  // Rename state for expense category
  const [isRenameModalVisible, setRenameModalVisible] = useState(false);
  const [renameTarget, setRenameTarget] = useState<CategoryBudget | null>(null);
  const [renameInputText, setRenameInputText] = useState("");

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
          const match = cats.find(
            (c) =>
              tx.categoryId && c.id && isCategoryIdMatch(c.id, tx.categoryId),
          );
          if (match && match.id) {
            spentMap[match.id] = (spentMap[match.id] || 0) + tx.amount;
          } else {
            const catId = tx.categoryId || "expense_khac";
            spentMap[catId] = (spentMap[catId] || 0) + tx.amount;
          }
        }
      }
    });

    cats = cats.map((c) => {
      const key = c.id || c.name;
      return {
        ...c,
        spent: spentMap[key] || 0,
      };
    });

    setProfile(p);
    const activeCats = cats.filter(
      (c) => c.deleteAt === null || c.deleteAt === undefined,
    );
    setBudgets(activeCats);
    if (p) {
      const totalAllocated = activeCats.reduce((sum, c) => sum + c.budget, 0);
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

    const allBudgets = await storage.getCategoryBudgets();
    const updated = allBudgets.map((b) => {
      const isMatch =
        b.id && selectedCat.id
          ? isCategoryIdMatch(b.id, selectedCat.id)
          : b.name === selectedCat.name;
      return isMatch
        ? {
            ...b,
            budget:
              allocType === "deposit"
                ? b.budget + allocAmount
                : b.budget - allocAmount,
          }
        : b;
    });
    const success = await storage.saveCategoryBudgets(updated);
    if (success) {
      await loadData();
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

    if (
      name === "Tiết kiệm" ||
      name === "Rút tiết kiệm" ||
      name === "Nuôi heo béo" ||
      name === "Heo giảm cân"
    ) {
      Alert.alert("Lỗi", "Tên danh mục này đã được sử dụng hệ thống.");
      return;
    }

    const allBudgets = await storage.getCategoryBudgets();
    const activeExists = allBudgets.some(
      (b) =>
        (b.deleteAt === null || b.deleteAt === undefined) && b.name === name,
    );
    if (activeExists) {
      Alert.alert("Lỗi", "Danh mục này đã tồn tại.");
      return;
    }

    const softDeletedCat = allBudgets.find(
      (b) => b.deleteAt !== null && b.deleteAt !== undefined && b.name === name,
    );
    if (softDeletedCat) {
      const updated = allBudgets.map((b) => {
        return b.name === name ? { ...b, deleteAt: null } : b;
      });
      const success = await storage.saveCategoryBudgets(updated);
      if (success) {
        await loadData();
        setNewCatName("");
        setAddCatModalVisible(false);
        Alert.alert("Thành công", `Đã khôi phục danh mục chi tiêu "${name}".`);
      }
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
    const allBudgets = await storage.getCategoryBudgets();
    if (editingCategory) {
      const updated = allBudgets.map((b) => {
        const isMatch =
          b.id && editingCategory.id
            ? isCategoryIdMatch(b.id, editingCategory.id)
            : b.name === editingCategory.name;
        if (isMatch) {
          return { ...b, icon: iconKey };
        }
        return b;
      });
      const success = await storage.saveCategoryBudgets(updated);
      if (success) {
        await loadData();
        setEditingCategory(null);
        setIconModalVisible(false);
      }
      return;
    }

    if (!pendingCategory) return;
    const { name, type } = pendingCategory;
    const newId =
      "expense_" +
      name.toLowerCase().replace(/[^a-z0-9]/g, "_") +
      "_" +
      Math.random().toString(36).substr(2, 5);

    const updated = [
      ...allBudgets,
      { id: newId, name, budget: 0, spent: 0, type, icon: iconKey },
    ];
    const success = await storage.saveCategoryBudgets(updated);
    if (success) {
      await loadData();
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
      (t) => t.categoryId && cat.id && isCategoryIdMatch(t.categoryId, cat.id),
    );

    if (isDirect) {
      Alert.alert(
        "Xác nhận xóa",
        `Bạn có chắc chắn muốn xóa danh mục "${cat.name}"?`,
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Xóa",
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
    const allBudgets = await storage.getCategoryBudgets();
    let updated: CategoryBudget[];
    if (hasTx) {
      updated = allBudgets.map((b) => {
        const isMatch =
          b.id && cat.id
            ? isCategoryIdMatch(b.id, cat.id)
            : b.name === cat.name;
        return isMatch ? { ...b, deleteAt: Date.now(), budget: 0 } : b;
      });
    } else {
      updated = allBudgets.filter((b) =>
        b.id && cat.id ? !isCategoryIdMatch(b.id, cat.id) : b.name !== cat.name,
      );
    }
    const success = await storage.saveCategoryBudgets(updated);
    if (success) {
      await loadData();
      setDeleteConfirmModal(false);
      setCatToDelete(null);
      Alert.alert("Thành công", `Đã xóa danh mục "${cat.name}".`);
    }
  };

  const handleFinalDelete = async () => {
    if (!catToDelete) return;
    await executeDeletion(catToDelete, hasTxToDelete);
  };

  const handleOpenRenameModal = (cat: CategoryBudget) => {
    if (
      cat.name === "Tiết kiệm" ||
      cat.name === "Rút tiết kiệm" ||
      cat.name === "Nuôi heo béo" ||
      cat.name === "Heo giảm cân" ||
      cat.name === "Số dư đầu tiên" ||
      cat.name === "Khác"
    ) {
      Alert.alert("Lỗi", "Không thể đổi tên danh mục hệ thống.");
      return;
    }
    setRenameTarget(cat);
    setRenameInputText(cat.name);
    setRenameModalVisible(true);
  };

  const handleRenameConfirm = async () => {
    const trimmedNewName = renameInputText.trim();
    if (!trimmedNewName || !renameTarget) return;

    if (
      trimmedNewName === "Tiết kiệm" ||
      trimmedNewName === "Rút tiết kiệm" ||
      trimmedNewName === "Nuôi heo béo" ||
      trimmedNewName === "Heo giảm cân" ||
      trimmedNewName === "Số dư đầu tiên" ||
      trimmedNewName === "Khác"
    ) {
      Alert.alert("Lỗi", "Tên danh mục này trùng với tên danh mục hệ thống.");
      return;
    }

    const allBudgets = await storage.getCategoryBudgets();
    const isConflicting = allBudgets.some(
      (b) =>
        b.id &&
        renameTarget.id &&
        !isCategoryIdMatch(b.id, renameTarget.id) &&
        b.name === trimmedNewName,
    );
    if (isConflicting) {
      Alert.alert("Lỗi", "Tên danh mục này đã tồn tại.");
      return;
    }

    // Ensure target has an ID just in case
    const targetId =
      renameTarget.id ||
      "expense_" +
        renameTarget.name.toLowerCase().replace(/[^a-z0-9]/g, "_") +
        "_" +
        Math.random().toString(36).substr(2, 5);

    const updatedBudgets = allBudgets.map((b) => {
      const isMatch =
        b.id && renameTarget.id
          ? isCategoryIdMatch(b.id, renameTarget.id)
          : b.name === renameTarget.name;
      return isMatch ? { ...b, id: targetId, name: trimmedNewName } : b;
    });

    const success = await storage.saveCategoryBudgets(updatedBudgets);
    if (success) {
      await loadData();
      setRenameModalVisible(false);
      setRenameTarget(null);
      setRenameInputText("");
      Alert.alert("Thành công", "Đã đổi tên danh mục.");
    } else {
      Alert.alert("Lỗi", "Không thể lưu thay đổi.");
    }
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
              const allBudgets = await storage.getCategoryBudgets();
              const updated = allBudgets.map((b) => {
                const isMatch =
                  b.id && cat.id
                    ? isCategoryIdMatch(b.id, cat.id)
                    : b.name === cat.name;
                return isMatch ? { ...b, type: "recharge" as const } : b;
              });
              const success = await storage.saveCategoryBudgets(updated);
              if (success) {
                await loadData();
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
              const allBudgets = await storage.getCategoryBudgets();
              const updated = allBudgets.map((b) => {
                const isMatch =
                  b.id && cat.id
                    ? isCategoryIdMatch(b.id, cat.id)
                    : b.name === cat.name;
                return isMatch
                  ? { ...b, budget: 0, type: "direct" as const }
                  : b;
              });
              const success = await storage.saveCategoryBudgets(updated);
              if (success) {
                await loadData();
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

  const totalBalance = budgets.reduce((sum, c) => sum + c.budget, 0);

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
        style={[styles.catCard, { padding: isDirect ? 22 : 18 }]}
        onPress={() => (isDirect ? null : openAllocModal(cat))}
        activeOpacity={isDirect ? 1 : 0.7}
      >
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            zIndex: 10,
            padding: 4,
          }}
          onPress={() => handleOpenRenameModal(cat)}
        >
          <Settings color="#cbd5e1" size={14} />
        </TouchableOpacity>
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
                  Đã dùng {Math.round(percentSpent)}%:{" "}
                </Text>
                <Text style={styles.progressPercent}>
                  {showAmount ? `${formatCurrency(spent)} đ` : "******"}
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
            <ArrowRightLeft color="#cbd5e1" size={18} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleOpenDeleteConfirm(cat)}
          >
            <Trash2 color="#dddddd" size={16} />
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
          <View style={styles.profileSection}></View>
        </View>

        {/* Bank Card */}
        <View style={styles.bankCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardBrandWrapper}>
              <Wallet color="#f59e0b" size={16} />
              <Text style={styles.cardBrandText}>QUỸ TIÊU SÀI</Text>
            </View>
            <View style={styles.row}>
              <TouchableOpacity
                onPress={() =>
                  (navigation as any).navigate("DeletedCategories")
                }
                style={styles.eyeBtn}
              >
                <Archive color="#ffffff" size={15} />
              </TouchableOpacity>
              <View style={styles.cardChip} />
            </View>
          </View>

          <View style={styles.cardBalanceLabelContainer}>
            <Text style={styles.cardBalanceLabel}>SỐ DƯ CHƯA PHÂN BỔ</Text>
            <TouchableOpacity
              onPress={handleShowUnallocatedInfo}
              style={styles.helpIconTouch}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <HelpCircle color="#94a3b8" size={12} />
            </TouchableOpacity>
          </View>
          <View style={styles.rowmb10}>
            <Text style={styles.cardBalanceAmount}>
              {showAmount ? `${formatCurrency(unallocated)} đ` : "•••••• đ"}
            </Text>
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

          <View style={styles.cardStats}>
            <View style={styles.cardStat}>
              <View style={styles.cardStatLabelContainer}>
                <Text style={styles.cardStatLabel}>TỔNG QUỸ</Text>
                <TouchableOpacity
                  onPress={handleShowTotalFundInfo}
                  style={styles.helpIconTouch}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <HelpCircle color="#94a3b8" size={12} />
                </TouchableOpacity>
              </View>
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
              💡 Giao dịch từ các danh mục này sẽ được trừ trực tiếp vào số dư
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
              </TouchableOp
              
              acity>
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

                {allocAmount > 0 && (
                  <TouchableOpacity
                    style={styles.actionCancelBtn}
                    onPress={() => setAllocAmount(0)}
                    activeOpacity={0.8}
                  >
                    <RotateCcw color="gray" size={24} />
                  </TouchableOpacity>
                )}

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

              {/* <TouchableOpacity
                style={styles.actionCancelBtn}
                onPress={() => setAllocAmount(0)}
              >
                <RotateCcw color="#ef4444" size={22} />
              </TouchableOpacity> */}
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
                Xác nhận xóa
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

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                {
                  backgroundColor: "#ef4444",
                  marginTop: 16,
                },
              ]}
              onPress={handleFinalDelete}
            >
              <Text style={styles.confirmBtnText}>Xác nhận</Text>
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

      {/* Modal: Đổi tên danh mục */}
      <Modal
        visible={isRenameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.inputModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đổi tên danh mục chi tiêu</Text>
              <TouchableOpacity onPress={() => setRenameModalVisible(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 12 }}>
              Nhập tên mới cho danh mục "{renameTarget?.name}":
            </Text>

            <TextInput
              style={styles.textInput}
              placeholder="Nhập tên mới..."
              value={renameInputText}
              onChangeText={setRenameInputText}
              onSubmitEditing={handleRenameConfirm}
              autoFocus={true}
            />

            <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  { flex: 1, backgroundColor: "#64748b", marginTop: 0 },
                ]}
                onPress={() => setRenameModalVisible(false)}
              >
                <Text style={styles.confirmBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { flex: 1, marginTop: 0 }]}
                onPress={handleRenameConfirm}
              >
                <Text style={styles.confirmBtnText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default BudgetScreen;
