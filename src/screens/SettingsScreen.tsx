import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, FlatList, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { writeAsStringAsync, readAsStringAsync } from 'expo-file-system/legacy';
import { Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { storage } from '../store/storage';
import { CommonActions, useNavigation, useIsFocused } from '@react-navigation/native';
import { Download, Upload, Trash2, List, Plus, X, BookOpen } from 'lucide-react-native';
import { UserProfile } from '../types';

const DEFAULT_INCOME_CATEGORIES = ['Lương', 'Thưởng', 'Bán hàng'];

const SettingsScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Category Modal State (income only)
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (isFocused) {
      loadProfile();
    }
  }, [isFocused]);

  const loadProfile = async () => {
    const p = await storage.getUserProfile();
    setProfile(p);
  };

  const handleExport = async () => {
    try {
      const dataStr = await storage.exportData();
      const baseDir = Paths.document?.uri || Paths.cache?.uri;
      if (!baseDir) {
        Alert.alert('Lỗi', 'Không thể truy cập hệ thống file.');
        return;
      }
      const fileUri = baseDir + (baseDir.endsWith('/') ? '' : '/') + 'heodatbeo_backup.txt';
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
          loadProfile();
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

  const handleAddCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName || !profile) return;

    const current = profile.incomeCategories || DEFAULT_INCOME_CATEGORIES;
    if (current.includes(trimmedName)) {
      Alert.alert('Lỗi', 'Danh mục này đã tồn tại.');
      return;
    }
    const updatedProfile = { ...profile, incomeCategories: [...current, trimmedName] };
    const success = await storage.saveUserProfile(updatedProfile);
    if (success) {
      setProfile(updatedProfile);
      setNewCategoryName('');
    }
  };

  const handleDeleteCategory = async (catName: string) => {
    if (!profile) return;

    if (catName === 'Tiết kiệm' || catName === 'Rút tiết kiệm') {
      Alert.alert('Cảnh báo', 'Không thể xóa danh mục hệ thống này.');
      return;
    }

    // Kiểm tra có giao dịch thuộc danh mục này không
    const txs = await storage.getTransactions();
    const hasTx = txs.some(t => (t.categorySnapshot || t.category) === catName);
    const extraMsg = hasTx
      ? `\n\n⚠️ Danh mục này có giao dịch lịch sử. Các giao dịch đó sẽ được lưu trong danh mục "Khác" tại trang Thống kê.`
      : '';

    Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa danh mục thu "${catName}"?${extraMsg}`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          const current = profile.incomeCategories || DEFAULT_INCOME_CATEGORIES;
          const updatedProfile = { ...profile, incomeCategories: current.filter(c => c !== catName) };
          const success = await storage.saveUserProfile(updatedProfile);
          if (success) {
            setProfile(updatedProfile);

            if (hasTx) {
              const updatedTxs = txs.map(t => {
                if ((t.categorySnapshot || t.category) === catName) {
                  return { ...t, category: 'Khác', categorySnapshot: catName };
                }
                return t;
              });
              await storage.updateTransactionsBulk(updatedTxs);
            }
          }
        }
      }
    ]);
  };


  const renderCategoryItem = ({ item }: { item: string }) => (
    <View style={styles.categoryListItem}>
      <Text style={styles.categoryListName}>{item}</Text>
      <TouchableOpacity onPress={() => handleDeleteCategory(item)}>
        <Trash2 color="#ef4444" size={20} />
      </TouchableOpacity>
    </View>
  );

  const getActiveCategories = () => {
    return profile?.incomeCategories || DEFAULT_INCOME_CATEGORIES;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cài đặt & Sao lưu</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <TouchableOpacity style={styles.card} onPress={() => setCategoryModalVisible(true)}>
          <View style={[styles.iconContainer, { backgroundColor: '#fef3c7' }]}>
            <List color="#d97706" size={24} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Quản lý danh mục thu</Text>
            <Text style={styles.cardDesc}>Thêm, bớt danh mục thu nhập. Danh mục chi được quản lý trong tab "Chia Tiền".</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => (navigation as any).navigate('Guide')}>
          <View style={[styles.iconContainer, { backgroundColor: '#f0fdf4' }]}>
            <BookOpen color="#16a34a" size={24} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Hướng dẫn sử dụng</Text>
            <Text style={styles.cardDesc}>Cách thức hoạt động và sử dụng các tính năng của Heo Đất Béo.</Text>
          </View>
        </TouchableOpacity>

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

        <View style={styles.footerInfo}>
          <Text style={styles.versionText}>Phiên bản hiện tại : 4.0.0</Text>
          <Text style={styles.authorText}>
            Ứng dụng được phát triển bởi <Text style={styles.authorHighlight}>SatsBoy87</Text>
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={isCategoryModalVisible}
        animationType="slide"
        // presentationStyle="pageSheet" for iOS, but we use standard transparent/full for both
        transparent={true}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
                <Text style={[styles.modalTabText, styles.modalTabTextActive]}>Danh mục Thu tiền</Text>
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
              <TouchableOpacity style={styles.addCategoryBtn} onPress={handleAddCategory}>
                <Plus color="#ffffff" size={20} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={getActiveCategories()}
              keyExtractor={item => item}
              renderItem={renderCategoryItem}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    height: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalTabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  modalTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  modalTabActiveExpense: {
    backgroundColor: '#ef4444',
  },
  modalTabActiveIncome: {
    backgroundColor: '#10b981',
  },
  modalTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  modalTabTextActive: {
    color: '#ffffff',
  },
  addCategoryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  addCategoryInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8fafc',
  },
  addCategoryBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  categoryListName: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
  footerInfo: {
    marginTop: 32,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  authorText: {
    fontSize: 14,
    color: '#64748b',
  },
  authorHighlight: {
    fontWeight: 'bold',
    color: '#3b82f6',
  },
});

export default SettingsScreen;
