import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  ActivityIndicator,
} from "react-native";
import { X } from "lucide-react-native";
import { Alert } from "../components/CustomAlert";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { storage } from "../store/storage";
import * as DocumentPicker from "expo-document-picker";
import { readAsStringAsync } from "expo-file-system/legacy";
import {
  initGoogleDrive,
  signInGoogle,
  restoreLatestBackupFromGoogleDrive,
  signOutGoogle,
  getAccessToken,
} from "../utils/googleDrive";
import { styles } from "../styles/SetupScreen";

const SetupScreen = () => {
  const [name, setName] = useState("");
  const [balanceStr, setBalanceStr] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const [showRestoreOptions, setShowRestoreOptions] = useState(false);
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null);
  const navigation = useNavigation();

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

  useEffect(() => {
    initGoogleDrive();
    checkGoogleSignInStatus();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên của bạn");
      return;
    }

    // allow negative initial balance if people are in debt?
    // standard numeric parse
    const balance = parseInt(balanceStr.replace(/[^0-9-]/g, ""), 10);
    if (isNaN(balance)) {
      Alert.alert("Lỗi", "Vui lòng nhập số dư hợp lệ");
      return;
    }

    const success = await storage.saveUserProfile({
      name: name.trim(),
      initialBalance: balance,
      initialBalanceTimestamp: Date.now(),
      hasSeenGuide: false,
      customFunds: [
        { id: Date.now().toString() + "_1", name: "Quỹ Cho Vay", balance: 0 },
        { id: Date.now().toString() + "_2", name: "Quỹ Khẩn Cấp", balance: 0 },
        { id: Date.now().toString() + "_3", name: "Quỹ Đầu Tư", balance: 0 },
      ],
    });

    if (success) {
      // Create initial balance transaction
      const initialTransaction = {
        id: Date.now().toString(),
        type: "income" as const,
        amount: balance,
        categoryId: "income_khac",
        name: "Số dư đầu tiên",
        timestamp: Date.now(),
      };
      await storage.saveTransaction(initialTransaction);

      // Navigate and reset to MainApp
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "MainApp" }],
        }),
      );
    } else {
      Alert.alert("Lỗi", "Không thể lưu dữ liệu, vui lòng thử lại.");
    }
  };

  const handleImport = async () => {
    if (isRestoring) return;
    setIsRestoring(true);
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
          Alert.alert("Thành công", "Dữ liệu đã được phục hồi.");
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "MainApp" }],
            }),
          );
        } else {
          Alert.alert(
            "Lỗi",
            "Dữ liệu không hợp lệ hoặc đã xảy ra lỗi trong quá trình phục hồi.",
          );
          setIsRestoring(false);
        }
      } else {
        setIsRestoring(false);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Lỗi", "Không thể nhập dữ liệu.");
      setIsRestoring(false);
    }
  };

  const handleRestoreFromGoogleDrive = async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    try {
      let signedIn = isGoogleSignedIn;
      if (!signedIn) {
        const signInRes = await signInGoogle();
        if (signInRes.success && signInRes.userInfo) {
          const userInfoAny = signInRes.userInfo as any;
          setIsGoogleSignedIn(true);
          setGoogleUserEmail(userInfoAny.user.email);
          signedIn = true;
        } else {
          Alert.alert("Lỗi đăng nhập", signInRes.error || "Không thể đăng nhập Google.");
          setIsRestoring(false);
          return;
        }
      }

      const res = await restoreLatestBackupFromGoogleDrive();
      if (res.success && res.content) {
        const success = await storage.importData(res.content);
        if (success) {
          Alert.alert("Thành công", "Dữ liệu đã được phục hồi từ Google Drive.");
          await storage.setGoogleDriveAutoBackupEnabled(true);
          const backupTime = res.timestamp || Date.now();
          await storage.setGoogleDriveLastBackupTimestamp(backupTime);
          await storage.setGoogleDriveLastBackupStatus("success");
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "MainApp" }],
            }),
          );
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
  };

  const handleGoogleLogout = async () => {
    try {
      const res = await signOutGoogle();
      if (res.success) {
        setIsGoogleSignedIn(false);
        setGoogleUserEmail(null);
        Alert.alert("Thành công", "Đã hủy liên kết tài khoản Google.");
      } else {
        Alert.alert("Lỗi", "Không thể đăng xuất.");
      }
    } catch (e: any) {
      Alert.alert("Lỗi", e.message || String(e));
    }
  };

  const formatMoneyInput = (text: string) => {
    const numericValue = text.replace(/[^0-9-]/g, "");
    if (!numericValue) return "";
    return parseInt(numericValue, 10).toLocaleString("vi-VN");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/savepig.jpg")}
            style={{ width: 140, height: 140, borderRadius: 80 }}
          />
          <Text style={styles.title}>Chào mừng đến với</Text>
          <Text style={styles.appName}>Heo Đất Béo</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Tên của bạn</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tên của bạn"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Số dư hiện hành (VNĐ)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: 5,000,000"
            value={formatMoneyInput(balanceStr)}
            onChangeText={setBalanceStr}
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>Bắt đầu</Text>
          </TouchableOpacity>

          <View style={styles.importContainer}>
            <Text style={styles.importText}>Đã có dữ liệu sẵn?</Text>
            <TouchableOpacity
              style={[styles.importButton, isRestoring && { flexDirection: "row", gap: 8 }]}
              onPress={() => setShowRestoreOptions(true)}
              disabled={isRestoring}
            >
              {isRestoring && <ActivityIndicator size="small" color="#0fb5b1" />}
              <Text style={styles.importButtonText}>
                {isRestoring ? "Đang khôi phục..." : "Khôi phục dữ liệu"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal
        visible={showRestoreOptions}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRestoreOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Khôi phục dữ liệu</Text>
              <TouchableOpacity onPress={() => setShowRestoreOptions(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalOptionButton}
              onPress={async () => {
                setShowRestoreOptions(false);
                await handleImport();
              }}
              disabled={isRestoring}
            >
              <Text style={styles.modalOptionButtonText}>Khôi phục dữ liệu - Ngoại tuyến</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOptionButton, { marginTop: 16, backgroundColor: "#0fb5b1" }]}
              onPress={async () => {
                setShowRestoreOptions(false);
                await handleRestoreFromGoogleDrive();
              }}
              disabled={isRestoring}
            >
              <Text style={[styles.modalOptionButtonText, { color: "#ffffff" }]}>
                {isRestoring ? "Đang khôi phục..." : "Khôi phục dữ liệu - Trực tuyến"}
              </Text>
            </TouchableOpacity>

            {isGoogleSignedIn && googleUserEmail && (
              <View style={styles.linkedAccountContainer}>
                <Text style={styles.linkedAccountLabel}>Tài khoản đã liên kết:</Text>
                <Text style={styles.linkedAccountEmail}>{googleUserEmail}</Text>
                <TouchableOpacity
                  style={styles.unlinkButton}
                  onPress={handleGoogleLogout}
                >
                  <Text style={styles.unlinkButtonText}>Hủy liên kết</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default SetupScreen;
