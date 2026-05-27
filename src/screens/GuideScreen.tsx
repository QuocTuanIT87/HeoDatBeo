import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  Wallet,
  PiggyBank,
  Plus,
  ArrowDown,
  Layers,
  PlusCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  PieChart,
  BarChart3,
  Cloud,
  Upload,
  Download,
  RefreshCw,
  Trash2,
  Lock,
  ArrowRight,
} from "lucide-react-native";
import { styles } from "../styles/GuideScreen";

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
            Sau khi có tiền Chưa phân bổ, bạn sang màn hình{" "}
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
            Màn hình <Text style={{ fontWeight: "bold" }}>Tiết Kiệm</Text> là két sắt
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
            Màn hình <Text style={{ fontWeight: "bold" }}>Quỹ</Text> là trung tâm
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
              Quỹ khác
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
            <Text style={{ fontWeight: "bold" }}>"+ Thêm mới"</Text> trong màn hình
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

        {/* SECTION 7: SAO LƯU TỰ ĐỘNG BẰNG GOOGLE DRIVE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Sao lưu tự động bằng Google Drive</Text>
          <Text style={styles.guideText}>
            Hệ thống hỗ trợ tự động đồng bộ và sao lưu dữ liệu của bạn lên Google Drive cá nhân. 
            Khi bật tính năng này, ứng dụng sẽ tự động sao lưu định kỳ giúp bảo vệ an toàn tuyệt đối 
            cho tài sản dữ liệu của bạn, không lo thất lạc khi thay đổi thiết bị.
          </Text>

          <View style={styles.mockupContainer}>
            <View style={styles.mockCard}>
              <View style={styles.mockRow}>
                <View style={[styles.iconCircle, { backgroundColor: "#ecfeff" }]}>
                  <Cloud color="#0891b2" size={24} />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.mockLabel}>Sao lưu trực tuyến</Text>
                  <Text style={[styles.mockValueBlue, { color: "#0891b2", fontSize: 16 }]}>Đã liên kết Google Drive</Text>
                  <Text style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>heodatbeo.user@gmail.com</Text>
                </View>
              </View>
              
              <View style={{ borderTopWidth: 1, borderColor: "#f1f5f9", paddingTop: 12, marginTop: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155" }}>Tự động sao lưu hàng ngày</Text>
                    <Text style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Tự động chạy lúc 01:00 hàng ngày</Text>
                  </View>
                  {/* Fake Switch (ON) */}
                  <View style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: "#0891b2", padding: 2, justifyContent: "center", alignItems: "flex-end" }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#ffffff" }} />
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f0fdf4", padding: 8, borderRadius: 8, marginTop: 12 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e" }} />
                <Text style={{ fontSize: 12, color: "#16a34a", fontWeight: "500" }}>
                  Đồng bộ thành công: Hôm nay lúc 01:00
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* SECTION 8: SAO LƯU THỦ CÔNG */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Sao lưu và khôi phục thủ công</Text>
          <Text style={styles.guideText}>
            Bạn có thể chủ động sao lưu dữ liệu bất kỳ lúc nào bằng cách xuất dữ liệu ra file văn bản (`.txt`) đã mã hóa hoặc nhấn nút sao lưu thủ công lên Google Drive. Khi đổi máy hoặc cài lại ứng dụng, chỉ cần chọn nhập file để phục hồi 100% dữ liệu.
          </Text>

          <View style={styles.mockupContainer}>
            <View style={{ gap: 12 }}>
              <View style={styles.mockCard}>
                <Text style={styles.mockSectionLabel}>Sao lưu trực tuyến (Google Drive)</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                  <View style={[styles.mockBtnBlue, { flex: 1, backgroundColor: "#0ea5e9" }]}>
                    <Cloud color="#ffffff" size={16} />
                    <Text style={[styles.mockBtnText, { fontSize: 13 }]}> Sao lưu ngay</Text>
                  </View>
                  <View style={[styles.mockBtnBlue, { flex: 1, backgroundColor: "#3b82f6" }]}>
                    <RefreshCw color="#ffffff" size={16} />
                    <Text style={[styles.mockBtnText, { fontSize: 13 }]}> Khôi phục</Text>
                  </View>
                </View>
              </View>

              <View style={styles.mockCard}>
                <Text style={styles.mockSectionLabel}>Sao lưu ngoại tuyến (File .txt)</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                  <View style={[styles.mockBtnBlue, { flex: 1, backgroundColor: "#4f46e5" }]}>
                    <Upload color="#ffffff" size={16} />
                    <Text style={[styles.mockBtnText, { fontSize: 13 }]}> Xuất file .txt</Text>
                  </View>
                  <View style={[styles.mockBtnBlue, { flex: 1, backgroundColor: "#10b981" }]}>
                    <Download color="#ffffff" size={16} />
                    <Text style={[styles.mockBtnText, { fontSize: 13 }]}> Nhập file .txt</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* SECTION 9: BẮT BUỘC CHỌN DANH MỤC */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Bắt buộc chọn danh mục khi ghi chép</Text>
          <Text style={styles.guideText}>
            Để quản lý chi tiêu rõ ràng, bạn bắt buộc phải phân bổ từng giao dịch vào một danh mục cụ thể. 
            Nếu danh mục bạn cần chưa tồn tại, hãy tạo nhanh trực tiếp trong giao diện ghi chép.
          </Text>

          <View style={styles.mockupContainer}>
            <View style={styles.mockCard}>
              <Text style={[styles.mockSectionLabel, { color: "#dc2626" }]}>⚠️ Yêu cầu chọn danh mục</Text>
              
              <View style={{ backgroundColor: "#fee2e2", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#fca5a5", marginTop: 4, marginBottom: 12 }}>
                <Text style={{ fontSize: 13, color: "#991b1b", fontWeight: "500" }}>
                  Vui lòng nhập hoặc chọn danh mục để lưu giao dịch!
                </Text>
              </View>

              <Text style={{ fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6 }}>Tạo nhanh danh mục mới:</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1, height: 40, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, justifyContent: "center", paddingLeft: 12, backgroundColor: "#f8fafc" }}>
                  <Text style={{ color: "#94a3b8", fontSize: 13 }}>Tên danh mục mới (vd: Sửa xe)...</Text>
                </View>
                <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: "#3b82f6", justifyContent: "center", alignItems: "center" }}>
                  <Plus color="#ffffff" size={20} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* SECTION 10: QUẢN LÝ DANH MỤC THU TIỀN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Quản lý danh mục thu tiền</Text>
          <Text style={styles.guideText}>
            Bạn có thể tùy ý cá nhân hóa các nguồn thu nhập của mình (Lương, Thưởng, Bán hàng...) trong phần cài đặt danh mục. Hệ thống cho phép thêm mới danh mục nguồn thu và thay đổi biểu tượng đại diện cực kỳ đa dạng.
          </Text>

          <View style={styles.mockupContainer}>
            <View style={styles.mockCard}>
              <Text style={styles.mockSectionLabel}>Danh sách danh mục thu</Text>
              
              <View style={{ gap: 8, marginTop: 4 }}>
                {/* Item 1 */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderColor: "#f1f5f9" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#e0f2fe", justifyContent: "center", alignItems: "center" }}>
                      <Wallet color="#0ea5e9" size={16} />
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#334155" }}>Lương tháng</Text>
                  </View>
                  <Trash2 color="#94a3b8" size={18} />
                </View>

                {/* Item 2 */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderColor: "#f1f5f9" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#fef3c7", justifyContent: "center", alignItems: "center" }}>
                      <PlusCircle color="#d97706" size={16} />
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#334155" }}>Bán hàng online</Text>
                  </View>
                  <Trash2 color="#94a3b8" size={18} />
                </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, justifyContent: "center" }}>
                <PlusCircle color="#3b82f6" size={16} />
                <Text style={{ color: "#3b82f6", fontWeight: "bold", fontSize: 13 }}>Thêm danh mục thu mới</Text>
              </View>
            </View>
          </View>
        </View>

        {/* SECTION 11: GIỚI HẠN XÓA GIAO DỊCH */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Giới hạn thời gian sửa/xóa giao dịch</Text>
          <Text style={styles.guideText}>
            Để đảm bảo tính trung thực và kỷ luật của số liệu, các giao dịch chỉ được phép thay đổi hoặc xóa bỏ trong vòng <Text style={{ color: "#ef4444", fontWeight: "bold" }}>3 ngày</Text> kể từ thời điểm tạo. Sau thời hạn này, giao dịch sẽ chốt sổ khóa vĩnh viễn.
          </Text>

          <View style={styles.mockupContainer}>
            <View style={{ gap: 10 }}>
              {/* Giao dịch mới dưới 3 ngày */}
              <View style={[styles.mockCard, { borderColor: "#bbf7d0" }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: "bold", color: "#1e293b" }}>Ăn trưa (Mới tạo)</Text>
                    <Text style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Hôm nay lúc 12:15</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: "bold", color: "#ef4444" }}>- 45,000 đ</Text>
                    <View style={{ backgroundColor: "#dcfce7", padding: 4, borderRadius: 4 }}>
                      <Trash2 color="#16a34a" size={14} />
                    </View>
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: "#16a34a", marginTop: 6, fontWeight: "500" }}>✓ Có thể xóa (Còn 2 ngày 23 giờ)</Text>
              </View>

              {/* Giao dịch cũ trên 3 ngày */}
              <View style={[styles.mockCard, { borderColor: "#cbd5e1", backgroundColor: "#f8fafc" }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", opacity: 0.7 }}>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: "bold", color: "#475569" }}>Mua áo thun</Text>
                    <Text style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>5 ngày trước</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: "bold", color: "#64748b" }}>- 250,000 đ</Text>
                    <View style={{ backgroundColor: "#f1f5f9", padding: 4, borderRadius: 4 }}>
                      <Lock color="#94a3b8" size={14} />
                    </View>
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: "#64748b", marginTop: 6, fontWeight: "500" }}>🔒 Đã chốt sổ vĩnh viễn (Không thể xóa)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* SECTION 12: GOM GIAO DỊCH KHI XÓA DANH MỤC */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Tự động gom giao dịch khi xóa danh mục</Text>
          <Text style={styles.guideText}>
            Khi bạn quyết định xóa một danh mục chi tiêu, để tránh làm mất lịch sử và sai lệch biểu đồ báo cáo tài chính, toàn bộ các giao dịch cũ thuộc danh mục này sẽ tự động được gom và chuyển vào danh mục chung tên là <Text style={{ fontWeight: "bold" }}>"Khác"</Text>.
          </Text>

          <View style={styles.mockupContainer}>
            <View style={styles.mockCard}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <View style={{ alignItems: "center" }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#fee2e2", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#fca5a5" }}>
                    <Trash2 color="#ef4444" size={20} />
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: "bold", color: "#ef4444", marginTop: 6 }}>Đã xóa "Du lịch"</Text>
                </View>

                <ArrowRight color="#94a3b8" size={20} />

                <View style={{ alignItems: "center" }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#cbd5e1" }}>
                    <Layers color="#475569" size={20} />
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: "bold", color: "#475569", marginTop: 6 }}>Gom vào "Khác"</Text>
                </View>
              </View>

              <View style={{ backgroundColor: "#eff6ff", padding: 8, borderRadius: 6, marginTop: 12 }}>
                <Text style={{ fontSize: 11, color: "#1e40af", textAlign: "center", fontWeight: "500" }}>
                  ✓ Đảm bảo tổng chi tiêu trên các báo cáo luôn chính xác 100%
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default GuideScreen;
