import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Switch,
  ActivityIndicator,
} from "react-native";
import { Alert } from "../components/CustomAlert";
import { writeAsStringAsync, readAsStringAsync } from "expo-file-system/legacy";
import { Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { storage } from "../store/storage";
import {
  initGoogleDrive,
  signInGoogle,
  signOutGoogle,
  uploadBackupToGoogleDrive,
  getAccessToken,
  restoreLatestBackupFromGoogleDrive,
} from "../utils/googleDrive";
import {
  CommonActions,
  useNavigation,
  useIsFocused,
} from "@react-navigation/native";
import {
  Download,
  Upload,
  Trash2,
  List,
  Plus,
  X,
  BookOpen,
  Settings as SettingsIcon,
  User,
  Camera,
  Calendar,
  Briefcase,
  GraduationCap,
  Heart,
  Link,
  Cloud,
  Database,
} from "lucide-react-native";
import { UserProfile, CategoryBudget, Transaction } from "../types";
import { scheduleTestNotification } from "../utils/notifications";

const DEFAULT_INCOME_CATEGORIES = ["Lương", "Thưởng", "Bán hàng"];

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

const VERSION_HISTORY = [
  { version: "21.05.2026", description: "Sửa giao diện profile, mã hóa dữ liệu, thêm linh vật" },
  { version: "20.05.2026", description: "Thêm linh vật giữ chuỗi, backup dữ liệu tự động, thông báo thu chi theo ngày, tháng, năm" },
  { version: "14.05.2026", description: "Thêm icon sinh động cho danh mục, Quỹ" },
  { version: "10.05.2026", description: "Thêm Quỹ lưu trữ" },
  { version: "01.05.2026", description: "Sửa lỗi logic xóa giao dịch" },
  { version: "21.04.2026", description: "Sửa, xóa giao dịch trong vòng 3 ngày" },
  { version: "15.04.2026", description: "Chia 2 loại danh mục (Cần nạp tiền và chi trực tiếp)" },
  { version: "15.03.2026", description: "Ra mắt ứng dụng lúc 23:36" },
];

const SettingsScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Category Modal State (income only)
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Modal Chọn Icon Thu nhập
  const [isIconModalVisible, setIconModalVisible] = useState(false);
  const [pendingCategoryName, setPendingCategoryName] = useState("");

  // Settings Modal State
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);

  // Google Drive Backup States
  const [isDriveModalVisible, setDriveModalVisible] = useState(false);
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null);
  const [isAutoBackupEnabled, setIsAutoBackupEnabled] = useState(false);
  const [lastBackupTimestamp, setLastBackupTimestamp] = useState<number>(0);
  const [lastBackupStatus, setLastBackupStatus] = useState<string>('none');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isHistoryModalVisible, setHistoryModalVisible] = useState(false);
  const [isOfflineModalVisible, setOfflineModalVisible] = useState(false);

  useEffect(() => {
    initGoogleDrive();
    checkGoogleSignInStatus();
    loadBackupSettings();
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadProfile();
      checkGoogleSignInStatus();
      loadBackupSettings();
    }
  }, [isFocused]);

  const checkGoogleSignInStatus = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        setIsGoogleSignedIn(true);
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        const currentUser = await GoogleSignin.getCurrentUser();
        if (currentUser && currentUser.user) {
          setGoogleUserEmail(currentUser.user.email);
        }
      } else {
        setIsGoogleSignedIn(false);
        setGoogleUserEmail(null);
      }
    } catch (e) {
      setIsGoogleSignedIn(false);
      setGoogleUserEmail(null);
    }
  };

  const loadBackupSettings = async () => {
    const autoEnabled = await storage.isGoogleDriveAutoBackupEnabled();
    const lastTimestamp = await storage.getGoogleDriveLastBackupTimestamp();
    const lastStatus = await storage.getGoogleDriveLastBackupStatus();
    setIsAutoBackupEnabled(autoEnabled);
    setLastBackupTimestamp(lastTimestamp);
    setLastBackupStatus(lastStatus);
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await signInGoogle();
      if (res.success && res.userInfo) {
        const userInfoAny = res.userInfo as any;
        setIsGoogleSignedIn(true);
        setGoogleUserEmail(userInfoAny.user.email);
        Alert.alert("Thành công", `Đã liên kết tài khoản Google: ${userInfoAny.user.email}`);
        await loadBackupSettings();
      } else {
        Alert.alert("Lỗi đăng nhập", res.error || "Không thể đăng nhập Google.");
      }
    } catch (e: any) {
      Alert.alert("Lỗi", e.message || String(e));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc muốn đăng xuất và hủy liên kết Google Drive?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            const res = await signOutGoogle();
            if (res.success) {
              setIsGoogleSignedIn(false);
              setGoogleUserEmail(null);
              setIsAutoBackupEnabled(false);
              await storage.setGoogleDriveAutoBackupEnabled(false);
              Alert.alert("Đăng xuất thành công", "Đã hủy liên kết Google Drive.");
            }
          }
        }
      ]
    );
  };

  const handleToggleAutoBackup = async (value: boolean) => {
    if (!isGoogleSignedIn) {
      Alert.alert("Yêu cầu đăng nhập", "Bạn cần liên kết tài khoản Google trước.");
      return;
    }
    const success = await storage.setGoogleDriveAutoBackupEnabled(value);
    if (success) {
      setIsAutoBackupEnabled(value);
    }
  };

  const handleManualBackup = async () => {
    if (!isGoogleSignedIn) {
      Alert.alert("Yêu cầu đăng nhập", "Bạn cần liên kết tài khoản Google trước.");
      return;
    }
    setIsBackingUp(true);
    try {
      const dataStr = await storage.exportData();
      const res = await uploadBackupToGoogleDrive(dataStr);
      const now = Date.now();
      await storage.setGoogleDriveLastBackupTimestamp(now);
      await storage.setGoogleDriveLastBackupStatus(res.success ? 'success' : 'failed');
      
      setLastBackupTimestamp(now);
      setLastBackupStatus(res.success ? 'success' : 'failed');

      if (res.success) {
        Alert.alert("Thành công", "Đã sao lưu dữ liệu lên Google Drive.");
      } else {
        Alert.alert("Lỗi sao lưu", res.message);
      }
    } catch (e: any) {
      Alert.alert("Lỗi", e.message || String(e));
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreFromGoogleDrive = async () => {
    if (!isGoogleSignedIn) {
      Alert.alert("Yêu cầu đăng nhập", "Bạn cần liên kết tài khoản Google trước.");
      return;
    }

    Alert.alert(
      "Khôi phục dữ liệu",
      "Bạn có chắc chắn muốn khôi phục dữ liệu từ bản sao lưu gần nhất trên Google Drive? Dữ liệu hiện tại trên thiết bị sẽ bị ghi đè và thay thế hoàn toàn.",
      [
        { text: "Hủy bỏ", style: "cancel" },
        {
          text: "Khôi phục",
          style: "destructive",
          onPress: async () => {
            setIsRestoring(true);
            try {
              const res = await restoreLatestBackupFromGoogleDrive();
              if (res.success && res.content) {
                const success = await storage.importData(res.content);
                if (success) {
                  Alert.alert(
                    "Thành công",
                    "Dữ liệu đã được phục hồi từ Google Drive. Vui lòng mở lại ứng dụng hoặc chuyển tab để làm mới."
                  );
                  loadProfile();
                } else {
                  Alert.alert(
                    "Lỗi phục hồi",
                    "Dữ liệu không hợp lệ hoặc đã xảy ra lỗi trong quá trình phục hồi."
                  );
                }
              } else {
                Alert.alert("Lỗi khôi phục", res.message);
              }
            } catch (e: any) {
              Alert.alert("Lỗi", e.message || String(e));
            } finally {
              setIsRestoring(false);
            }
          }
        }
      ]
    );
  };

  const formatLastBackupTime = (ts: number) => {
    if (!ts || ts === 0) return "Chưa từng sao lưu";
    const date = new Date(ts);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} lúc ${hh}:${min}:${ss}`;
  };

  const loadProfile = async () => {
    const p = await storage.getUserProfile();
    setProfile(p);
  };

  const handleExport = async () => {
    try {
      const dataStr = await storage.exportData();
      const baseDir = Paths.document?.uri || Paths.cache?.uri;
      if (!baseDir) {
        Alert.alert("Lỗi", "Không thể truy cập hệ thống file.");
        return;
      }
      const fileUri =
        baseDir + (baseDir.endsWith("/") ? "" : "/") + "heodatbeo_backup.txt";
      await writeAsStringAsync(fileUri, dataStr, { encoding: "utf8" });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/plain",
          dialogTitle: "Lưu hoặc chia sẻ dữ liệu sao lưu",
        });
      } else {
        Alert.alert(
          "Lỗi",
          "Tính năng chia sẻ không khả dụng trên thiết bị này.",
        );
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Lỗi", "Không thể xuất dữ liệu.");
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "text/plain",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileContent = await readAsStringAsync(result.assets[0].uri, {
          encoding: "utf8",
        });

        const success = await storage.importData(fileContent);
        if (success) {
          Alert.alert(
            "Thành công",
            "Dữ liệu đã được phục hồi. Vui lòng mở lại ứng dụng hoặc chuyển tab để làm mới.",
          );
          loadProfile();
        } else {
          Alert.alert(
            "Lỗi",
            "Dữ liệu không hợp lệ hoặc đã xảy ra lỗi trong quá trình phục hồi.",
          );
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Lỗi", "Không thể nhập dữ liệu.");
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Cảnh báo nguy hiểm",
      "Bạn có chắc chắn muốn xóa toàn bộ dữ liệu? (Bao gồm số dư và lịch sử thu chi. Việc này không thể hoàn tác).",
      [
        { text: "Hủy bỏ", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            const success = await storage.clearUserResetData();
            if (success) {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: "Setup" }],
                }),
              );
            } else {
              Alert.alert("Lỗi", "Không thể xóa dữ liệu.");
            }
          },
        },
      ],
    );
  };

  const handleAddCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName || !profile) return;

    if (
      trimmedName === "Tiết kiệm" ||
      trimmedName === "Rút tiết kiệm" ||
      trimmedName === "Số dư đầu tiên"
    ) {
      Alert.alert(
        "Lỗi",
        `Tên danh mục "${trimmedName}" đã được hệ thống sử dụng. Vui lòng chọn tên khác.`,
      );
      return;
    }

    const current = profile.incomeCategories || DEFAULT_INCOME_CATEGORIES;
    if (current.includes(trimmedName)) {
      Alert.alert("Lỗi", "Danh mục này đã tồn tại.");
      return;
    }

    // Mở modal chọn icon thu nhập
    setPendingCategoryName(trimmedName);
    setCategoryModalVisible(false);
    setIconModalVisible(true);
  };

  const handleSelectIncomeIcon = async (iconKey: string) => {
    if (!pendingCategoryName || !profile) return;
    const trimmedName = pendingCategoryName;

    const current = profile.incomeCategories || DEFAULT_INCOME_CATEGORIES;
    const currentIcons = profile.incomeCategoryIcons || {};

    const isExisting = current.includes(trimmedName);

    let updatedProfile;
    if (isExisting) {
      updatedProfile = {
        ...profile,
        incomeCategoryIcons: {
          ...currentIcons,
          [trimmedName]: iconKey,
        },
      };
    } else {
      const txs = await storage.getTransactions();
      const matches = txs.filter(
        (t) => t.categorySnapshot === trimmedName && t.category === "Khác",
      );

      updatedProfile = {
        ...profile,
        incomeCategories: [...current, trimmedName],
        incomeCategoryIcons: {
          ...currentIcons,
          [trimmedName]: iconKey,
        },
      };

      if (matches.length > 0) {
        const updatedTxs = txs.map((t) => {
          if (t.categorySnapshot === trimmedName && t.category === "Khác") {
            return { ...t, category: trimmedName };
          }
          return t;
        });
        await storage.updateTransactionsBulk(updatedTxs);
        Alert.alert(
          "Thành công",
          `Đã thêm danh mục "${trimmedName}" và tự động đồng bộ ${matches.length} giao dịch cũ liên quan.`,
        );
      }
    }

    const success = await storage.saveUserProfile(updatedProfile);
    if (success) {
      setProfile(updatedProfile);
      setNewCategoryName("");
      setPendingCategoryName("");
      setIconModalVisible(false);
      // Mở lại modal quản lý danh mục sau khi hoàn thành
      setCategoryModalVisible(true);
    }
  };

  const handleCancelIncomeIcon = () => {
    if (!pendingCategoryName || !profile) {
      setIconModalVisible(false);
      setCategoryModalVisible(true);
      return;
    }
    const current = profile.incomeCategories || DEFAULT_INCOME_CATEGORIES;
    const isExisting = current.includes(pendingCategoryName);

    if (isExisting) {
      setPendingCategoryName("");
      setIconModalVisible(false);
      setCategoryModalVisible(true);
    } else {
      handleSelectIncomeIcon("default");
    }
  };

  const handleDeleteCategory = async (catName: string) => {
    if (!profile) return;

    if (catName === "Tiết kiệm" || catName === "Rút tiết kiệm") {
      Alert.alert("Cảnh báo", "Không thể xóa danh mục hệ thống này.");
      return;
    }

    // Kiểm tra có giao dịch thuộc danh mục này không
    const txs = await storage.getTransactions();
    const hasTx = txs.some(
      (t) => (t.categorySnapshot || t.category) === catName,
    );
    const extraMsg = hasTx
      ? `\n\n⚠️ Danh mục này có giao dịch lịch sử. Các giao dịch đó sẽ được lưu trong danh mục "Khác" tại trang Thống kê.`
      : "";

    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc muốn xóa danh mục thu "${catName}"?${extraMsg}`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            const current =
              profile.incomeCategories || DEFAULT_INCOME_CATEGORIES;
            const updatedProfile = {
              ...profile,
              incomeCategories: current.filter((c) => c !== catName),
            };
            const success = await storage.saveUserProfile(updatedProfile);
            if (success) {
              setProfile(updatedProfile);

              if (hasTx) {
                const updatedTxs = txs.map((t) => {
                  if ((t.categorySnapshot || t.category) === catName) {
                    return {
                      ...t,
                      category: "Khác",
                      categorySnapshot: catName,
                    };
                  }
                  return t;
                });
                await storage.updateTransactionsBulk(updatedTxs);
              }
            }
          },
        },
      ],
    );
  };
  const handleUpdateInputMethod = async (method: "keypad" | "manual") => {
    if (!profile) return;
    const updatedProfile = { ...profile, inputMethod: method };
    const success = await storage.saveUserProfile(updatedProfile);
    if (success) {
      setProfile(updatedProfile);
    }
  };

  const renderCategoryItem = ({ item }: { item: string }) => {
    const iconSource = getIncomeIconSource(item, profile);
    return (
      <View style={styles.categoryListItem}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity
            style={styles.categoryIconContainer}
            onPress={() => {
              setPendingCategoryName(item);
              setCategoryModalVisible(false);
              setIconModalVisible(true);
            }}
          >
            <Image source={iconSource} style={styles.categoryIcon} />
          </TouchableOpacity>
          <Text style={styles.categoryListName}>{item}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteCategory(item)}>
          <Trash2 color="#cccccc" size={20} />
        </TouchableOpacity>
      </View>
    );
  };

  const getActiveCategories = () => {
    return profile?.incomeCategories || DEFAULT_INCOME_CATEGORIES;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cài đặt & Dữ liệu</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => (navigation as any).navigate("Profile")}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#f3e8ff" }]}>
            <User color="#a855f7" size={18} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => setCategoryModalVisible(true)}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#fef3c7" }]}>
            <List color="#d97706" size={18} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Danh mục thu nhập</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => setSettingsModalVisible(true)}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#e0f2fe" }]}>
            <SettingsIcon color="#0284c7" size={18} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Cài đặt nhập liệu</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => (navigation as any).navigate("Guide")}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#f0fdf4" }]}>
            <BookOpen color="#16a34a" size={18} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Hướng dẫn sử dụng</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => setDriveModalVisible(true)}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#ecfeff" }]}>
            <Cloud color="#0891b2" size={18} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Sao lưu dữ liệu - Trực tuyến</Text>
            {isGoogleSignedIn && (
              <Text style={{ fontSize: 12, color: "#0891b2", marginTop: 2 }}>
                Đã liên kết tài khoản
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => setOfflineModalVisible(true)}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#e0e7ff" }]}>
            <Database color="#4f46e5" size={18} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Sao lưu dữ liệu - Ngoại tuyến</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={handleReset}>
          <View style={[styles.iconContainer, { backgroundColor: "#fee2e2" }]}>
            <Trash2 color="#dc2626" size={18} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Khôi phục cài đặt gốc</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer cố định phía dưới */}
      <View style={styles.footerInfo}>
        <View style={styles.versionRow}>
          <Text style={styles.versionText}>Phiên bản hiện tại : 21.5.2026</Text>
          <Text style={styles.versionSeparator}>|</Text>
          <TouchableOpacity onPress={() => setHistoryModalVisible(true)}>
            <Text style={styles.versionHistoryBtn}>Lịch sử phiên bản ({VERSION_HISTORY.length})</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.authorText}>
          Ứng dụng được phát triển bởi{" "}
          <Text style={styles.authorHighlight}>SatsBoy87</Text>
        </Text>
      </View>

      {/* Modal Lịch sử Phiên bản */}
      <Modal
        visible={isHistoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📜 Lịch sử phiên bản</Text>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>
              <Text style={styles.modalTitleSub}>{VERSION_HISTORY.length} phiên bản</Text>

            <ScrollView contentContainerStyle={{ paddingVertical: 10 }} showsVerticalScrollIndicator={false}>
              <View style={styles.historyList}>
                {VERSION_HISTORY.map((item, idx) => (
                  <View key={idx} style={styles.historyItem}>
                    <View style={styles.historyDotContainer}>
                      <View style={styles.historyDot} />
                      {idx < VERSION_HISTORY.length - 1 && <View style={styles.historyLine} />}
                    </View>
                    <View style={styles.historyContent}>
                      <Text style={styles.historyVersion}>{item.version}</Text>
                      <Text style={styles.historyDesc}>Mô tả: {item.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Cấu hình Sao lưu Google Drive */}
      <Modal
        visible={isDriveModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDriveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sao lưu dữ liệu tự động</Text>
              <TouchableOpacity onPress={() => setDriveModalVisible(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 10 }} showsVerticalScrollIndicator={false}>
              {/* Trạng thái liên kết */}
              <View style={styles.driveStatusCard}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                  <Cloud color={isGoogleSignedIn ? "#0891b2" : "#94a3b8"} size={28} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1e293b" }}>
                      {isGoogleSignedIn ? "Đã liên kết Google Drive" : "Chưa liên kết tài khoản"}
                    </Text>
                    {isGoogleSignedIn && googleUserEmail && (
                      <Text style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                        {googleUserEmail}
                      </Text>
                    )}
                  </View>
                </View>

                {isGoogleSignedIn ? (
                  <TouchableOpacity
                    style={styles.driveLogoutBtn}
                    onPress={handleGoogleLogout}
                  >
                    <Text style={styles.driveLogoutBtnText}>Hủy liên kết tài khoản</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.driveLoginBtn}
                    onPress={handleGoogleLogin}
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.driveLoginBtnText}>Đăng nhập Google</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Tùy chọn Tự động Sao lưu */}
              <View style={[styles.driveOptionRow, !isGoogleSignedIn && { opacity: 0.5 }]}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.driveOptionTitle}>Tự động sao lưu hàng ngày</Text>
                  <Text style={styles.driveOptionDesc}>
                    Tự động đồng bộ và sao lưu dữ liệu lên Google Drive lúc 1:00 sáng mỗi ngày.
                  </Text>
                </View>
                <Switch
                  value={isAutoBackupEnabled}
                  onValueChange={handleToggleAutoBackup}
                  disabled={!isGoogleSignedIn}
                  trackColor={{ false: "#cbd5e1", true: "#99f6e4" }}
                  thumbColor={isAutoBackupEnabled ? "#0891b2" : "#f1f5f9"}
                />
              </View>

              {/* Sao lưu thủ công */}
              <View style={[styles.driveActionBox, !isGoogleSignedIn && { opacity: 0.5 }]}>
                <Text style={styles.driveSectionTitle}>Sao lưu thủ công</Text>
                <Text style={styles.driveSectionDesc}>
                  Tải dữ liệu hiện tại lên Google Drive ngay lập tức.
                </Text>
                <TouchableOpacity
                  style={[styles.driveManualBtn, !isGoogleSignedIn && styles.driveBtnDisabled]}
                  onPress={handleManualBackup}
                  disabled={!isGoogleSignedIn || isBackingUp}
                >
                  {isBackingUp ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.driveManualBtnText}>Sao lưu ngay bây giờ</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Thông tin lịch sử sao lưu */}
              <View style={styles.driveHistoryBox}>
                <Text style={styles.driveHistoryTitle}>Thông tin sao lưu gần nhất</Text>
                
                <View style={styles.driveHistoryRow}>
                  <Text style={styles.driveHistoryLabel}>Trạng thái:</Text>
                  <Text style={[
                    styles.driveHistoryValue, 
                    { 
                      fontWeight: "bold", 
                      color: lastBackupStatus === 'success' 
                        ? "#16a34a" 
                        : lastBackupStatus === 'failed' 
                          ? "#dc2626" 
                          : "#64748b" 
                    }
                  ]}>
                    {lastBackupStatus === 'success' 
                      ? "Thành công" 
                      : lastBackupStatus === 'failed' 
                        ? "Thất bại" 
                        : "Chưa thực hiện"}
                  </Text>
                </View>

                <View style={styles.driveHistoryRow}>
                  <Text style={styles.driveHistoryLabel}>Thời gian:</Text>
                  <Text style={styles.driveHistoryValue}>
                    {formatLastBackupTime(lastBackupTimestamp)}
                  </Text>
                </View>

                <View style={styles.driveWarningBox}>
                  <Text style={styles.driveWarningText}>
                    * Lưu ý: Mỗi lần sao lưu sẽ tạo một file riêng có tên dạng heodatbeo_YYYY-MM-DD_[giây UTC].txt. Google Drive chỉ giữ tối đa 20 file gần nhất trong thư mục "data_heo_dat_beo". Các file cũ hơn sẽ tự động được xóa bỏ.
                  </Text>
                </View>
              </View>

              {/* Khôi phục dữ liệu từ Google Drive */}
              <View style={[styles.driveActionBox, { marginTop: 16 }, !isGoogleSignedIn && { opacity: 0.5 }]}>
                <Text style={styles.driveSectionTitle}>Khôi phục dữ liệu</Text>
                <Text style={styles.driveSectionDesc}>
                  Tải xuống và khôi phục bản sao lưu mới nhất từ Google Drive của bạn.
                </Text>
                <TouchableOpacity
                  style={[styles.driveRestoreBtn, !isGoogleSignedIn && styles.driveBtnDisabled]}
                  onPress={handleRestoreFromGoogleDrive}
                  disabled={!isGoogleSignedIn || isRestoring}
                >
                  {isRestoring ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.driveRestoreBtnText}>Khôi phục dữ liệu</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isCategoryModalVisible}
        animationType="slide"
        // presentationStyle="pageSheet" for iOS, but we use standard transparent/full for both
        transparent={true}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quản lý danh mục</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalTabs}>
              <View style={[styles.modalTab, styles.modalTabActiveIncome]}>
                <Text style={[styles.modalTabText, styles.modalTabTextActive]}>
                  Danh mục Thu tiền
                </Text>
              </View>
            </View>

            <View style={styles.addCategoryRow}>
              <TextInput
                style={styles.addCategoryInput}
                placeholder="Nhập tên danh mục mới..."
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                onSubmitEditing={handleAddCategory}
              />
              <TouchableOpacity
                style={styles.addCategoryBtn}
                onPress={handleAddCategory}
              >
                <Plus color="#ffffff" size={20} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={getActiveCategories()}
              keyExtractor={(item) => item}
              renderItem={renderCategoryItem}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal
        visible={isSettingsModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.settingsModalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cài đặt hệ thống</Text>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <X color="#0f172a" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingSectionTitle}>Kiểu nhập giá tiền</Text>
              <View style={styles.settingGroup}>
                <TouchableOpacity
                  style={[
                    styles.settingOption,
                    profile?.inputMethod !== "manual" &&
                      styles.settingOptionActive,
                  ]}
                  onPress={() => handleUpdateInputMethod("keypad")}
                >
                  <Text
                    style={[
                      styles.settingOptionTitle,
                      profile?.inputMethod !== "manual" &&
                        styles.settingOptionTextActive,
                    ]}
                  >
                    Chọn mệnh giá (Mặc định)
                  </Text>
                  <Text style={styles.settingOptionDesc}>
                    Sử dụng bàn phím số có sẵn các mệnh giá để nhập nhanh.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.settingOption,
                    profile?.inputMethod === "manual" &&
                      styles.settingOptionActive,
                  ]}
                  onPress={() => handleUpdateInputMethod("manual")}
                >
                  <Text
                    style={[
                      styles.settingOptionTitle,
                      profile?.inputMethod === "manual" &&
                        styles.settingOptionTextActive,
                    ]}
                  >
                    Nhập tay
                  </Text>
                  <Text style={styles.settingOptionDesc}>
                    Sử dụng bàn phím hệ thống để nhập chính xác số tiền.
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeSettingsBtn}
              onPress={() => setSettingsModalVisible(false)}
            >
              <Text style={styles.closeSettingsBtnText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Sao lưu ngoại tuyến */}
      <Modal
        visible={isOfflineModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOfflineModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💾 Sao lưu ngoại tuyến</Text>
              <TouchableOpacity onPress={() => setOfflineModalVisible(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 10 }} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.card, { marginBottom: 16 }]}
                onPress={() => {
                  setOfflineModalVisible(false);
                  handleExport();
                }}
              >
                <View style={[styles.iconContainer, { backgroundColor: "#e0e7ff" }]}>
                  <Upload color="#4f46e5" size={18} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Xuất dữ liệu (.txt)</Text>
                  <Text style={{ fontSize: 13, color: "#64748b", marginTop: 4, lineHeight: 18 }}>
                    Xuất dữ liệu ra file văn bản (.txt) mã hóa để lưu trữ hoặc chuyển thiết bị.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.card, { marginBottom: 16 }]}
                onPress={() => {
                  setOfflineModalVisible(false);
                  handleImport();
                }}
              >
                <View style={[styles.iconContainer, { backgroundColor: "#dcfce7" }]}>
                  <Download color="#16a34a" size={18} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Nhập dữ liệu (.txt)</Text>
                  <Text style={{ fontSize: 13, color: "#64748b", marginTop: 4, lineHeight: 18 }}>
                    Nhập và phục hồi dữ liệu từ file văn bản (.txt) đã xuất trước đó.
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity
              style={[styles.closeSettingsBtn, { marginTop: 16 }]}
              onPress={() => setOfflineModalVisible(false)}
            >
              <Text style={styles.closeSettingsBtnText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Chọn Icon Thu Nhập */}
      <Modal
        visible={isIconModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelIncomeIcon}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.iconModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn biểu tượng thu nhập</Text>
              <TouchableOpacity onPress={handleCancelIncomeIcon}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>
            <Text style={styles.iconModalSubtitle}>
              Chọn biểu tượng đại diện cho nguồn thu "{pendingCategoryName}"
            </Text>

            <ScrollView
              contentContainerStyle={styles.iconGrid}
              showsVerticalScrollIndicator={false}
            >
              {Object.keys(INCOME_ICONS).map((iconKey) => {
                return (
                  <TouchableOpacity
                    key={iconKey}
                    style={styles.iconGridItem}
                    onPress={() => handleSelectIncomeIcon(iconKey)}
                  >
                    <Image
                      source={INCOME_ICONS[iconKey]}
                      style={styles.iconItemImage}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.closeSettingsBtn,
                { backgroundColor: "#64748b", marginTop: 16 },
              ]}
              onPress={handleCancelIncomeIcon}
            >
              <Text style={[styles.closeSettingsBtnText, { color: "#ffffff" }]}>
                {profile?.incomeCategories?.includes(pendingCategoryName)
                  ? "Hủy"
                  : "Dùng biểu tượng mặc định"}
              </Text>
            </TouchableOpacity>
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
    backgroundColor: "#ffffff",
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
  },
  body: {
    padding: 24,
    gap: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    height: "75%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
  },
  modalTitleSub: {
    fontSize: 14,
    color: "#64748b",
  },
  modalTabs: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modalTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  modalTabActiveExpense: {
    backgroundColor: "#ef4444",
  },
  modalTabActiveIncome: {
    backgroundColor: "#10b981",
  },
  modalTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  modalTabTextActive: {
    color: "#ffffff",
  },
  addCategoryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  addCategoryInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f8fafc",
  },
  addCategoryBtn: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  categoryListName: {
    fontSize: 16,
    color: "#334155",
    fontWeight: "500",
  },
  footerInfo: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    backgroundColor: "#ffffff",
  },
  versionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  versionText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  versionSeparator: {
    marginHorizontal: 8,
    color: "#cbd5e1",
    fontSize: 14,
  },
  versionHistoryBtn: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  authorText: {
    fontSize: 14,
    color: "#64748b",
  },
  authorHighlight: {
    fontWeight: "bold",
    color: "#3b82f6",
    fontStyle: "italic",
    fontSize: 15,
  },
  historyList: {
    marginTop: 8,
  },
  historyItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  historyDotContainer: {
    alignItems: "center",
    marginRight: 12,
    width: 16,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3b82f6",
    marginTop: 6,
  },
  historyLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#e2e8f0",
    marginTop: 4,
    marginBottom: -16,
  },
  historyContent: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  historyVersion: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  historyDesc: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  // Setting styles
  settingSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 12,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  settingGroup: {
    gap: 12,
  },
  settingOption: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  settingOptionActive: {
    backgroundColor: "#eff6ff",
    borderColor: "#3b82f6",
  },
  settingOptionInfo: {
    flex: 1,
  },
  settingOptionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a", // Dark blue/black
    marginBottom: 4,
  },
  settingOptionTextActive: {
    color: "#2563eb", // Primary blue
  },
  settingOptionDesc: {
    fontSize: 13,
    color: "#475569", // Darker gray
    lineHeight: 18,
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  settingsModalBox: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  settingItem: {
    marginBottom: 20,
  },
  closeSettingsBtn: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 46,
  },
  closeSettingsBtnText: {
    color: "#1e293b",
    fontSize: 16,
    fontWeight: "bold",
  },
  categoryIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#ecfdf5",
    justifyContent: "center",
    alignItems: "center",
  },
  categoryIcon: {
    width: 26,
    height: 26,
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
  driveStatusCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 20,
  },
  driveLoginBtn: {
    backgroundColor: "#0891b2",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  driveLoginBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
  driveLogoutBtn: {
    backgroundColor: "#fee2e2",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  driveLogoutBtnText: {
    color: "#dc2626",
    fontSize: 15,
    fontWeight: "600",
  },
  driveOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    marginBottom: 16,
  },
  driveOptionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  driveOptionDesc: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 16,
  },
  driveActionBox: {
    marginBottom: 20,
  },
  driveSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 6,
  },
  driveSectionDesc: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 12,
  },
  driveManualBtn: {
    backgroundColor: "#0891b2",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  driveManualBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
  driveBtnDisabled: {
    backgroundColor: "#cbd5e1",
  },
  driveHistoryBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  driveHistoryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  driveHistoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  driveHistoryLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  driveHistoryValue: {
    fontSize: 13,
    color: "#1e293b",
  },
  driveWarningBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  driveWarningText: {
    fontSize: 11,
    color: "#94a3b8",
    lineHeight: 15,
  },
  driveRestoreBtn: {
    backgroundColor: "#16a34a",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  driveRestoreBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
});

export default SettingsScreen;
