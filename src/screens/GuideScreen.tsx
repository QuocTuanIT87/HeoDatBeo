import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Wallet, PiggyBank, Plus, ArrowDown, ArrowUp, AlertCircle } from 'lucide-react-native';

const GuideScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color="#ffffff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hướng Dẫn Sử Dụng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.introBox}>
          <Text style={styles.introText}>
            Chào mừng bạn đến với Heo Đất Béo! Ứng dụng hoạt động theo nguyên tắc "Phân bổ phong bì" (Envelope Budgeting). Bạn sẽ luôn biết rõ mỗi đồng tiền của mình đang ở đâu và làm nhiệm vụ gì.
          </Text>
        </View>

        {/* MOCKUP 1: NẠP TIỀN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Nguồn tiền (Chưa phân bổ)</Text>
          <Text style={styles.guideText}>
            Khi bạn có thu nhập (nhận lương, thưởng...), bạn sẽ dùng nút <Text style={{fontWeight: 'bold'}}>Nạp Tiền</Text> ở Trang chủ. Số tiền này chưa được tiêu ngay, mà sẽ chạy vào giỏ <Text style={{fontWeight: 'bold'}}>Chưa phân bổ</Text>.
          </Text>
          
          <View style={styles.mockupContainer}>
            <View style={styles.mockCard}>
              <View style={styles.mockRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#eff6ff' }]}>
                  <Wallet color="#3b82f6" size={24} />
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.mockLabel}>Chưa phân bổ</Text>
                  <Text style={styles.mockValueBlue}>5,000,000 đ</Text>
                </View>
              </View>
              <View style={styles.mockBtnBlue}>
                <Plus color="#ffffff" size={16} />
                <Text style={styles.mockBtnText}> Nạp Tiền (Thu)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* MOCKUP 2: CHIA TIỀN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Chia Tiền (Lập ngân sách)</Text>
          <Text style={styles.guideText}>
            Sau khi có tiền Chưa phân bổ, bạn sang tab <Text style={{fontWeight: 'bold'}}>Chia Tiền</Text>. Tại đây, bạn rút tiền từ "Chưa phân bổ" để nạp vào các danh mục cụ thể (như Ăn uống, Xăng cộ). Khi nào các danh mục này có tiền thì bạn mới có thể "Chi tiêu" chúng.
          </Text>
          
          <View style={styles.mockupContainer}>
            <View style={styles.mockFlow}>
              <View style={styles.mockPillBlue}>
                <Text style={styles.mockPillText}>Chưa phân bổ: 5tr</Text>
              </View>
              <ArrowDown color="#94a3b8" size={20} style={{ marginVertical: 8 }} />
              
              <View style={styles.mockGrid}>
                <TouchableOpacity style={styles.mockCategory}>
                  <Text style={styles.mockCatName}>Ăn uống</Text>
                  <Text style={styles.mockCatValue}>3,000,000 đ</Text>
                  <View style={styles.mockActionBadge}>
                    <Text style={styles.mockActionBadgeText}>Nạp / Rút</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.mockCategory}>
                  <Text style={styles.mockCatName}>Xăng cộ</Text>
                  <Text style={styles.mockCatValue}>500,000 đ</Text>
                  <View style={styles.mockActionBadge}>
                    <Text style={styles.mockActionBadgeText}>Nạp / Rút</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* MOCKUP 3: CHI TIÊU */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Ghi chép Chi Tiêu</Text>
          <Text style={styles.guideText}>
            Khi đi ăn hay đổ xăng, bạn ấn <Text style={{fontWeight: 'bold'}}>Chi Tiền</Text> ở Trang chủ. Hệ thống sẽ trừ thẳng số tiền này vào ngân sách danh mục tương ứng. Bạn không thể chi lố số tiền đang có trong danh mục.
          </Text>

          <View style={styles.mockupContainer}>
             <View style={[styles.mockCard, { borderColor: '#fca5a5' }]}>
               <View style={styles.mockRow}>
                 <Text style={styles.mockLabelRed}>Ghi chi tiêu mới</Text>
               </View>
               <Text style={styles.mockGuideSubText}>Chọn danh mục: <Text style={{fontWeight: 'bold'}}>Ăn uống (Đang có: 3,000,000 đ)</Text></Text>
               <Text style={styles.mockGuideSubText}>Nhập số tiền: <Text style={{color: '#ef4444', fontWeight: 'bold'}}>- 50,000 đ</Text></Text>
             </View>
          </View>
        </View>

        {/* MOCKUP 4: HEO ĐẤT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Tiết kiệm (Heo Đất)</Text>
          <Text style={styles.guideText}>
            Tab <Text style={{fontWeight: 'bold'}}>Tiết Kiệm</Text> là két sắt dài hạn. Tiền nạp vào Heo Đất được lấy trực tiếp từ quỹ "Chưa phân bổ". Rút từ Heo Đất sẽ trả tiền ngược lại về "Chưa phân bổ".
          </Text>

          <View style={styles.mockupContainer}>
             <View style={styles.mockPiggyCard}>
               <PiggyBank color="#d946ef" size={32} />
               <View style={{ marginLeft: 16, flex: 1 }}>
                 <Text style={styles.mockCatName}>Quỹ Heo Đất</Text>
                 <Text style={[styles.mockValueBlue, { color: '#d946ef' }]}>15,000,000 đ</Text>
               </View>
             </View>
          </View>
        </View>

        {/* LƯU Ý KHÁC */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Một số lưu ý quan trọng</Text>
          <View style={styles.noteItem}>
            <AlertCircle color="#f59e0b" size={20} />
            <Text style={styles.noteText}>Bạn <Text style={{fontWeight: 'bold'}}>bắt buộc phải chọn một danh mục</Text> khi ghi chép Thu/Chi. Nếu không chọn danh mục có sẵn, hệ thống sẽ yêu cầu bạn nhập tên danh mục mới thì mới có thể lưu giao dịch.</Text>
          </View>
          <View style={styles.noteItem}>
            <AlertCircle color="#f59e0b" size={20} />
            <Text style={styles.noteText}>Để <Text style={{fontWeight: 'bold'}}>Quản lý danh mục thu tiền</Text> (thêm, bớt nguồn thu), bạn hãy vào tab Cài Đặt và chọn "Quản lý danh mục thu".</Text>
          </View>
          <View style={styles.noteItem}>
            <AlertCircle color="#f59e0b" size={20} />
            <Text style={styles.noteText}>Bạn chỉ có thể <Text style={{fontWeight: 'bold'}}>xóa</Text> giao dịch vừa tạo trong vòng <Text style={{color: '#ef4444'}}>5 phút</Text>. Sau thời gian này, giao dịch sẽ chốt sổ vĩnh viễn.</Text>
          </View>
          <View style={styles.noteItem}>
            <AlertCircle color="#f59e0b" size={20} />
            <Text style={styles.noteText}>Khi một danh mục bị xóa, toàn bộ lịch sử giao dịch của nó sẽ được tự động gom vào mục <Text style={{fontWeight: 'bold'}}>"Khác"</Text> trong bảng thống kê để đảm bảo số liệu tổng không bị sai lệch.</Text>
          </View>
          <View style={styles.noteItem}>
            <AlertCircle color="#f59e0b" size={20} />
            <Text style={styles.noteText}>Nên tạo tệp sao lưu (.txt) trong trang Cài Đặt thường xuyên để đề phòng mất dữ liệu.</Text>
          </View>
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scrollContent: {
    padding: 16,
  },
  introBox: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  introText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  guideText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 16,
  },
  mockupContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mockCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  mockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  mockLabelRed: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  mockValueBlue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginTop: 2,
  },
  mockBtnBlue: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  mockBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  mockFlow: {
    alignItems: 'center',
  },
  mockPillBlue: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  mockPillText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  mockGrid: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  mockCategory: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  mockCatName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  mockCatValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 4,
    marginBottom: 8,
  },
  mockActionBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mockActionBadgeText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'bold',
  },
  mockGuideSubText: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 8,
  },
  mockPiggyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fbcfe8',
  },
  noteItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  noteText: {
    fontSize: 14,
    color: '#451a03',
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  footerSpace: {
    height: 40,
  }
});

export default GuideScreen;
