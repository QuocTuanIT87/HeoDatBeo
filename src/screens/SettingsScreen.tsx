import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { writeAsStringAsync, readAsStringAsync, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { storage } from '../store/storage';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { Download, Upload, Trash2 } from 'lucide-react-native';

const SettingsScreen = () => {
  const navigation = useNavigation();

  const handleExport = async () => {
    try {
      const dataStr = await storage.exportData();
      const baseDir = Paths.document?.uri || Paths.cache?.uri;
      if (!baseDir) {
        Alert.alert('Lỗi', 'Không thể truy cập hệ thống file.');
        return;
      }
      const fileUri = baseDir + 'heodatbeo_backup.txt';
      await writeAsStringAsync(fileUri, dataStr, { encoding: 'utf8' });
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Lưu hoặc chia sẻ dữ liệu sao lưu',
        });
      } else {
        Alert.alert('Lỗi', 'Tính năng chia sẻ không khả dụng trên thiết bị này.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Lỗi', 'Không thể xuất dữ liệu.');
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/plain',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileContent = await readAsStringAsync(result.assets[0].uri, { encoding: 'utf8' });
        
        const success = await storage.importData(fileContent);
        if (success) {
          Alert.alert('Thành công', 'Dữ liệu đã được phục hồi. Vui lòng mở lại ứng dụng hoặc chuyển tab để làm mới.');
        } else {
          Alert.alert('Lỗi', 'Dữ liệu không hợp lệ hoặc đã xảy ra lỗi trong quá trình phục hồi.');
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Lỗi', 'Không thể nhập dữ liệu.');
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Cảnh báo nguy hiểm',
      'Bạn có chắc chắn muốn xóa toàn bộ dữ liệu? (Bao gồm số dư và lịch sử thu chi. Việc này không thể hoàn tác).',
      [
        { text: 'Hủy bỏ', style: 'cancel' },
        { 
          text: 'Chắc chắn Xóa', 
          style: 'destructive',
          onPress: async () => {
            const success = await storage.clearUserResetData();
            if (success) {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Setup' }],
                })
              );
            } else {
              Alert.alert('Lỗi', 'Không thể xóa dữ liệu.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cài đặt & Sao lưu</Text>
      </View>

      <View style={styles.body}>
        <TouchableOpacity style={styles.card} onPress={handleExport}>
          <View style={[styles.iconContainer, { backgroundColor: '#e0e7ff' }]}>
            <Upload color="#4f46e5" size={24} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Xuất dữ liệu (.txt)</Text>
            <Text style={styles.cardDesc}>Tạo file sao lưu dữ liệu hiện tại để lưu trữ.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={handleImport}>
          <View style={[styles.iconContainer, { backgroundColor: '#dcfce7' }]}>
            <Download color="#16a34a" size={24} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Nhập dữ liệu (.txt)</Text>
            <Text style={styles.cardDesc}>Phục hồi dữ liệu từ file sao lưu trước đó.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={handleReset}>
          <View style={[styles.iconContainer, { backgroundColor: '#fee2e2' }]}>
            <Trash2 color="#dc2626" size={24} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Khôi phục cài đặt gốc</Text>
            <Text style={styles.cardDesc}>Xóa mọi dữ liệu và trở lại màn hình bắt đầu.</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  body: {
    padding: 24,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});

export default SettingsScreen;
