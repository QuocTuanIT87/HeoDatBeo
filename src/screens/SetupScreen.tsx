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
import { X, HelpCircle } from "lucide-react-native";
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
import { useLanguage } from "../i18n/LanguageContext";

const SetupScreen = () => {
  const { t } = useLanguage();
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

  const handleShowBalanceInfo = () => {
    Alert.normal(
      t("home.availableBalance"),
      "Tổng số dư hiện tại bạn đang có (bao gồm tiền mặt, tài khoản ngân hàng, ví điện tử...).\n\nSố tiền này sẽ được dùng làm số dư ban đầu, làm cơ sở để bạn ghi chép, theo dõi và phân chia vào các quỹ chi tiêu sau này.",
      [
        {
          text: t("common.understood"),
          style: "cancel",
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t("common.error"), t("setup.nameRequired"));
      return;
    }

    const balance = parseInt(balanceStr.replace(/[^0-9-]/g, ""), 10);
    if (isNaN(balance)) {
      Alert.alert(t("common.error"), t("setup.invalidBalance"));
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
      const initialTransaction = {
        id: Date.now().toString(),
        type: "income" as const,
        amount: balance,
        categoryId: "income_khac",
        note: "Số dư đầu tiên",
        timestamp: Date.now(),
      };
      await storage.saveTransaction(initialTransaction);

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "MainApp" }],
        }),
      );
    } else {
      Alert.alert(t("common.error"), t("setup.saveError"));
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
          Alert.alert(t("common.success"), t("setup.restoreSuccess"));
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "MainApp" }],
            }),
          );
        } else {
          Alert.alert(
            t("common.error"),
            t("setup.restoreError"),
          );
          setIsRestoring(false);
        }
      } else {
        setIsRestoring(false);
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t("common.error"), t("setup.restoreError"));
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
          Alert.alert(t("common.error"), signInRes.error || "Không thể đăng nhập Google.");
          setIsRestoring(false);
          return;
        }
      }

      const res = await restoreLatestBackupFromGoogleDrive();
      if (res.success && res.content) {
        const success = await storage.importData(res.content);
        if (success) {
          Alert.alert(t("common.success"), t("setup.restoreSuccess"));
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
            t("common.error"),
            t("setup.restoreError")
          );
        }
      } else {
        Alert.alert(t("common.error"), res.message);
      }
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message || String(e));
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
        Alert.alert(t("common.success"), "Đã hủy liên kết tài khoản Google.");
      } else {
        Alert.alert(t("common.error"), "Không thể đăng xuất.");
      }
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message || String(e));
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
          <Text style={styles.title}>{t("setup.welcome")}</Text>
          <Text style={styles.appName}>Heo Đất Béo</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>{t("setup.nameLabel")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("setup.namePlaceholder")}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 6 }}>
            <Text style={[styles.label, { marginBottom: 0 }]}>{t("setup.balanceLabel")}</Text>
            <TouchableOpacity onPress={handleShowBalanceInfo} activeOpacity={0.7}>
              <HelpCircle size={18} color="#0fb5b1" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder={t("setup.balancePlaceholder")}
            value={formatMoneyInput(balanceStr)}
            onChangeText={setBalanceStr}
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>{t("setup.submit")}</Text>
          </TouchableOpacity>

          <View style={styles.importContainer}>
            <Text style={styles.importText}>{t("setup.restoreHeader")}</Text>
            <TouchableOpacity
              style={[styles.importButton, isRestoring && { flexDirection: "row", gap: 8 }]}
              onPress={() => setShowRestoreOptions(true)}
              disabled={isRestoring}
            >
              {isRestoring && <ActivityIndicator size="small" color="#0fb5b1" />}
              <Text style={styles.importButtonText}>
                {isRestoring ? t("common.loading") : t("settings.backupRestore")}
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
              <Text style={styles.modalTitle}>{t("settings.backupRestore")}</Text>
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
              <Text style={styles.modalOptionButtonText}>{t("setup.restoreFile")}</Text>
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
                {isRestoring ? t("common.loading") : t("setup.restoreDrive")}
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
