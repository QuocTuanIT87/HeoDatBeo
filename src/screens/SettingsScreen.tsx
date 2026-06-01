import React, { useState, useEffect } from "react";
import {
  View,
  Text,
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
  checkLatestBackupOnGoogleDrive,
  getLatestBackupDetailsOnGoogleDrive,
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
  Cloud,
  Database,
  PencilLine,
  Bitcoin,
  FileText,
  Settings,
  ChartNoAxesCombined,
} from "lucide-react-native";
import { UserProfile, CategoryBudget, IncomeCategory } from "../types";
import { EXPENSE_ICONS } from "./HomeScreen";
import { scheduleTestNotification } from "../utils/notifications";
import { styles } from "../styles/SettingsScreen";
import { exportYearlyPdfReport } from "../utils/pdfReport";
import { isCategoryIdMatch } from "../utils/category";

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
  catNameOrId: string,
  profile: UserProfile | null,
) => {
  const match = (profile?.incomeCategories || []).find((c: any) => 
    typeof c === 'object' && (c.id === catNameOrId || c.name === catNameOrId)
  ) as any;
  if (match && match.icon && INCOME_ICONS[match.icon]) {
    return INCOME_ICONS[match.icon];
  }

  // Fallback for legacy key lookup
  const key = profile?.incomeCategoryIcons?.[catNameOrId];
  if (key && INCOME_ICONS[key]) {
    return INCOME_ICONS[key];
  }
  if (match) {
    const keyByMatch = profile?.incomeCategoryIcons?.[match.id] || profile?.incomeCategoryIcons?.[match.name];
    if (keyByMatch && INCOME_ICONS[keyByMatch]) {
      return INCOME_ICONS[keyByMatch];
    }
    const catName = match.name;
    if (catName === "Lương") return INCOME_ICONS["salary"];
    if (catName === "Thưởng") return INCOME_ICONS["gift-box"];
    if (catName === "Bán hàng") return INCOME_ICONS["sell"];
  }

  if (catNameOrId === "Lương" || catNameOrId === "income_luong") return INCOME_ICONS["salary"];
  if (catNameOrId === "Thưởng" || catNameOrId === "income_thuong") return INCOME_ICONS["gift-box"];
  if (catNameOrId === "Bán hàng" || catNameOrId === "income_ban_hang") return INCOME_ICONS["sell"];
  return INCOME_ICONS["default"];
};

import VERSION_HISTORY from "../../version_history.json";
import { BanknoteArrowUp, CopyMinus, FileX, FolderMinus, ShieldUser } from "lucide-react-native/icons";


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
  const [pendingCategoryId, setPendingCategoryId] = useState("");
  const [activeCategoryTab, setActiveCategoryTab] = useState<'income' | 'expense'>('income');
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);

  // Rename states
  const [isRenameModalVisible, setRenameModalVisible] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string; type: 'income' | 'expense' } | null>(null);
  const [renameInputText, setRenameInputText] = useState("");

  // Settings Modal State
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);

  // PDF Report States
  const [isPdfModalVisible, setPdfModalVisible] = useState(false);
  const [selectedPdfYear, setSelectedPdfYear] = useState<number>(new Date().getFullYear());
  const [pdfAvailableYears, setPdfAvailableYears] = useState<number[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
  const [isNotesModalVisible, setNotesModalVisible] = useState(false);
  const [notesTab, setNotesTab] = useState<'expense' | 'income'>('expense');
  const [newNoteText, setNewNoteText] = useState("");
  const [suggestedNotes, setSuggestedNotes] = useState<string[]>([]);

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

  useEffect(() => {
    if (isNotesModalVisible) {
      loadSuggestedNotes();
    }
  }, [isNotesModalVisible, notesTab]);

  const loadSuggestedNotes = async () => {
    const notes = await storage.getSuggestedNotes(notesTab);
    setSuggestedNotes(notes);
  };

  const handleAddNote = async () => {
    const trimmed = newNoteText.trim();
    if (!trimmed) return;
    if (suggestedNotes.includes(trimmed)) {
      Alert.alert("Lỗi", "Ghi chú này đã tồn tại trong gợi ý.");
      return;
    }
    await storage.addSuggestedNote(notesTab, trimmed);
    setNewNoteText("");
    loadSuggestedNotes();
  };

  const handleDeleteNote = async (note: string) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc muốn xóa ghi chú gợi ý này?\n"${note}"`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            await storage.deleteSuggestedNote(notesTab, note);
            loadSuggestedNotes();
          }
        }
      ]
    );
  };

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
        
        let lastTimestamp = await storage.getGoogleDriveLastBackupTimestamp();
        let lastStatus = await storage.getGoogleDriveLastBackupStatus();

        if (lastTimestamp === 0) {
          const driveBackup = await checkLatestBackupOnGoogleDrive();
          if (driveBackup && driveBackup.success && driveBackup.timestamp) {
            lastTimestamp = driveBackup.timestamp;
            lastStatus = 'success';
            await storage.setGoogleDriveLastBackupTimestamp(lastTimestamp);
            await storage.setGoogleDriveLastBackupStatus(lastStatus);
          }
        }

        const autoEnabled = await storage.isGoogleDriveAutoBackupEnabled();
        setIsAutoBackupEnabled(autoEnabled);
        setLastBackupTimestamp(lastTimestamp);
        setLastBackupStatus(lastStatus);

        Alert.alert("Thành công", `Đã liên kết tài khoản Google: ${userInfoAny.user.email}`);
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

    setIsRestoring(true);
    try {
      // 1. Tải thông tin bản sao lưu mới nhất trước để hiển thị xác nhận cho người dùng
      const detailsRes = await getLatestBackupDetailsOnGoogleDrive();
      if (!detailsRes.success || !detailsRes.name || !detailsRes.timestamp) {
        Alert.alert("Không tìm thấy bản sao lưu", detailsRes.message || "Không thể lấy thông tin bản sao lưu.");
        setIsRestoring(false);
        return;
      }

      // Định dạng ngày giờ bản sao lưu
      const date = new Date(detailsRes.timestamp);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const hh = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      const ss = String(date.getSeconds()).padStart(2, '0');
      const formattedTime = `${dd}/${mm}/${yyyy} lúc ${hh}:${min}:${ss}`;

      setIsRestoring(false); // Tắt spinner để hiển thị hộp thoại xác nhận

      Alert.alert(
        "Khôi phục dữ liệu",
        `Tìm thấy bản sao lưu gần nhất trên Google Drive:\n📁 Tên file: ${detailsRes.name}\n⏰ Thời gian: ${formattedTime}\n\nDữ liệu hiện tại trên thiết bị sẽ bị ghi đè và thay thế hoàn toàn.`,
        [
          { text: "Hủy bỏ", style: "cancel" },
          {
            text: "Xác nhận",
            style: "destructive",
            onPress: async () => {
              setIsRestoring(true);
              try {
                const res = await restoreLatestBackupFromGoogleDrive();
                if (res.success && res.content) {
                  const success = await storage.importData(res.content);
                  if (success) {
                    const backupTime = res.timestamp || detailsRes.timestamp || Date.now();
                    await storage.setGoogleDriveLastBackupTimestamp(backupTime);
                    await storage.setGoogleDriveLastBackupStatus("success");
                    setLastBackupTimestamp(backupTime);
                    setLastBackupStatus("success");
                    Alert.alert(
                      "Thành công",
                      "Dữ liệu đã được phục hồi từ Google Drive. Vui lòng mở lại ứng dụng hoặc chuyển màn hình để làm mới."
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
    } catch (e: any) {
      Alert.alert("Lỗi", e.message || String(e));
      setIsRestoring(false);
    }
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
    const budgets = await storage.getCategoryBudgets();
    const activeBudgets = budgets.filter(b => b.deleteAt === null || b.deleteAt === undefined);
    setCategoryBudgets(activeBudgets);
  };

  const handleOpenPdfModal = async () => {
    try {
      const txs = await storage.getTransactions();
      const yearsSet = new Set<number>();
      txs.forEach(tx => {
        if (tx.timestamp) {
          const y = new Date(tx.timestamp).getFullYear();
          if (!isNaN(y)) {
            yearsSet.add(y);
          }
        }
      });
      
      // Default to current year if empty
      const currentYear = new Date().getFullYear();
      if (yearsSet.size === 0) {
        yearsSet.add(currentYear);
      }
      
      const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);
      setPdfAvailableYears(sortedYears);
      
      // Default selection to current year if available, otherwise the latest year
      if (yearsSet.has(currentYear)) {
        setSelectedPdfYear(currentYear);
      } else {
        setSelectedPdfYear(sortedYears[0]);
      }
      
      setPdfModalVisible(true);
    } catch (e) {
      console.error(e);
      Alert.alert("Lỗi", "Không thể tải danh sách năm giao dịch.");
    }
  };

  const handleExportPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await exportYearlyPdfReport(selectedPdfYear);
      setPdfModalVisible(false);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Lỗi", e.message || "Không thể xuất file PDF báo cáo năm.");
    } finally {
      setIsGeneratingPdf(false);
    }
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
            "Dữ liệu đã được phục hồi. Vui lòng mở lại ứng dụng hoặc chuyển màn hình để làm mới.",
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
            try {
              await signOutGoogle();
            } catch (e) {
              console.error("Error signing out Google during factory reset:", e);
            }
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
      trimmedName === "Nuôi heo béo" ||
      trimmedName === "Heo giảm cân" ||
      trimmedName === "Số dư đầu tiên" ||
      trimmedName === "Khác"
    ) {
      Alert.alert(
        "Lỗi",
        `Tên danh mục "${trimmedName}" đã được hệ thống sử dụng. Vui lòng chọn tên khác.`,
      );
      return;
    }

    if (activeCategoryTab === 'income') {
      const current = profile.incomeCategories || [];
      const isActiveExisting = current.some((c: any) => {
        if (typeof c === 'string') return c === trimmedName;
        return c.name === trimmedName && (c.deleteAt === null || c.deleteAt === undefined);
      });
      if (isActiveExisting) {
        Alert.alert("Lỗi", "Danh mục này đã tồn tại.");
        return;
      }

      const softDeletedCat = current.find((c: any) => {
        if (typeof c === 'string') return false;
        return c.name === trimmedName && c.deleteAt !== null && c.deleteAt !== undefined;
      });

      if (softDeletedCat) {
        const restoredCats = current.map((c: any) => {
          if (typeof c === 'object' && c.name === trimmedName) {
            return { ...c, deleteAt: null };
          }
          return c;
        });
        const updatedProfile = {
          ...profile,
          incomeCategories: restoredCats,
        };
        const success = await storage.saveUserProfile(updatedProfile);
        if (success) {
          setProfile(updatedProfile);
          setNewCategoryName("");
          setCategoryModalVisible(true);
          Alert.alert("Thành công", `Đã khôi phục danh mục thu nhập "${trimmedName}".`);
        }
        return;
      }

      const newId = 'income_' + trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.random().toString(36).substr(2, 5);
      setPendingCategoryId(newId);
      setPendingCategoryName(trimmedName);
      setCategoryModalVisible(false);
      setIconModalVisible(true);
    } else {
      Alert.alert("Thông tin", "Vui lòng vào màn hình 'Chia Tiền' để tạo danh mục chi tiêu mới.");
    }
  };

  const handleSelectIncomeIcon = async (iconKey: string) => {
    if (!pendingCategoryName || !profile) return;
    const catId = pendingCategoryId || 'income_' + pendingCategoryName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.random().toString(36).substr(2, 5);
    const catName = pendingCategoryName;

    const current = profile.incomeCategories && profile.incomeCategories.length > 0
      ? profile.incomeCategories
      : DEFAULT_INCOME_CATEGORIES.map(c => ({
          id: 'income_' + c.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          name: c,
          icon: c === "Lương" ? "salary" : c === "Thưởng" ? "gift-box" : c === "Bán hàng" ? "sell" : "default"
        }));

    const isExisting = current.some((c: any) => 
      typeof c === 'string' ? c === catName : (c.id === catId || c.name === catName) && (c.deleteAt === null || c.deleteAt === undefined)
    );

    let updatedProfile;
    if (isExisting) {
      const updatedCats = current.map((c: any) => {
        if (typeof c === 'string') {
          if (c === catName) {
            return { id: catId, name: c, icon: iconKey };
          }
          const fallbackId = 'income_' + c.toLowerCase().replace(/[^a-z0-9]/g, '_');
          return { id: fallbackId, name: c };
        }
        const isMatch = typeof c === 'object' && (c.id === catId || c.name === catName);
        return isMatch ? { ...c, icon: iconKey } : c;
      });
      updatedProfile = {
        ...profile,
        incomeCategories: updatedCats as any,
      };
    } else {
      const newCategory = { id: catId, name: catName, icon: iconKey };
      const normalizedCurrent = current.map((c: any) => {
        if (typeof c === 'string') {
          const fallbackId = 'income_' + c.toLowerCase().replace(/[^a-z0-9]/g, '_');
          return { id: fallbackId, name: c };
        }
        return c;
      });

      updatedProfile = {
        ...profile,
        incomeCategories: [...normalizedCurrent, newCategory] as any,
      };
    }

    const success = await storage.saveUserProfile(updatedProfile);
    if (success) {
      setProfile(updatedProfile);
      setNewCategoryName("");
      setPendingCategoryId("");
      setPendingCategoryName("");
      setIconModalVisible(false);
      setCategoryModalVisible(true);
    }
  };

  const handleCancelIncomeIcon = () => {
    if (!pendingCategoryName || !profile) {
      setIconModalVisible(false);
      setCategoryModalVisible(true);
      return;
    }
    const current = profile.incomeCategories || [];
    const isExisting = current.some((c: any) => 
      typeof c === 'string' ? c === pendingCategoryName : c.id === pendingCategoryId || c.name === pendingCategoryName
    );

    if (isExisting) {
      setPendingCategoryId("");
      setPendingCategoryName("");
      setIconModalVisible(false);
      setCategoryModalVisible(true);
    } else {
      handleSelectIncomeIcon("default");
    }
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    if (!profile) return;

    if (
      catName === "Tiết kiệm" ||
      catName === "Rút tiết kiệm" ||
      catName === "Nuôi heo béo" ||
      catName === "Heo giảm cân" ||
      catName === "Số dư đầu tiên" ||
      catName === "Khác"
    ) {
      Alert.alert("Cảnh báo", "Không thể xóa danh mục hệ thống này.");
      return;
    }

    const txs = await storage.getTransactions();
    const hasTx = txs.some(
      (t) => t.categoryId && catId && isCategoryIdMatch(t.categoryId, catId)
    );
    const extraMsg = hasTx
      ? `\n\n⚠️ Danh mục này có giao dịch lịch sử. Nó sẽ được lưu tạm trong mục 'Danh mục bị xoá gần đây'.`
      : "";

    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc muốn xóa danh mục "${catName}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            if (activeCategoryTab === 'income') {
              const current = profile.incomeCategories || [];
              let updatedCats: any[];
              if (hasTx) {
                updatedCats = current.map((c: any) => {
                  if (typeof c === 'string') {
                    const fallbackId = 'income_' + c.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.random().toString(36).substr(2, 5);
                    if (c === catName) {
                      return { id: fallbackId, name: c, deleteAt: Date.now() };
                    }
                    return { id: fallbackId, name: c };
                  }
                  if (c.id === catId || c.name === catName) {
                    return { ...c, deleteAt: Date.now() };
                  }
                  return c;
                });
              } else {
                updatedCats = current.filter((c: any) => 
                  typeof c === 'string' ? c !== catName : c.id !== catId
                );
              }
              const updatedProfile = {
                ...profile,
                incomeCategories: updatedCats,
              };
              const success = await storage.saveUserProfile(updatedProfile);
              if (success) {
                setProfile(updatedProfile);
              }
            } else {
              // Delete Expense Category (CategoryBudget)
              const allBudgets = await storage.getCategoryBudgets();
              let updatedBudgets: CategoryBudget[];
              if (hasTx) {
                updatedBudgets = allBudgets.map((b) => {
                  const isMatch = b.id && catId ? isCategoryIdMatch(b.id, catId) : b.name === catName;
                  return isMatch ? { ...b, deleteAt: Date.now(), budget: 0 } : b;
                });
              } else {
                updatedBudgets = allBudgets.filter((b) => b.id !== catId && b.name !== catName);
              }
              const success = await storage.saveCategoryBudgets(updatedBudgets);
              if (success) {
                setCategoryBudgets(updatedBudgets.filter(b => b.deleteAt === null || b.deleteAt === undefined));
              }
            }
          },
        },
      ],
    );
  };

  const handleOpenRenameModal = (catId: string, catName: string) => {
    if (
      catName === "Tiết kiệm" ||
      catName === "Rút tiết kiệm" ||
      catName === "Nuôi heo béo" ||
      catName === "Heo giảm cân" ||
      catName === "Số dư đầu tiên" ||
      catName === "Khác"
    ) {
      Alert.alert("Lỗi", "Không thể đổi tên danh mục hệ thống.");
      return;
    }
    setRenameTarget({ id: catId, name: catName, type: activeCategoryTab });
    setRenameInputText(catName);
    setRenameModalVisible(true);
  };

  const handleRenameConfirm = async () => {
    const trimmedNewName = renameInputText.trim();
    if (!trimmedNewName || !profile || !renameTarget) return;

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

    if (renameTarget.type === 'income') {
      const current = profile.incomeCategories || [];
      const isConflicting = current.some((c: any) => 
        typeof c === 'string' ? c === trimmedNewName : c.id && renameTarget.id && !isCategoryIdMatch(c.id, renameTarget.id) && c.name === trimmedNewName
      );
      if (isConflicting) {
        Alert.alert("Lỗi", "Tên danh mục này đã tồn tại.");
        return;
      }

      const updatedIncomeCats = current.map((c: any) => {
        if (typeof c === 'string') {
          if (c === renameTarget.name) {
            const newId = 'income_' + trimmedNewName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.random().toString(36).substr(2, 5);
            return { id: newId, name: trimmedNewName };
          }
          const fallbackId = 'income_' + c.toLowerCase().replace(/[^a-z0-9]/g, '_');
          return { id: fallbackId, name: c };
        }
        return c.id && renameTarget.id && isCategoryIdMatch(c.id, renameTarget.id) ? { ...c, name: trimmedNewName } : c;
      });

      const updatedProfile = {
        ...profile,
        incomeCategories: updatedIncomeCats as any,
      };

      const success = await storage.saveUserProfile(updatedProfile);
      if (success) {
        setProfile(updatedProfile);
      }
    } else {
      // Expense category rename
      const isConflicting = categoryBudgets.some(
        (b) => b.id && renameTarget.id && !isCategoryIdMatch(b.id, renameTarget.id) && b.name === trimmedNewName
      );
      if (isConflicting) {
        Alert.alert("Lỗi", "Tên danh mục này đã tồn tại.");
        return;
      }

      const updatedBudgets = categoryBudgets.map((b) =>
        b.id && renameTarget.id && isCategoryIdMatch(b.id, renameTarget.id) ? { ...b, name: trimmedNewName } : b
      );

      const success = await storage.saveCategoryBudgets(updatedBudgets);
      if (success) {
        setCategoryBudgets(updatedBudgets);
      }
    }

    setRenameModalVisible(false);
    setRenameTarget(null);
    setRenameInputText("");
    Alert.alert("Thành công", "Đã đổi tên danh mục.");
  };

  const handleUpdateInputMethod = async (method: "keypad" | "manual") => {
    if (!profile) return;
    const updatedProfile = { ...profile, inputMethod: method };
    const success = await storage.saveUserProfile(updatedProfile);
    if (success) {
      setProfile(updatedProfile);
    }
  };

  const renderCategoryItem = ({ item }: { item: { id: string; name: string } }) => {
    const iconSource = activeCategoryTab === 'income' 
      ? getIncomeIconSource(item.id, profile)
      : (() => {
          const budget = categoryBudgets.find(b => b.id === item.id || b.name === item.name);
          return budget && budget.icon ? EXPENSE_ICONS[budget.icon] : EXPENSE_ICONS["default"];
        })();

    return (
      <View style={styles.categoryListItem}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={() => handleOpenRenameModal(item.id, item.name)}>
            <Settings color="#cbd5e1" size={20} />
          </TouchableOpacity>
          <TouchableOpacity
              style={styles.categoryIconContainer}
              onPress={() => {
                setPendingCategoryId(item.id);
                setPendingCategoryName(item.name);
                setCategoryModalVisible(false);
                setIconModalVisible(true);
              }}
            >
              <Image source={iconSource} style={styles.categoryIcon} />
          </TouchableOpacity>
          <Text style={styles.categoryListName}>{item.name}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <TouchableOpacity onPress={() => handleDeleteCategory(item.id, item.name)}>
            <Trash2 color="#cccccc" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getActiveCategories = () => {
    if (activeCategoryTab === 'income') {
      const raw = profile?.incomeCategories || DEFAULT_INCOME_CATEGORIES;
      return raw.map((c: any) => {
        if (typeof c === 'string') {
          return { id: 'income_' + c.toLowerCase().replace(/[^a-z0-9]/g, '_'), name: c };
        }
        return c;
      }).filter((c: any) => c.deleteAt === null || c.deleteAt === undefined);
    } else {
      return categoryBudgets.map((b) => ({
        id: b.id || 'expense_' + b.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        name: b.name,
      }));
    }
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
            <ShieldUser color="#a855f7" size={18} />
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
            <BanknoteArrowUp color="#d97706" size={18} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Danh mục thu nhập</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => (navigation as any).navigate("GoldHistory")}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#fef3c7" }]}>
            <Bitcoin color="#d97706" size={18} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Quản lý vàng</Text>
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

        <TouchableOpacity
          style={styles.card}
          onPress={() => setNotesModalVisible(true)}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#f0fdf4" }]}>
            <PencilLine color="#16a34a" size={18} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Gợi ý ghi chú</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={handleOpenPdfModal}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#ecfeff" }]}>
            <ChartNoAxesCombined color="#0891b2" size={18} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Xuất báo cáo năm</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={handleReset}>
          <View style={[styles.iconContainer, { backgroundColor: "#fee2e2" }]}>
            <FileX color="#dc2626" size={18} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Khôi phục cài đặt gốc</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer cố định phía dưới */}
      <View style={styles.footerInfo}>
        <View style={styles.versionRow}>
          <Text style={styles.versionText}>Phiên bản hiện tại : {VERSION_HISTORY[0]?.version}</Text>
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
                      <Text style={styles.historyVersion}>Mã phiên bản {item.order}: {item.version}</Text>
                      <View>
                        <Text style={styles.historyDesc}>Tính năng mới: </Text>
                        <Text>{item.description}</Text>
                      </View>
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
                    * Lưu ý: Mỗi lần sao lưu sẽ tạo một file riêng có tên dạng heodatbeo_YYYY-MM-DD_[giây UTC].txt. Khi đạt tối đa 20 bản sao lưu trên Google Drive, hệ thống sẽ tự động xóa 17 bản sao lưu cũ nhất và chỉ giữ lại 3 bản sao lưu mới nhất.
                  </Text>
                </View>
              </View>

              {/* Khôi phục dữ liệu từ Google Drive */}
              <View style={[styles.driveActionBox, { marginTop: 16 }, !isGoogleSignedIn && { opacity: 0.5 }]}>
                <Text style={styles.driveSectionTitle}>Khôi phục dữ liệu</Text>
                <Text style={styles.driveSectionDesc}>
                  Khôi phục bản sao lưu mới nhất từ Google Drive của bạn.
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
              <Text style={styles.modalTitle}>Quản lý danh mục thu nhập</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
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
              keyExtractor={(item) => item.id}
              renderItem={renderCategoryItem}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal: Đổi tên danh mục */}
      <Modal
        visible={isRenameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.settingsModalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đổi tên danh mục</Text>
              <TouchableOpacity onPress={() => setRenameModalVisible(false)}>
                <X color="#0f172a" size={24} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 14, color: "#64748b", marginBottom: 12 }}>
              Nhập tên mới cho danh mục "{renameTarget?.name}":
            </Text>

            <TextInput
              style={[styles.addCategoryInput, { flex: 0, width: "100%", marginBottom: 12 }]}
              placeholder="Nhập tên mới..."
              value={renameInputText}
              onChangeText={setRenameInputText}
              onSubmitEditing={handleRenameConfirm}
              autoFocus={true}
            />

            <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                style={[styles.closeSettingsBtn, { flex: 1, marginBottom: 0, backgroundColor: "#f1f5f9" }]}
                onPress={() => setRenameModalVisible(false)}
              >
                <Text style={styles.closeSettingsBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pdfExportBtn, { flex: 1, marginTop: 0 }]}
                onPress={handleRenameConfirm}
              >
                <Text style={styles.pdfExportBtnText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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

      {/* Modal: Quản lý ghi chú gợi ý */}
      <Modal
        visible={isNotesModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNotesModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quản lý gợi ý ghi chú</Text>
              <TouchableOpacity onPress={() => setNotesModalVisible(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalTabs}>
              <TouchableOpacity
                style={[
                  styles.modalTab,
                  notesTab === "expense" && styles.modalTabActiveExpense,
                ]}
                onPress={() => setNotesTab("expense")}
              >
                <Text
                  style={[
                    styles.modalTabText,
                    notesTab === "expense" && styles.modalTabTextActive,
                  ]}
                >
                  Ghi chú Chi tiền
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalTab,
                  notesTab === "income" && styles.modalTabActiveIncome,
                ]}
                onPress={() => setNotesTab("income")}
              >
                <Text
                  style={[
                    styles.modalTabText,
                    notesTab === "income" && styles.modalTabTextActive,
                  ]}
                >
                  Ghi chú Thu tiền
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.addCategoryRow}>
              <TextInput
                style={styles.addCategoryInput}
                placeholder="Nhập ghi chú gợi ý mới..."
                value={newNoteText}
                onChangeText={setNewNoteText}
                onSubmitEditing={handleAddNote}
              />
              <TouchableOpacity
                style={styles.addCategoryBtn}
                onPress={handleAddNote}
              >
                <Plus color="#ffffff" size={20} />
              </TouchableOpacity>
            </View>

            {suggestedNotes.length === 0 ? (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
                <Text style={{ color: "#94a3b8", fontSize: 16 }}>Chưa có ghi chú gợi ý nào.</Text>
              </View>
            ) : (
              <FlatList
                data={suggestedNotes}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => (
                  <View style={styles.categoryListItem}>
                    <Text style={[styles.categoryListName, { flex: 1, paddingRight: 10 }]} numberOfLines={2}>
                      {item}
                    </Text>
                    <TouchableOpacity onPress={() => handleDeleteNote(item)}>
                      <Trash2 color="#cccccc" size={20} />
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        </KeyboardAvoidingView>
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
                {profile?.incomeCategories?.some((c: any) => typeof c === 'string' ? c === pendingCategoryName : c.name === pendingCategoryName || c.id === pendingCategoryId)
                  ? "Hủy"
                  : "Dùng biểu tượng mặc định"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Chọn năm xuất PDF */}
      <Modal
        visible={isPdfModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => !isGeneratingPdf && setPdfModalVisible(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.settingsModalBox}>
            {/* Loading Overlay */}
            {isGeneratingPdf && (
              <View style={styles.pdfLoadingOverlay}>
                <ActivityIndicator size="large" color="#f43f5e" />
                <Text style={{ marginTop: 12, color: "#e11d48", fontWeight: "600", fontSize: 14 }}>
                  Đang tạo PDF báo cáo...
                </Text>
              </View>
            )}

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Báo cáo PDF</Text>
              <TouchableOpacity 
                onPress={() => setPdfModalVisible(false)}
                disabled={isGeneratingPdf}
              >
                <X color="#0f172a" size={24} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 14, color: "#475569", marginBottom: 10 }}>
              Chọn năm tài chính cần xuất báo cáo dữ liệu thu chi:
            </Text>

            <View style={styles.pdfYearGrid}>
              {pdfAvailableYears.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.pdfYearItem,
                    selectedPdfYear === year && styles.pdfYearItemActive,
                  ]}
                  onPress={() => setSelectedPdfYear(year)}
                  disabled={isGeneratingPdf}
                >
                  <Text
                    style={[
                      styles.pdfYearText,
                      selectedPdfYear === year && styles.pdfYearTextActive,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.pdfExportBtn}
              onPress={handleExportPdf}
              disabled={isGeneratingPdf}
            >
              <Text style={styles.pdfExportBtnText}>Xuất báo cáo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};



export default SettingsScreen;
