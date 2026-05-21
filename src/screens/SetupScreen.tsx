import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Alert } from "../components/CustomAlert";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { storage } from "../store/storage";
import * as DocumentPicker from "expo-document-picker";
import { readAsStringAsync } from "expo-file-system/legacy";

const SetupScreen = () => {
  const [name, setName] = useState("");
  const [balanceStr, setBalanceStr] = useState("");
  const navigation = useNavigation();

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
        category: "Khác",
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
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Lỗi", "Không thể nhập dữ liệu.");
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
              style={styles.importButton}
              onPress={handleImport}
            >
              <Text style={styles.importButtonText}>Chọn file backup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f5f6ff",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 24,
    color: "#64748b",
    marginTop: 16,
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#0fb5b1",
    marginTop: 8,
  },
  form: {
    width: "100%",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
    color: "#0f172a",
  },
  button: {
    backgroundColor: "#0fb5b1",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  importContainer: {
    marginTop: 32,
    alignItems: "center",
  },
  importText: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
  },
  importButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0fb5b1",
    backgroundColor: "transparent",
  },
  importButtonText: {
    color: "#0fb5b1",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SetupScreen;
