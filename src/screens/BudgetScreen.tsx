import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Modal, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PlusCircle, Trash2, X, Wallet, ArrowDownCircle, Calendar } from 'lucide-react-native';
import { storage } from '../store/storage';
import { CategoryBudget, UserProfile } from '../types';
import { formatCurrency } from '../utils/format';
import Keypad from '../components/Keypad';
import { useIsFocused } from '@react-navigation/native';

const COOLDOWN_DAYS = 15; // Số ngày cooldown để sửa ngày ước tính

// Màn hình BudgetScreen: Quản lý chia tiền vào các danh mục chi tiêu
const BudgetScreen = () => {
  const isFocused = useIsFocused();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [unallocated, setUnallocated] = useState<number>(0); // Số dư chưa phân bổ

  const [allocModalVisible, setAllocModalVisible] = useState(false);
  const [selectedCat, setSelectedCat] = useState<CategoryBudget | null>(null);
  const [allocAmount, setAllocAmount] = useState<number>(0);
  const [allocType, setAllocType] = useState<'deposit' | 'withdraw'>('deposit');

  // Ngày ước tính tiêu hết (YC 4)
  const [estimatedEndDate, setEstimatedEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Modal: Thêm danh mục mới
  const [addCatModalVisible, setAddCatModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');


  // Modal: Sửa ngày ước tính (YC 4)
  const [editDateModal, setEditDateModal] = useState(false);
  const [editDateTarget, setEditDateTarget] = useState<CategoryBudget | null>(null);
  const [editDateValue, setEditDateValue] = useState<Date>(new Date());
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    const p = await storage.getUserProfile();
    const cats = await storage.getCategoryBudgets();
    setProfile(p);
    setBudgets(cats);

    if (p) {
      // Tổng số dư = initialBalance. Số phân bổ = tổng các budget.
      const totalAllocated = cats.reduce((sum, c) => sum + c.budget, 0);
      setUnallocated(Math.max(0, p.initialBalance - totalAllocated));
    }
  };

  // --- Phân bổ tiền vào danh mục ---
  const openAllocModal = (cat: CategoryBudget) => {
    setSelectedCat(cat);
    setAllocAmount(0);
    setAllocType('deposit');
    setEstimatedEndDate(cat.estimatedEndDate ? new Date(cat.estimatedEndDate) : null);
    setAllocModalVisible(true);
  };

  const canEditEstimatedDate = (cat: CategoryBudget): boolean => {
    if (!cat.estimatedEndDateSetAt) return true;
    const cooldownMs = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - cat.estimatedEndDateSetAt >= cooldownMs;
  };

  const getDaysUntilCanEdit = (cat: CategoryBudget): number => {
    if (!cat.estimatedEndDateSetAt) return 0;
    const cooldownMs = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
    const remaining = cooldownMs - (Date.now() - cat.estimatedEndDateSetAt);
    return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
  };

  const handleAllocate = async () => {
    if (!selectedCat || allocAmount <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ.');
      return;
    }
    if (allocType === 'deposit' && allocAmount > unallocated) {
      Alert.alert('Không đủ tiền', `Số dư chưa phân bổ chỉ còn ${formatCurrency(unallocated)} đ.`);
      return;
    }
    if (allocType === 'withdraw' && allocAmount > selectedCat.budget) {
      Alert.alert('Không đủ tiền', `Danh mục này chỉ còn ${formatCurrency(selectedCat.budget)} đ.`);
      return;
    }

    // Kiểm tra ngày ước tính: nếu có chọn mới và được phép sửa
    let newEstimatedEndDate = selectedCat.estimatedEndDate;
    let newEstimatedEndDateSetAt = selectedCat.estimatedEndDateSetAt;

    if (estimatedEndDate !== null) {
      const dateTs = estimatedEndDate.getTime();
      const isDifferent = dateTs !== selectedCat.estimatedEndDate;
      const canEdit = canEditEstimatedDate(selectedCat);
      if (isDifferent && !canEdit) {
        Alert.alert(
          'Không thể sửa ngày',
          `Ngày ước tính chỉ có thể sửa sau ${getDaysUntilCanEdit(selectedCat)} ngày nữa.`
        );
        return;
      }
      if (isDifferent && canEdit) {
        newEstimatedEndDate = dateTs;
        newEstimatedEndDateSetAt = Date.now();
      }
    }

    const updated = budgets.map(b =>
      b.name === selectedCat.name
        ? {
            ...b,
            budget: allocType === 'deposit' ? b.budget + allocAmount : b.budget - allocAmount,
            estimatedEndDate: newEstimatedEndDate,
            estimatedEndDateSetAt: newEstimatedEndDateSetAt,
          }
        : b
    );
    const success = await storage.saveCategoryBudgets(updated);
    if (success) {
      setBudgets(updated);
      setUnallocated(prev => allocType === 'deposit' ? prev - allocAmount : prev + allocAmount);
      setAllocModalVisible(false);
      setAllocAmount(0);
      setEstimatedEndDate(null);
      Alert.alert('Thành công', `Đã ${allocType === 'deposit' ? 'nạp' : 'rút'} ${formatCurrency(allocAmount)} đ ${allocType === 'deposit' ? 'vào' : 'từ'} "${selectedCat.name}".`);
    }
  };

  // --- Thêm danh mục mới ---
  const handleAddCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    if (budgets.find(b => b.name === name)) {
      Alert.alert('Lỗi', 'Danh mục này đã tồn tại.');
      return;
    }
    const updated = [...budgets, { name, budget: 0 }];
    const success = await storage.saveCategoryBudgets(updated);
    if (success) {
      setBudgets(updated);
      setNewCatName('');
      setAddCatModalVisible(false);
    }
  };

  // --- Xóa danh mục ---
  const handleDeleteCategory = (cat: CategoryBudget) => {
    // Kiểm tra có giao dịch thuộc danh mục này không
    storage.getTransactions().then(txs => {
      const hasTx = txs.some(t => (t.categorySnapshot || t.category) === cat.name);
      const extraMsg = hasTx
        ? `\n\n⚠️ Danh mục này có giao dịch lịch sử. Các giao dịch đó sẽ được lưu trong danh mục "Khác" tại trang Thống kê.`
        : '';
      Alert.alert(
        'Xác nhận xóa',
        `Xóa danh mục "${cat.name}"? Số tiền ${formatCurrency(cat.budget)} đ sẽ được hoàn lại vào số dư chưa phân bổ.${extraMsg}`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xóa',
            style: 'destructive',
            onPress: async () => {
              const updated = budgets.filter(b => b.name !== cat.name);
              const success = await storage.saveCategoryBudgets(updated);
              if (success) {
                setBudgets(updated);
                setUnallocated(prev => prev + cat.budget);

                if (hasTx) {
                  const updatedTxs = txs.map(t => {
                    if ((t.categorySnapshot || t.category) === cat.name) {
                      return { ...t, category: 'Khác', categorySnapshot: cat.name };
                    }
                    return t;
                  });
                  await storage.updateTransactionsBulk(updatedTxs);
                }
              }
            }
          }
        ]
      );
    });
  };


  // --- Sửa ngày ước tính (YC 4) ---
  const openEditDateModal = (cat: CategoryBudget) => {
    if (!canEditEstimatedDate(cat)) {
      Alert.alert(
        'Chưa thể sửa',
        `Ngày ước tính chỉ có thể sửa sau ${getDaysUntilCanEdit(cat)} ngày nữa.`
      );
      return;
    }
    setEditDateTarget(cat);
    setEditDateValue(cat.estimatedEndDate ? new Date(cat.estimatedEndDate) : new Date());
    setEditDateModal(true);
  };

  const handleSaveEstimatedDate = async () => {
    if (!editDateTarget) return;
    const updated = budgets.map(b =>
      b.name === editDateTarget.name
        ? { ...b, estimatedEndDate: editDateValue.getTime(), estimatedEndDateSetAt: Date.now() }
        : b
    );
    const success = await storage.saveCategoryBudgets(updated);
    if (success) {
      setBudgets(updated);
      setEditDateModal(false);
      Alert.alert('Đã lưu', `Ngày ước tính tiêu hết của "${editDateTarget.name}" đã được cập nhật.`);
    }
  };

  const formatDateShort = (ts: number) => {
    const d = new Date(ts);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const totalBalance = budgets.reduce((sum, c) => sum + c.budget, 0) + unallocated;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Wallet color="#ffffff" size={26} />
          <Text style={styles.headerTitle}>Chia Tiền</Text>
        </View>

        <View style={styles.headerCards}>
          <View style={styles.headerCard}>
            <Text style={styles.headerCardLabel}>Số dư tổng</Text>
            <Text style={styles.headerCardValue}>{formatCurrency(totalBalance)} đ</Text>
          </View>
          <View style={styles.headerDivider} />
          <View style={styles.headerCard}>
            <Text style={styles.headerCardLabel}>Chưa phân bổ</Text>
            <Text style={[styles.headerCardValue, { color: unallocated <= 0 ? '#fca5a5' : '#fcd34d' }]}>
              {formatCurrency(unallocated)} đ
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Danh mục chi tiêu</Text>
          <TouchableOpacity style={styles.addCatBtn} onPress={() => setAddCatModalVisible(true)}>
            <PlusCircle color="#7c3aed" size={22} />
            <Text style={styles.addCatText}>Thêm</Text>
          </TouchableOpacity>
        </View>

        {budgets.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Chưa có danh mục nào. Nhấn "Thêm" để tạo.</Text>
          </View>
        ) : (
          budgets.map(cat => (
            <TouchableOpacity key={cat.name} style={styles.catCard} onPress={() => openAllocModal(cat)}>
              <View style={styles.catInfo}>
                <Text style={styles.catName}>{cat.name}</Text>
                <Text style={[styles.catBudget, { color: cat.budget <= 0 ? '#ef4444' : '#10b981' }]}>
                  {formatCurrency(cat.budget)} đ
                </Text>
                {/* Ngày ước tính tiêu hết (YC 4) */}
                <View style={styles.estimatedDateRow}>
                  <Calendar color={cat.estimatedEndDate ? '#7c3aed' : '#94a3b8'} size={13} />
                  {cat.estimatedEndDate ? (
                    <Text style={styles.estimatedDateText}>
                      Dự kiến hết: {formatDateShort(cat.estimatedEndDate)}
                      {!canEditEstimatedDate(cat) && (
                        <Text style={styles.cooldownHint}> (sửa sau {getDaysUntilCanEdit(cat)} ngày)</Text>
                      )}
                    </Text>
                  ) : (
                    <Text style={styles.estimatedDateEmpty}>Chưa đặt ngày ước tính • Chạm để đặt</Text>
                  )}
                </View>
              </View>
              <View style={styles.catActions}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteCategory(cat)}>
                  <Trash2 color="#ef4444" size={18} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* === Modal: Nạp tiền vào danh mục === */}
      <Modal
        visible={allocModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAllocModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Quản lý "{selectedCat?.name}"
              </Text>
              <TouchableOpacity onPress={() => setAllocModalVisible(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.allocTabs}>
              <TouchableOpacity 
                style={[styles.allocTab, allocType === 'deposit' && styles.allocTabActiveDeposit]} 
                onPress={() => setAllocType('deposit')}
              >
                <Text style={[styles.allocTabText, allocType === 'deposit' && styles.allocTabTextActive]}>Nạp thêm</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.allocTab, allocType === 'withdraw' && styles.allocTabActiveWithdraw]} 
                onPress={() => setAllocType('withdraw')}
              >
                <Text style={[styles.allocTabText, allocType === 'withdraw' && styles.allocTabTextActive]}>Rút ra</Text>
              </TouchableOpacity>
            </View>

            {allocType === 'deposit' ? (
              <Text style={styles.modalSubtitle}>
                Chưa phân bổ: <Text style={styles.modalHighlight}>{formatCurrency(unallocated)} đ</Text>
              </Text>
            ) : (
              <Text style={styles.modalSubtitle}>
                Số dư danh mục: <Text style={styles.modalHighlight}>{selectedCat ? formatCurrency(selectedCat.budget) : 0} đ</Text>
              </Text>
            )}

            <View style={styles.amountDisplay}>
              <Text style={styles.amountText}>{formatCurrency(allocAmount)}</Text>
              <Text style={styles.currencyLabel}>VNĐ</Text>
            </View>

            <Keypad
              amount={allocAmount}
              onAddAmount={(val) => setAllocAmount(prev => prev + val)}
              onClear={() => setAllocAmount(0)}
            />

            {/* Chọn ngày ước tính tiêu hết (YC 4) */}
            <View style={styles.datePickerSection}>
              <Text style={styles.datePickerLabel}>
                <Calendar color="#7c3aed" size={15} /> Ngày ước tính tiêu hết
              </Text>
              {selectedCat && !canEditEstimatedDate(selectedCat) ? (
                <View style={styles.dateLockedRow}>
                  <Text style={styles.dateLockedText}>
                    {selectedCat.estimatedEndDate
                      ? formatDateShort(selectedCat.estimatedEndDate)
                      : 'Chưa đặt'}
                  </Text>
                  <Text style={styles.cooldownHintBlock}>
                    Sửa được sau {getDaysUntilCanEdit(selectedCat!)} ngày
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.datePickerBtn}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Calendar color="#7c3aed" size={16} />
                  <Text style={styles.datePickerBtnText}>
                    {estimatedEndDate
                      ? formatDateShort(estimatedEndDate.getTime())
                      : 'Chọn ngày...'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={estimatedEndDate ?? new Date()}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(_, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) setEstimatedEndDate(date);
                }}
              />
            )}

            <TouchableOpacity style={[styles.confirmBtn, allocType === 'withdraw' && styles.confirmBtnWithdraw]} onPress={handleAllocate}>
              <Text style={styles.confirmBtnText}>{allocType === 'deposit' ? 'Xác nhận nạp' : 'Xác nhận rút'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* === Modal: Thêm danh mục === */}
      <Modal
        visible={addCatModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddCatModalVisible(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.inputModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm danh mục</Text>
              <TouchableOpacity onPress={() => setAddCatModalVisible(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Tên danh mục..."
              value={newCatName}
              onChangeText={setNewCatName}
              autoFocus
              onSubmitEditing={handleAddCategory}
            />
            <TouchableOpacity style={styles.confirmBtn} onPress={handleAddCategory}>
              <Text style={styles.confirmBtnText}>Tạo danh mục</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* === Modal: Sửa ngày ước tính (YC 4) === */}
      <Modal
        visible={editDateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setEditDateModal(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.inputModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ngày ước tính tiêu hết</Text>
              <TouchableOpacity onPress={() => setEditDateModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Danh mục: <Text style={styles.modalHighlight}>{editDateTarget?.name}</Text>
            </Text>

            <TouchableOpacity
              style={styles.datePickerBtn}
              onPress={() => setShowEditDatePicker(true)}
            >
              <Calendar color="#7c3aed" size={16} />
              <Text style={styles.datePickerBtnText}>
                {formatDateShort(editDateValue.getTime())}
              </Text>
            </TouchableOpacity>

            {showEditDatePicker && (
              <DateTimePicker
                value={editDateValue}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(_, date) => {
                  setShowEditDatePicker(Platform.OS === 'ios');
                  if (date) setEditDateValue(date);
                }}
              />
            )}

            <Text style={styles.cooldownInfo}>
              * Sau khi lưu, ngày này chỉ có thể sửa lại sau {COOLDOWN_DAYS} ngày.
            </Text>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveEstimatedDate}>
              <Text style={styles.confirmBtnText}>Lưu ngày</Text>
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
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#7c3aed',
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerCards: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  headerCard: {
    flex: 1,
  },
  headerDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 12,
  },
  headerCardLabel: {
    color: '#ede9fe',
    fontSize: 13,
    marginBottom: 4,
  },
  headerCardValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  addCatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ede9fe',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addCatText: {
    color: '#7c3aed',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    elevation: 1,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 15,
    textAlign: 'center',
  },
  catCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  catInfo: {
    flex: 1,
  },
  catName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  catBudget: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  estimatedDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  estimatedDateText: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '500',
  },
  estimatedDateEmpty: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  cooldownHint: {
    fontSize: 11,
    color: '#94a3b8',
  },
  catActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  allocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  allocBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  iconBtn: {
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
    justifyContent: 'flex-end',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  inputModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  modalHighlight: {
    color: '#7c3aed',
    fontWeight: '600',
  },
  amountDisplay: {
    backgroundColor: '#f5f3ff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  amountText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  currencyLabel: {
    fontSize: 18,
    color: '#64748b',
    marginLeft: 8,
    marginTop: 12,
  },
  // Date picker section (YC 4)
  datePickerSection: {
    marginTop: 16,
    marginBottom: 4,
  },
  datePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  datePickerBtnText: {
    color: '#7c3aed',
    fontWeight: '600',
    fontSize: 14,
  },
  dateLockedRow: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateLockedText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  cooldownHintBlock: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    fontStyle: 'italic',
  },
  cooldownInfo: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 12,
    fontStyle: 'italic',
  },
  confirmBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmBtnWithdraw: {
    backgroundColor: '#ef4444',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    marginBottom: 8,
  },
  allocTabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  allocTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  allocTabActiveDeposit: {
    backgroundColor: '#7c3aed',
  },
  allocTabActiveWithdraw: {
    backgroundColor: '#ef4444',
  },
  allocTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  allocTabTextActive: {
    color: '#ffffff',
  },
});

export default BudgetScreen;
