import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  Wallet,
  PiggyBank,
  Plus,
  ArrowDown,
  ArrowUp,
  AlertCircle,
  Layers,
  PlusCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  PieChart,
  BarChart3,
} from "lucide-react-native";

const GuideScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft color="#ffffff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hướng Dẫn Sử Dụng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.introBox}>
          <Text style={styles.introText}>
            Chào mừng bạn đến với Heo Đất Béo! Ứng dụng hoạt động theo nguyên
            tắc "Phân bổ phong bì" (Envelope Budgeting). Bạn sẽ luôn biết rõ mỗi
            đồng tiền của mình đang ở đâu và làm nhiệm vụ gì.
          </Text>
        </View>

        {/* MOCKUP 1: NẠP TIỀN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Nguồn tiền (Chưa phân bổ)</Text>
          <Text style={styles.guideText}>
            Khi bạn có thu nhập (nhận lương, thưởng...), bạn sẽ dùng nút{" "}
            <Text style={{ fontWeight: "bold" }}>Nạp Tiền</Text> ở Trang chủ. Số
            tiền này chưa được tiêu ngay, mà sẽ chạy vào giỏ{" "}
            <Text style={{ fontWeight: "bold" }}>Chưa phân bổ</Text>.
          </Text>

          <View style={styles.mockupContainer}>
            <View style={styles.mockCard}>
              <View style={styles.mockRow}>
                <View
                  style={[styles.iconCircle, { backgroundColor: "#eff6ff" }]}
                >
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
            Sau khi có tiền Chưa phân bổ, bạn sang tab{" "}
            <Text style={{ fontWeight: "bold" }}>Chia Tiền</Text> để lập kế
            hoạch chi tiêu. Hệ thống hỗ trợ 2 loại danh mục:
          </Text>

          <View style={styles.noteItem}>
            <Layers color="#7c3aed" size={20} />
            <Text style={styles.noteText}>
              <Text style={{ fontWeight: "bold", color: "#7c3aed" }}>
                1. Danh mục Cần nạp tiền:
              </Text>{" "}
              Giống như một phong bì tiền mặt. Bạn phải nạp tiền vào phong bì
              này trước khi tiêu. Tiền tiêu sẽ trừ vào số dư trong phong bì đó.
              (Vd: Ăn uống, Xăng xe).
            </Text>
          </View>

          <View
            style={[
              styles.noteItem,
              { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" },
            ]}
          >
            <PlusCircle color="#3b82f6" size={20} />
            <Text style={[styles.noteText, { color: "#1e40af" }]}>
              <Text style={{ fontWeight: "bold", color: "#3b82f6" }}>
                2. Danh mục Chi trực tiếp:
              </Text>{" "}
              Tiền sẽ được trừ trực tiếp từ giỏ{" "}
              <Text style={{ fontWeight: "bold" }}>"Chưa phân bổ"</Text>. Bạn
              không cần nạp tiền vào danh mục này.
            </Text>
          </View>

          <View style={styles.mockupContainer}>
            <View style={styles.mockFlow}>
              <View style={styles.mockPillBlue}>
                <Text style={styles.mockPillText}>Chưa phân bổ: 5tr</Text>
              </View>
              <ArrowDown
                color="#94a3b8"
                size={20}
                style={{ marginVertical: 8 }}
              />

              <View style={styles.mockGrid}>
                <TouchableOpacity style={styles.mockCategory}>
                  <Text style={styles.mockCatName}>Ăn uống (Nạp)</Text>
                  <Text style={styles.mockCatValue}>3,000,000 đ</Text>
                  <View style={styles.mockActionBadge}>
                    <Text style={styles.mockActionBadgeText}>Đã nạp</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mockCategory, { borderColor: "#3b82f6" }]}
                >
                  <Text style={styles.mockCatName}>Thuê nhà </Text>
                  <Text style={[styles.mockCatValue, { color: "#3b82f6" }]}>
                    - Trực tiếp -
                  </Text>
                  <View
                    style={[
                      styles.mockActionBadge,
                      { backgroundColor: "#dbeafe" },
                    ]}
                  >
                    <Text
                      style={[styles.mockActionBadgeText, { color: "#3b82f6" }]}
                    >
                      Dùng tiền chưa phân bổ
                    </Text>
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
            Khi đi ăn hay đổ xăng, bạn ấn{" "}
            <Text style={{ fontWeight: "bold" }}>Chi Tiền</Text> ở Trang chủ. Hệ
            thống sẽ trừ thẳng số tiền này vào ngân sách danh mục tương ứng. Bạn
            không thể chi lố số tiền đang có trong danh mục.
          </Text>

          <View style={styles.mockupContainer}>
            <View style={[styles.mockCard, { borderColor: "#fca5a5" }]}>
              <View style={styles.mockRow}>
                <Text style={styles.mockLabelRed}>Ghi chi tiêu mới</Text>
              </View>
              <Text style={styles.mockGuideSubText}>
                Chọn danh mục:{" "}
                <Text style={{ fontWeight: "bold" }}>
                  Ăn uống (Đang có: 3,000,000 đ)
                </Text>
              </Text>
              <Text style={styles.mockGuideSubText}>
                Nhập số tiền:{" "}
                <Text style={{ color: "#ef4444", fontWeight: "bold" }}>
                  - 50,000 đ
                </Text>
              </Text>
            </View>
          </View>
        </View>

        {/* MOCKUP 4: HEO ĐẤT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Tiết kiệm (Heo Đất)</Text>
          <Text style={styles.guideText}>
            Tab <Text style={{ fontWeight: "bold" }}>Tiết Kiệm</Text> là két sắt
            dài hạn. Tiền nạp vào Heo Đất được lấy trực tiếp từ quỹ "Chưa phân
            bổ". Rút từ Heo Đất sẽ trả tiền ngược lại về "Chưa phân bổ".
          </Text>

          <View style={styles.mockupContainer}>
            <View style={styles.mockPiggyCard}>
              <PiggyBank color="#d946ef" size={32} />
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text style={styles.mockCatName}>Quỹ Heo Đất</Text>
                <Text style={[styles.mockValueBlue, { color: "#d946ef" }]}>
                  15,000,000 đ
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* MOCKUP 5: QUẢN LÝ QUỸ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            5. Quản lý Quỹ (Phân chia quỹ)
          </Text>
          <Text style={styles.guideText}>
            Tab <Text style={{ fontWeight: "bold" }}>Quỹ</Text> là trung tâm
            điều phối tài chính. Toàn bộ tiền của bạn được phân chia vào các
            "quỹ" với mục đích riêng biệt, giúp bạn luôn biết tiền đang ở đâu.
          </Text>

          {/* Sơ đồ phân bổ */}
          <View style={styles.mockupContainer}>
            <Text style={styles.mockSectionLabel}>📊 Tổng tài sản</Text>
            <View style={styles.mockTotalBar}>
              <Text style={styles.mockTotalAmount}>12,500,000 đ</Text>
            </View>

            <ArrowDown
              color="#94a3b8"
              size={20}
              style={{ alignSelf: "center", marginVertical: 8 }}
            />

            {/* Quỹ mặc định */}
            <Text style={styles.mockGroupLabel}>Quỹ mặc định</Text>
            <View style={styles.mockFundRow}>
              <View style={[styles.mockFundCard, { borderColor: "#e9d5ff" }]}>
                <View
                  style={[styles.mockFundIcon, { backgroundColor: "#f3e8ff" }]}
                >
                  <Layers color="#a855f7" size={18} />
                </View>
                <Text style={styles.mockFundName}>Tiêu Sài</Text>
                <Text style={[styles.mockFundBalance, { color: "#a855f7" }]}>
                  3,500,000 đ
                </Text>
              </View>
              <View style={[styles.mockFundCard, { borderColor: "#fde68a" }]}>
                <View
                  style={[styles.mockFundIcon, { backgroundColor: "#fef3c7" }]}
                >
                  <PiggyBank color="#f59e0b" size={18} />
                </View>
                <Text style={styles.mockFundName}>Tiết Kiệm</Text>
                <Text style={[styles.mockFundBalance, { color: "#f59e0b" }]}>
                  4,000,000 đ
                </Text>
              </View>
            </View>

            {/* Quỹ tùy chỉnh */}
            <Text style={[styles.mockGroupLabel, { marginTop: 12 }]}>
              Quỹ tùy chỉnh
            </Text>
            <View style={styles.mockFundRow}>
              <View style={[styles.mockFundCard, { borderColor: "#bae6fd" }]}>
                <View
                  style={[styles.mockFundIcon, { backgroundColor: "#e0f2fe" }]}
                >
                  <Wallet color="#0ea5e9" size={18} />
                </View>
                <Text style={styles.mockFundName}>Quỹ Du Lịch</Text>
                <Text style={[styles.mockFundBalance, { color: "#0ea5e9" }]}>
                  2,000,000 đ
                </Text>
              </View>
              <View style={[styles.mockFundCard, { borderColor: "#bbf7d0" }]}>
                <View
                  style={[styles.mockFundIcon, { backgroundColor: "#dcfce7" }]}
                >
                  <Wallet color="#22c55e" size={18} />
                </View>
                <Text style={styles.mockFundName}>Quỹ Khẩn Cấp</Text>
                <Text style={[styles.mockFundBalance, { color: "#22c55e" }]}>
                  3,000,000 đ
                </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.guideText, { marginTop: 16 }]}>
            Mỗi quỹ tùy chỉnh có thể được{" "}
            <Text style={{ fontWeight: "bold" }}>nạp tiền</Text> từ "Chưa phân
            bổ" hoặc <Text style={{ fontWeight: "bold" }}>rút tiền</Text> về lại
            "Chưa phân bổ" bất kỳ lúc nào.
          </Text>

          {/* Mockup nạp/rút quỹ */}
          <View style={styles.mockupContainer}>
            <Text style={styles.mockSectionLabel}>
              💸 Nạp / Rút quỹ tùy chỉnh
            </Text>
            <View style={styles.mockTransferBox}>
              <View style={styles.mockTransferRow}>
                <View style={styles.mockTransferBtn}>
                  <ArrowDownCircle color="#10b981" size={20} />
                  <Text style={[styles.mockTransferText, { color: "#10b981" }]}>
                    Nạp tiền
                  </Text>
                </View>
                <View style={styles.mockTransferDivider} />
                <View style={styles.mockTransferBtn}>
                  <ArrowUpCircle color="#ef4444" size={20} />
                  <Text style={[styles.mockTransferText, { color: "#ef4444" }]}>
                    Rút tiền
                  </Text>
                </View>
              </View>
              <Text style={styles.mockTransferNote}>
                Nạp: Chưa phân bổ → Quỹ{""}Rút: Quỹ → Chưa phân bổ
              </Text>
            </View>
          </View>

          <Text style={[styles.guideText, { marginTop: 16 }]}>
            Để tạo quỹ mới, nhấn nút{" "}
            <Text style={{ fontWeight: "bold" }}>"+ Thêm mới"</Text> trong tab
            Quỹ. Tên quỹ phải bắt đầu bằng chữ{" "}
            <Text style={{ fontWeight: "bold" }}>"Quỹ"</Text> (vd: Quỹ Du Lịch,
            Quỹ Khẩn Cấp...). Xóa quỹ sẽ hoàn toàn bộ số dư về "Chưa phân bổ".
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Thống kê trực quan</Text>
          <Text style={styles.guideText}>
            Ứng dụng tự động tổng hợp và vẽ biểu đồ từ lịch sử chi tiêu của bạn,
            giúp bạn nhận diện những "lỗ hổng" tài chính dễ dàng.
          </Text>

          <View style={styles.mockupContainer}>
            <View style={styles.mockChartBox}>
              <View style={styles.mockChartHeader}>
                <PieChart color="#7c3aed" size={20} />
                <Text style={styles.mockChartTitle}>Cơ cấu chi tiêu</Text>
              </View>

              <View style={styles.mockPieContainer}>
                <View style={styles.mockPieCircle}>
                  <PieChart color="#7c3aed" size={40} />
                </View>
                <View style={styles.mockLegend}>
                  <View style={styles.mockLegendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: "#7c3aed" }]}
                    />
                    <Text style={styles.legendText}>Ăn uống: 60%</Text>
                  </View>
                  <View style={styles.mockLegendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: "#10b981" }]}
                    />
                    <Text style={styles.legendText}>Tiền nhà: 25%</Text>
                  </View>
                  <View style={styles.mockLegendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: "#f59e0b" }]}
                    />
                    <Text style={styles.legendText}>Khác: 15%</Text>
                  </View>
                </View>
              </View>

              <View style={styles.mockBarContainer}>
                <View style={styles.mockBarHeader}>
                  <BarChart3 color="#3b82f6" size={18} />
                  <Text style={styles.mockChartTitleSmall}>Thu vs Chi</Text>
                </View>
                <View style={styles.mockBarRow}>
                  <View style={styles.mockBarTrack}>
                    <View
                      style={[
                        styles.mockBarFill,
                        { width: "80%", backgroundColor: "#10b981" },
                      ]}
                    />
                  </View>
                  <Text style={styles.mockBarLabel}>Thu</Text>
                </View>
                <View style={styles.mockBarRow}>
                  <View style={styles.mockBarTrack}>
                    <View
                      style={[
                        styles.mockBarFill,
                        { width: "45%", backgroundColor: "#ef4444" },
                      ]}
                    />
                  </View>
                  <Text style={styles.mockBarLabel}>Chi</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* LƯU Ý KHÁC */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Một số lưu ý quan trọng</Text>
          <View style={styles.noteItem}>
            <AlertCircle color="#f59e0b" size={20} />
            <Text style={styles.noteText}>
              Bạn{" "}
              <Text style={{ fontWeight: "bold" }}>
                bắt buộc phải chọn một danh mục
              </Text>{" "}
              khi ghi chép Thu/Chi. Nếu không chọn danh mục có sẵn, hệ thống sẽ
              yêu cầu bạn nhập tên danh mục mới thì mới có thể lưu giao dịch.
            </Text>
          </View>
          <View style={styles.noteItem}>
            <AlertCircle color="#f59e0b" size={20} />
            <Text style={styles.noteText}>
              Để{" "}
              <Text style={{ fontWeight: "bold" }}>
                Quản lý danh mục thu tiền
              </Text>{" "}
              (thêm, bớt nguồn thu), bạn hãy vào tab Cài Đặt và chọn "Quản lý
              danh mục thu".
            </Text>
          </View>
          <View style={styles.noteItem}>
            <AlertCircle color="#f59e0b" size={20} />
            <Text style={styles.noteText}>
              Bạn chỉ có thể <Text style={{ fontWeight: "bold" }}>xóa</Text>{" "}
              giao dịch vừa tạo trong vòng{" "}
              <Text style={{ color: "#ef4444" }}>3 ngày</Text>. Sau thời gian
              này, giao dịch sẽ chốt sổ vĩnh viễn.
            </Text>
          </View>
          <View style={styles.noteItem}>
            <AlertCircle color="#f59e0b" size={20} />
            <Text style={styles.noteText}>
              Khi một danh mục bị xóa, toàn bộ lịch sử giao dịch của nó sẽ được
              tự động gom vào mục{" "}
              <Text style={{ fontWeight: "bold" }}>"Khác"</Text> trong bảng
              thống kê để đảm bảo số liệu tổng không bị sai lệch.
            </Text>
          </View>
          <View style={styles.noteItem}>
            <AlertCircle color="#f59e0b" size={20} />
            <Text style={styles.noteText}>
              Nên tạo tệp sao lưu (.txt) trong trang Cài Đặt thường xuyên để đề
              phòng mất dữ liệu.
            </Text>
          </View>
          <View style={styles.noteItem}>
            <AlertCircle color="#f59e0b" size={20} />
            <Text style={styles.noteText}>
              Khi <Text style={{ fontWeight: "bold" }}>xóa quỹ tùy chỉnh</Text>,
              toàn bộ số dư trong quỹ đó sẽ được hoàn tự động về{" "}
              <Text style={{ fontWeight: "bold" }}>\"Chưa phân bổ\"</Text>. Bạn
              cần nhập đúng cú pháp{" "}
              <Text style={{ color: "#ef4444" }}>DELETE [Tên quỹ]</Text> để xác
              nhận.
            </Text>
          </View>
          <View style={styles.noteItem}>
            <AlertCircle color="#f59e0b" size={20} />
            <Text style={styles.noteText}>
              Xem{" "}
              <Text style={{ fontWeight: "bold" }}>lịch sử giao dịch quỹ</Text>{" "}
              bằng cách nhấn icon{" "}
              <Text style={{ fontWeight: "bold" }}>đồng hồ 🕐</Text> ở góc phải
              màn hình Quỹ. Các giao dịch này chỉ dùng để lưu vết, không thể
              xóa.
            </Text>
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
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#3b82f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === "android" ? 40 : 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  scrollContent: {
    padding: 16,
  },
  introBox: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  introText: {
    fontSize: 15,
    color: "#334155",
    lineHeight: 22,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
  },
  guideText: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
    marginBottom: 16,
  },
  mockupContainer: {
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  mockCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  mockRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  mockLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  mockLabelRed: {
    fontSize: 16,
    color: "#ef4444",
    fontWeight: "bold",
  },
  mockValueBlue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3b82f6",
    marginTop: 2,
  },
  mockBtnBlue: {
    backgroundColor: "#3b82f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  mockBtnText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 15,
  },
  mockFlow: {
    alignItems: "center",
  },
  mockPillBlue: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  mockPillText: {
    color: "#fff",
    fontWeight: "bold",
  },
  mockGrid: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  mockCategory: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  mockCatName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  mockCatValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#10b981",
    marginTop: 4,
    marginBottom: 8,
  },
  mockActionBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mockActionBadgeText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "bold",
    textAlign: "center",
  },
  mockGuideSubText: {
    fontSize: 14,
    color: "#334155",
    marginBottom: 8,
  },
  mockPiggyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fbcfe8",
  },
  noteItem: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
    backgroundColor: "#fffbeb",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  noteText: {
    fontSize: 14,
    color: "#451a03",
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
  footerSpace: {
    height: 40,
  },
  mockSectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  mockTotalBar: {
    backgroundColor: "#1e293b",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 4,
  },
  mockTotalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  mockGroupLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  mockFundRow: {
    flexDirection: "row",
    gap: 10,
  },
  mockFundCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1.5,
  },
  mockFundIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  mockFundName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 4,
    textAlign: "center",
  },
  mockFundBalance: {
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
  },
  mockTransferBox: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  mockTransferRow: {
    flexDirection: "row",
  },
  mockTransferBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
  },
  mockTransferDivider: {
    width: 1,
    backgroundColor: "#e2e8f0",
  },
  mockTransferText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  mockTransferNote: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
    lineHeight: 18,
  },
  mockChartBox: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  mockChartHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  mockChartTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0f172a",
  },
  mockPieContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  mockPieCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  mockLegend: {
    gap: 4,
  },
  mockLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: "#475569",
  },
  mockBarContainer: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
  },
  mockBarHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  mockChartTitleSmall: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#334155",
  },
  mockBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  mockBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    overflow: "hidden",
  },
  mockBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  mockBarLabel: {
    width: 30,
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
});

export default GuideScreen;
