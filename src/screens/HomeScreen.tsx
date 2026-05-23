import React, { useEffect, useRef, useState } from "react";
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
  FlatList,
  Image,
  PanResponder,
  Animated,
  Dimensions,
} from "react-native";
import { Alert } from "../components/CustomAlert";
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
  Bell,
  Copy,
  Flame,
  RotateCcw,
  HelpCircle,
} from "lucide-react-native";
import { storage } from "../store/storage";
import { Transaction, UserProfile, CategoryBudget } from "../types";
import { formatCurrency } from "../utils/format";
import { initGoogleDrive, checkAndRunAutoBackup } from "../utils/googleDrive";
import Keypad from "../components/Keypad";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { Sparkles } from "lucide-react-native/icons";
import {
  calculateNewStreak,
  StreakStatus,
  getStreakLevel,
  getStreakLevelImage,
  getStreakLevelInfo,
} from "../utils/streak";
import { getMascotImage, MASCOT_LIST } from "../utils/mascot";

const HIDE_BALANCE_KEY = "@hideBalance";

const DEFAULT_INCOME_CATEGORIES = ["Lương", "Thưởng", "Bán hàng"];

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

export const INCOME_ICONS: Record<string, any> = {
  bag: require("../../assets/income_icon/bag.png"),
  bank: require("../../assets/income_icon/bank.png"),
  chess: require("../../assets/income_icon/chess.png"),
  coding: require("../../assets/income_icon/coding.png"),
  deal: require("../../assets/income_icon/deal.png"),
  default: require("../../assets/income_icon/default.png"),
  developer: require("../../assets/income_icon/developer.png"),
  driver: require("../../assets/income_icon/driver.png"),
  game: require("../../assets/income_icon/game.png"),
  "gas-pump": require("../../assets/income_icon/gas-pump.png"),
  gem: require("../../assets/income_icon/gem.png"),
  "gift-box": require("../../assets/income_icon/gift-box.png"),
  "gold-price": require("../../assets/income_icon/gold-price.png"),
  lease: require("../../assets/income_icon/lease.png"),
  "live-streaming": require("../../assets/income_icon/live-streaming.png"),
  lucky_money: require("../../assets/income_icon/lucky_money.png"),
  other: require("../../assets/income_icon/other.png"),
  profits: require("../../assets/income_icon/profits.png"),
  salary: require("../../assets/income_icon/salary.png"),
  salary_1: require("../../assets/income_icon/salary_1.png"),
  sell: require("../../assets/income_icon/sell.png"),
  selling: require("../../assets/income_icon/selling.png"),
  "social-media": require("../../assets/income_icon/social-media.png"),
  stock: require("../../assets/income_icon/stock.png"),
  support_4g: require("../../assets/income_icon/support_4g.png"),
  support_opening_dealer: require("../../assets/income_icon/support_opening_dealer.png"),
  surprise: require("../../assets/income_icon/surprise.png"),
  teacher: require("../../assets/income_icon/teacher.png"),
};

export const getIncomeIconSource = (
  catName: string,
  profile: UserProfile | null,
) => {
  const key = profile?.incomeCategoryIcons?.[catName];
  if (key && INCOME_ICONS[key]) {
    return INCOME_ICONS[key];
  }
  if (catName === "Lương") return INCOME_ICONS["salary"];
  if (catName === "Thưởng") return INCOME_ICONS["gift-box"];
  if (catName === "Bán hàng") return INCOME_ICONS["sell"];
  return INCOME_ICONS["default"];
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 6) return "Xin chào sáng sớm,";
  if (hour >= 6 && hour < 11) return "Xin chào buổi sáng,";
  if (hour >= 11 && hour < 14) return "Xin chào buổi trưa,";
  if (hour >= 14 && hour < 18) return "Xin chào buổi chiều,";
  if (hour >= 18 && hour < 22) return "Xin chào buổi tối,";
  return "Xin chào đêm khuya,";
};

const HomeScreen = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const scrollRef = useRef<ScrollView>(null);

  const handleShowTotalAssetInfo = () => {
    Alert.normal(
      "TỔNG TÀI SẢN",
      "Đây là tổng số tiền bạn hiện có\n\nBao gồm tiền trong tất cả các Quỹ và số dư chưa phân bổ",
      [
        {
          text: "Hướng dẫn",
          onPress: () => {
            navigation.navigate("Guide" as never);
          },
        },
        {
          text: "Đóng",
          style: "cancel",
        },
      ]
    );
  };

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
  const pan = useRef(new Animated.ValueXY()).current;
  const lastPosition = useRef({ x: 0, y: 0 });

  const MASCOT_MIN_X = 10;
  const MASCOT_MAX_X = SCREEN_WIDTH - 95 - 10;
  const MASCOT_MIN_Y = 180;
  const MASCOT_MAX_Y = SCREEN_HEIGHT - 95 - 100;

  useEffect(() => {
    // Xuất hiện ngẫu nhiên trên màn hình trong giới hạn cho phép
    const safeMaxX = MASCOT_MAX_X > MASCOT_MIN_X ? MASCOT_MAX_X : MASCOT_MIN_X;
    const safeMaxY = MASCOT_MAX_Y > MASCOT_MIN_Y ? MASCOT_MAX_Y : MASCOT_MIN_Y;
    const randomX = Math.random() * (safeMaxX - MASCOT_MIN_X) + MASCOT_MIN_X;
    const randomY = Math.random() * (safeMaxY - MASCOT_MIN_Y) + MASCOT_MIN_Y;
    pan.setValue({ x: randomX, y: randomY });
    lastPosition.current = { x: randomX, y: randomY };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: lastPosition.current.x,
          y: lastPosition.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (evt, gestureState) => {
        const newX = lastPosition.current.x + gestureState.dx;
        const newY = lastPosition.current.y + gestureState.dy;

        const safeMaxX = MASCOT_MAX_X > MASCOT_MIN_X ? MASCOT_MAX_X : MASCOT_MIN_X;
        const safeMaxY = MASCOT_MAX_Y > MASCOT_MIN_Y ? MASCOT_MAX_Y : MASCOT_MIN_Y;

        const clampedX = Math.min(Math.max(newX, MASCOT_MIN_X), safeMaxX);
        const clampedY = Math.min(Math.max(newY, MASCOT_MIN_Y), safeMaxY);

        pan.setValue({
          x: clampedX - lastPosition.current.x,
          y: clampedY - lastPosition.current.y,
        });
      },
      onPanResponderRelease: (evt, gestureState) => {
        const newX = lastPosition.current.x + gestureState.dx;
        const newY = lastPosition.current.y + gestureState.dy;

        const safeMaxX = MASCOT_MAX_X > MASCOT_MIN_X ? MASCOT_MAX_X : MASCOT_MIN_X;
        const safeMaxY = MASCOT_MAX_Y > MASCOT_MIN_Y ? MASCOT_MAX_Y : MASCOT_MIN_Y;

        const clampedX = Math.min(Math.max(newX, MASCOT_MIN_X), safeMaxX);
        const clampedY = Math.min(Math.max(newY, MASCOT_MIN_Y), safeMaxY);

        lastPosition.current = { x: clampedX, y: clampedY };
        pan.flattenOffset();
        pan.setValue({ x: clampedX, y: clampedY });
      },
    })
  ).current;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [showBudgets, setShowBudgets] = useState(false);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [streakModalVisible, setStreakModalVisible] = useState(false);
  const [streakModalData, setStreakModalData] = useState<{
    count: number;
    status: StreakStatus;
  } | null>(null);

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
  const [isMascotPreviewVisible, setMascotPreviewVisible] = useState(false);
  const manualInputRef = useRef<TextInput>(null);

  useEffect(() => {
    initGoogleDrive();
    checkAndRunAutoBackup();

    const intervalId = setInterval(() => {
      checkAndRunAutoBackup();
    }, 5 * 60 * 1000); // 5 phút một lần

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadData();
      checkAndRunAutoBackup();
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

      // Calculate savings balance (Quỹ Tiết Kiệm)
      let calcSaving = 0;
      const txs = await storage.getTransactions();
      txs.forEach((t) => {
        if (t.category === "Tiết kiệm" || t.category === "Rút tiết kiệm") {
          if (t.type === "expense" && t.category === "Tiết kiệm") {
            calcSaving += t.amount;
          } else if (t.type === "income" && t.category === "Rút tiết kiệm") {
            calcSaving -= t.amount;
          }
        }
      });

      // Calculate custom funds total (Quỹ Khác)
      let customFundsTotal = 0;
      if (p.customFunds) {
        customFundsTotal = p.customFunds.reduce((sum, f) => sum + f.balance, 0);
      }

      setTotalBalance(totalAllocated + unallocated + calcSaving + customFundsTotal);
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
      let minTs = txs[0].timestamp;
      for (let i = 1; i < txs.length; i++) {
        if (txs[i].timestamp < minTs) {
          minTs = txs[i].timestamp;
        }
      }
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
    await performSave(
      selectedCategoryForSave,
      modalNoteInput,
      txDate,
      customLabel,
    );
  };

  const performSave = async (
    chosenCategory: string,
    note: string,
    transactionDate: Date,
    customLabel?: string,
  ) => {
    const amountToSave = amount;
    const finalNote = note.trim() || undefined;

    let nextProfile = profile ? { ...profile } : null;
    if (!nextProfile) return;

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
          nextProfile.initialBalance =
            nextProfile.initialBalance - amountToSave;
        } else {
          // Loại "direct": chi từ tiền chưa phân bổ
          const totalAllocated = budgets.reduce((sum, b) => sum + b.budget, 0);
          const unallocated = Math.max(
            0,
            nextProfile.initialBalance - totalAllocated,
          );
          if (amountToSave > unallocated) {
            Alert.alert(
              "Tiền chưa phân bổ không đủ",
              `Danh mục này chi từ tiền chưa phân bổ. Bạn chỉ còn ${formatCurrency(unallocated)} đ.`,
            );
            return;
          }
          const updatedBudgets = budgets.map((b) =>
            b.name === chosenCategory
              ? { ...b, spent: (b.spent || 0) + amountToSave }
              : b,
          );
          await storage.saveCategoryBudgets(updatedBudgets);
          nextProfile.initialBalance =
            nextProfile.initialBalance - amountToSave;
        }
      } else {
        // Danh mục không có trong budgets (bao gồm "Khác") - chi từ tiền chưa phân bổ
        const totalAllocated = budgets.reduce((sum, b) => sum + b.budget, 0);
        const unallocated = Math.max(
          0,
          nextProfile.initialBalance - totalAllocated,
        );
        if (amountToSave > unallocated) {
          Alert.alert(
            "Tiền chưa phân bổ không đủ",
            `Bạn chỉ còn ${formatCurrency(unallocated)} đ chưa phân bổ.`,
          );
          return;
        }
        nextProfile.initialBalance = nextProfile.initialBalance - amountToSave;
      }
    } else {
      nextProfile.initialBalance = nextProfile.initialBalance + amountToSave;
    }

    // Tính toán giữ chuỗi
    const streakResult = calculateNewStreak(
      nextProfile.lastStreakTimestamp,
      nextProfile.streakCount || 0,
      transactionDate.getTime(),
      nextProfile.streakRecoveriesCount,
      nextProfile.lastRecoveryMonthYear,
    );

    nextProfile.streakRecoveriesCount = streakResult.newRecoveriesCount;
    nextProfile.lastRecoveryMonthYear = streakResult.newRecoveryMonthYear;

    if (streakResult.status !== "none") {
      nextProfile.streakCount = streakResult.newStreakCount;
      nextProfile.lastStreakTimestamp = transactionDate.getTime();
      setStreakModalData({
        count: streakResult.newStreakCount,
        status: streakResult.status,
      });
      setStreakModalVisible(true);
    }

    // Lưu Profile & Giao dịch
    await storage.saveUserProfile(nextProfile);

    const newTx: Transaction = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type: type,
      amount: amountToSave,
      category: customLabel ? "Khác" : chosenCategory,
      categorySnapshot: customLabel ?? chosenCategory,
      note: finalNote,
      timestamp: transactionDate.getTime(),
    };
    await storage.saveTransaction(newTx);

    if (type === "expense") {
      Alert.alert("Thành công", "Đã lưu khoản chi.");
    } else {
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
        {/* Top bar with User Profile and quick settings/bell */}
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
              <Text style={styles.greetingLabel}>{getGreeting()}</Text>
              <Text style={styles.profileName} numberOfLines={1}>
                {profile?.name || "Người dùng"}
              </Text>
            </View>
          </View>

          {profile?.streakCount ? (
            <TouchableOpacity
              onPress={() => {
                const currentStreak = profile.streakCount || 0;
                const level = getStreakLevel(currentStreak);
                const levelInfo = getStreakLevelInfo(level);
                Alert.alert(
                  "Chuỗi giữ lửa 🔥",
                  `Bạn đang duy trì chuỗi ${currentStreak} ngày giữ lửa!\nCấp độ: ${levelInfo.name}\n${levelInfo.description}\nHãy tiếp tục ghi chép giao dịch mỗi ngày để thăng cấp nhé.`,
                );
              }}
              style={styles.streakHeaderChip}
              activeOpacity={0.8}
            >
              <Image
                source={require("../../assets/series/icon-series.gif")}
                style={{ width: 36, height: 36, resizeMode: "contain" }}
              />
              <Text style={styles.streakHeaderTxt}>{profile.streakCount}</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate("Guide" as never)}
              style={styles.actionBtn}
              activeOpacity={0.7}
            >
              <Sparkles color="#ffffff" size={20} />
              <View style={styles.actionBadge} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("Settings" as never);
              }}
              style={styles.actionBtn}
              activeOpacity={0.7}
            >
              <Settings color="#ffffff" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bank Card / Account card */}
        <View style={styles.bankCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardBrandWrapper}>
              <Coins color="#f59e0b" size={18} />
              <Text style={styles.cardBrandText}>HEO ĐẤT BÉO DIGITAL</Text>
            </View>
            <View style={styles.cardChip} />
          </View>

          <View style={styles.cardMiddle}>
            <Text style={styles.cardAccountLabel}>TÀI KHOẢN NGUỒN</Text>
            <View style={styles.accountNumberContainer}>
              <Text style={styles.cardAccountNumber}>
                {accountNumber
                  ? accountNumber.replace(/(.{4})/g, "$1 ").trim()
                  : "•••• •••• •••• ••••"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    "Sao chép",
                    "Đã sao chép số tài khoản: " + accountNumber,
                  );
                }}
                style={styles.copyBtn}
              >
                <Copy color="rgba(255,255,255,0.6)" size={14} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.cardBottom}>
            <View>
              <View style={styles.cardBalanceLabelContainer}>
                <Text style={styles.cardBalanceLabel}>TỔNG TÀI SẢN</Text>
                <TouchableOpacity
                  onPress={handleShowTotalAssetInfo}
                  style={styles.helpIconTouch}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <HelpCircle color="#94a3b8" size={12} />
                </TouchableOpacity>
              </View>
              <Text style={styles.cardBalanceAmount}>
                {showBudgets ? `${formatCurrency(totalBalance)} đ` : "•••••• đ"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={toggleShowBudgets}
              style={styles.cardEyeBtn}
              activeOpacity={0.7}
            >
              {showBudgets ? (
                <Eye color="#ffffff" size={20} />
              ) : (
                <EyeOff color="#ffffff" size={20} />
              )}
            </TouchableOpacity>
          </View>
        </View>
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
                hideClearButton={true}
              />
            </View>
          )}

          {profile?.inputMethod !== "manual" && (
            <View style={styles.actionButtonRow}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  styles.actionNextBtn,
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
                  handleSave();
                }}
                activeOpacity={canProceed ? 0.8 : 0.6}
              >
                <Text style={styles.saveButtonText}>Tiếp Theo →</Text>
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
                  const iconSource =
                    type === "expense"
                      ? catBudget && catBudget.icon
                        ? EXPENSE_ICONS[catBudget.icon]
                        : EXPENSE_ICONS["default"]
                      : getIncomeIconSource(item, profile);
                  return (
                    <TouchableOpacity
                      style={styles.catPickerItem}
                      onPress={() => handlePickCategory(item)}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                          flex: 1,
                        }}
                      >
                        <Image
                          source={iconSource}
                          style={{
                            width: 24,
                            height: 24,
                            resizeMode: "contain",
                          }}
                        />
                        <Text
                          style={styles.catPickerItemName}
                          numberOfLines={1}
                        >
                          {item}
                        </Text>
                      </View>
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
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                            flex: 1,
                          }}
                        >
                          <Image
                            source={
                              type === "expense"
                                ? EXPENSE_ICONS["other"]
                                : INCOME_ICONS["other"]
                            }
                            style={{
                              width: 24,
                              height: 24,
                              resizeMode: "contain",
                            }}
                          />
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
                <Text style={styles.datePickerBtnText}>
                  {formatTxDate(txDate)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => openDatePicker("time")}
              >
                <Text style={styles.datePickerBtnText}>
                  {formatTxTime(txDate)}
                </Text>
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

      {/* Modal giữ chuỗi (Streak) */}
      <Modal
        visible={streakModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStreakModalVisible(false)}
      >
        <View style={styles.streakModalOverlay}>
          <View style={styles.streakModalContent}>
            {/* Status Title */}
            <Text style={styles.streakModalStatus}>
              {streakModalData?.status === "increased"
                ? "🔥 ĐÃ TĂNG CHUỖI GIỮ LỬA!"
                : streakModalData?.status === "preserved"
                  ? "✨ CHUỖI LỬA ĐÃ ĐƯỢC DUY TRÌ!"
                  : "🆕 BẮT ĐẦU CHUỖI LỬA MỚI!"}
            </Text>

            {/* Streak count display */}
            <Text style={styles.streakModalCount}>
              {streakModalData?.count || 1} ngày
            </Text>

            {/* Level Flame Image */}
            {streakModalData && (
              <Image
                source={getStreakLevelImage(
                  getStreakLevel(streakModalData.count),
                )}
                style={styles.streakModalImg}
              />
            )}

            {/* Level label */}
            <View style={styles.streakModalLevelBadge}>
              <Text style={styles.streakModalLevelTxt}>
                Cấp độ: {getStreakLevelInfo(getStreakLevel(streakModalData?.count || 1)).name}
              </Text>
            </View>
            <Text style={{ fontSize: 10, color: "#94a3b8", textAlign: 'center', marginTop: -4, marginBottom: 12 }}>
              {getStreakLevelInfo(getStreakLevel(streakModalData?.count || 1)).description}
            </Text>

            <Text style={styles.streakModalHint}>
              {streakModalData?.status === "increased"
                ? "Ghi chép giao dịch liên tục giúp nuôi dưỡng Heo béo tốt!"
                : streakModalData?.status === "preserved"
                  ? "Thật may mắn, chuỗi lửa đã được khôi phục kịp thời!"
                  : "Hãy duy trì ghi chép mỗi ngày từ hôm nay nhé!"}
            </Text>

            {/* Close CTA */}
            <TouchableOpacity
              style={styles.streakModalBtn}
              onPress={() => setStreakModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.streakModalBtnText}>Tuyệt vời</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

      {/* Modal xem trước linh vật */}
      {profile && (
        <Modal
          visible={isMascotPreviewVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setMascotPreviewVisible(false)}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.55)",
              alignItems: "center",
              justifyContent: "center",
            }}
            activeOpacity={1}
            onPress={() => setMascotPreviewVisible(false)}
          >
            <Image
              source={getMascotImage(profile.mascot)}
              style={{ width: 360, height: 360, resizeMode: "contain" }}
            />
            <View
              style={{
                marginTop: 20,
                backgroundColor: "rgba(255,255,255,0.15)",
                borderRadius: 20,
                paddingHorizontal: 24,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.3)",
              }}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 22,
                  fontWeight: "bold",
                  textAlign: "center",
                  letterSpacing: 1,
                  textShadowColor: "rgba(0,0,0,0.4)",
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 4,
                }}
              >
                {MASCOT_LIST.find(m => m.key === profile.mascot)?.name ?? MASCOT_LIST[0].name}
              </Text>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {profile && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            pan.getLayout(),
            {
              position: "absolute",
              width: 95,
              height: 95,
              zIndex: 9999,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          {/* Ảnh mascot ở phía dưới không lấy nền */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setMascotPreviewVisible(true)}
          >
            <Image
              source={getMascotImage(profile.mascot)}
              style={{ width: 95, height: 95, resizeMode: "contain" }}
            />
          </TouchableOpacity>
          {/* Cấp độ chuỗi phía trên có nền trắng */}
          <View
            style={{
              position: "absolute",
              top: -45,
              left: 27.5,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#ffffff",
              borderWidth: 1.5,
              borderColor: "#cbd5e1",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 3,
              elevation: 3,
            }}
          >
            <Image
              source={getStreakLevelImage(getStreakLevel(profile.streakCount || 0))}
              style={{ width: 26, height: 26, resizeMode: "contain" }}
            />
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    // backgroundColor: "#0c2340", // Deep navy blue (Vietcombank/premium style)
    backgroundColor: "#5596e0ff", // Deep navy blue (Vietcombank/premium style)

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
    flex: 1,
    marginRight: 10,
  },
  avatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
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
    borderColor: "#0c2340",
  },
  profileTextWrapper: {
    marginLeft: 10,
    flex: 1,
  },
  greetingLabel: {
    color: "#cccccc",
    fontSize: 12,
  },
  profileName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  actionBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ef4444",
  },
  bankCard: {
    backgroundColor: "#1e293b", // Slate-800
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
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
    marginBottom: 16,
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
  cardMiddle: {
    marginBottom: 18,
  },
  cardAccountLabel: {
    color: "#94a3b8",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  accountNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  cardAccountNumber: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  copyBtn: {
    padding: 4,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardBalanceLabel: {
    color: "#94a3b8",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  cardBalanceLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardBalanceAmount: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 2,
  },
  helpIconTouch: {
    padding: 2,
    marginLeft: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  cardEyeBtn: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
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
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    paddingVertical: 16,
    marginBottom: 16,
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
  actionButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 10,
    marginBottom: 40,
  },
  actionNextBtn: {
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
  },
  saveButton: {
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  saveExpense: { backgroundColor: "#ef4444" },
  saveIncome: { backgroundColor: "#10b981" },
  saveDisabled: { backgroundColor: "#cbd5e1", elevation: 0, shadowOpacity: 0 },
  saveButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "bold" },
  cancelButton: {
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  cancelButtonText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "bold",
  },
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
  streakHeaderChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    marginRight: 12
  },
  streakHeaderTxt: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
  },
  streakModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  streakModalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    width: "85%",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1.5,
    borderColor: "#ffedd5",
  },
  streakModalStatus: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ea580c",
    letterSpacing: 1.2,
    marginBottom: 8,
    textAlign: "center",
  },
  streakModalCount: {
    fontSize: 36,
    fontWeight: "900",
    color: "#0c2340",
    marginBottom: 12,
  },
  streakModalImg: {
    width: 140,
    height: 140,
    resizeMode: "contain",
    marginVertical: 12,
  },
  streakModalLevelBadge: {
    backgroundColor: "#fff7ed",
    borderWidth: 1.5,
    borderColor: "#ffedd5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 12,
  },
  streakModalLevelTxt: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ea580c",
  },
  streakModalRecoveryInfo: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    marginBottom: 10,
  },
  streakModalHint: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  streakModalBtn: {
    backgroundColor: "#0c2340",
    borderRadius: 16,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    shadowColor: "#0c2340",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  streakModalBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default HomeScreen;
