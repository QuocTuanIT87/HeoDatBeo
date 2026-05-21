export type StreakStatus = 'none' | 'increased' | 'preserved' | 'reset';

/**
 * Tính số ngày lịch chênh lệch giữa 2 timestamp (local timezone)
 */
export const getCalendarDaysDiff = (tsNew: number, tsOld: number): number => {
  const dNew = new Date(tsNew);
  const dOld = new Date(tsOld);

  const dNewZero = new Date(dNew.getFullYear(), dNew.getMonth(), dNew.getDate());
  const dOldZero = new Date(dOld.getFullYear(), dOld.getMonth(), dOld.getDate());

  const diffMs = dNewZero.getTime() - dOldZero.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

export const calculateNewStreak = (
  lastStreakTimestamp: number | undefined,
  currentStreakCount: number,
  txTimestamp: number,
  streakRecoveriesCount: number | undefined,
  lastRecoveryMonthYear: string | undefined
): {
  newStreakCount: number;
  status: StreakStatus;
  newRecoveriesCount: number;
  newRecoveryMonthYear: string;
} => {
  const currentStreak = currentStreakCount || 0;

  // Lấy chuỗi đại diện cho tháng/năm hiện tại của ngày giao dịch mới
  const txDate = new Date(txTimestamp);
  const mm = String(txDate.getMonth() + 1).padStart(2, '0');
  const yyyy = txDate.getFullYear();
  const currentMonthYearStr = `${mm}/${yyyy}`;

  // Kiểm tra đổi tháng để reset số lần khôi phục về 0
  const prevMonthYearStr = lastRecoveryMonthYear || '';
  let recoveriesCount = streakRecoveriesCount || 0;
  if (prevMonthYearStr !== currentMonthYearStr) {
    recoveriesCount = 0;
  }

  if (!lastStreakTimestamp) {
    // Chưa từng có chuỗi -> Khởi tạo chuỗi mới = 1
    return {
      newStreakCount: 1,
      status: 'reset',
      newRecoveriesCount: recoveriesCount,
      newRecoveryMonthYear: prevMonthYearStr || currentMonthYearStr,
    };
  }

  const diffInDays = getCalendarDaysDiff(txTimestamp, lastStreakTimestamp);

  if (diffInDays < 0) {
    // Giao dịch trong quá khứ -> Không ảnh hưởng đến chuỗi hiện tại
    return {
      newStreakCount: currentStreak,
      status: 'none',
      newRecoveriesCount: recoveriesCount,
      newRecoveryMonthYear: prevMonthYearStr || currentMonthYearStr,
    };
  }

  if (diffInDays === 0) {
    // Đã nhập trong hôm nay rồi -> không tăng chuỗi
    return {
      newStreakCount: currentStreak,
      status: 'none',
      newRecoveriesCount: recoveriesCount,
      newRecoveryMonthYear: prevMonthYearStr || currentMonthYearStr,
    };
  }

  if (diffInDays === 1) {
    // Liên tiếp -> cộng 1 chuỗi
    return {
      newStreakCount: currentStreak + 1,
      status: 'increased',
      newRecoveriesCount: recoveriesCount,
      newRecoveryMonthYear: prevMonthYearStr || currentMonthYearStr,
    };
  }

  if (diffInDays === 2 || diffInDays === 3) {
    // Bỏ lỡ 1 hoặc 2 ngày -> Khôi phục chuỗi nếu chưa quá 3 lần/tháng
    if (recoveriesCount < 3) {
      return {
        newStreakCount: Math.max(1, currentStreak),
        status: 'preserved',
        newRecoveriesCount: recoveriesCount + 1,
        newRecoveryMonthYear: currentMonthYearStr,
      };
    } else {
      // Đã dùng hết 3 lần khôi phục trong tháng -> Reset về 1
      return {
        newStreakCount: 1,
        status: 'reset',
        newRecoveriesCount: recoveriesCount,
        newRecoveryMonthYear: prevMonthYearStr,
      };
    }
  }

  // Quá 3 ngày không nhập (diffInDays >= 4) -> Reset chuỗi về 1
  return {
    newStreakCount: 1,
    status: 'reset',
    newRecoveriesCount: recoveriesCount,
    newRecoveryMonthYear: prevMonthYearStr || currentMonthYearStr,
  };
};

/**
 * Tính cấp độ ngọn lửa dựa trên số ngày chuỗi (cứ 30 ngày lên 1 cấp, tối đa 12 cấp hiện tại)
 */
export const getStreakLevel = (streakCount: number): number => {
  if (streakCount <= 0) return 1;
  const level = Math.floor((streakCount - 1) / 30) + 1;
  return Math.min(18, level); // giới hạn ở 18 theo hệ thống cấp độ mới
};

/**
 * Bản đồ các hình ảnh cấp độ ngọn lửa
 */
export const STREAK_LEVEL_IMAGES: Record<number, any> = {
  1: require('../../assets/series/gif/level/level_1.gif'),
  2: require('../../assets/series/gif/level/level_2.gif'),
  3: require('../../assets/series/gif/level/level_3.gif'),
  4: require('../../assets/series/gif/level/level_4.gif'),
  5: require('../../assets/series/gif/level/level_5.gif'),
  6: require('../../assets/series/gif/level/level_6.gif'),
  7: require('../../assets/series/gif/level/level_7.gif'),
  8: require('../../assets/series/gif/level/level_8.gif'),
  9: require('../../assets/series/gif/level/level_9.gif'),
  10: require('../../assets/series/gif/level/level_10.gif'),
  11: require('../../assets/series/gif/level/level_11.gif'),
  12: require('../../assets/series/gif/level/level_12.gif'),
  13: require('../../assets/series/gif/level/level_13.gif'),
  14: require('../../assets/series/gif/level/level_14.gif'),
  15: require('../../assets/series/gif/level/level_15.gif'),
  16: require('../../assets/series/gif/level/level_16.gif'),
  17: require('../../assets/series/gif/level/level_17.gif'),
  18: require('../../assets/series/gif/level/level_18.gif'),
};

export interface StreakLevelInfo {
  name: string;
  description: string;
}

export const STREAK_LEVELS: Record<number, StreakLevelInfo> = {
  1: { name: "Khai Tài Cảnh", description: "Bắt đầu nhận thức về tiền bạc, hiểu giá trị đồng tiền." },
  2: { name: "Tụ Khố Cảnh", description: "Biết tiết kiệm, tích lũy tài nguyên." },
  3: { name: "Lý Kim Cảnh", description: "Bắt đầu quản lý thu chi, kiểm soát dòng tiền." },
  4: { name: "Minh Trướng Cảnh", description: "Sổ sách minh bạch, hiểu cấu trúc tài chính cá nhân." },
  5: { name: "Ngự Chi Cảnh", description: "Làm chủ chi tiêu, không còn tiêu tiền cảm tính." },
  6: { name: "Dư Tài Cảnh", description: "Xuất hiện dòng tiền dư, có tài sản tích lũy thực sự." },
  7: { name: "Sinh Tức Cảnh", description: "Biết khiến tiền sinh lời." },
  8: { name: "Tài Mạch Cảnh", description: "Hiểu các dòng chảy tài chính và cơ hội tài vận." },
  9: { name: "Hóa Phú Cảnh", description: "Tài sản tăng trưởng mạnh, bắt đầu chuyển hóa thành của cải lớn." },
  10: { name: "Ngưng Khố Cảnh", description: "Tài sản hình thành “kho nội lực” vững chắc." },
  11: { name: "Chưởng Tài Cảnh", description: "Có năng lực điều phối tiền bạc và tài nguyên." },
  12: { name: "Tài Hải Cảnh", description: "Dòng tiền lớn như biển, nhiều nguồn thu nhập." },
  13: { name: "Kim Đan Cảnh", description: "“Tài đạo” ngưng tụ thành hệ thống ổn định." },
  14: { name: "Phú Linh Cảnh", description: "Tiền bạc vận hành như có linh tính, đầu tư sắc bén." },
  15: { name: "Thiên Khố Cảnh", description: "Sở hữu nền tảng tài sản cực lớn." },
  16: { name: "Tài Vương Cảnh", description: "Đứng đầu một phương về tài lực." },
  17: { name: "Phú Thiên Cảnh", description: "Tài lực ảnh hưởng tới đại cục, phú khả địch quốc." },
  18: { name: "Thiên Đạo Tài Tôn", description: "Cảnh giới tối cao, thấu hiểu quy luật vận hành của tài phú và tài vận." }
};

export const getStreakLevelInfo = (level: number): StreakLevelInfo => {
  const safeLevel = Math.max(1, Math.min(18, level));
  return STREAK_LEVELS[safeLevel];
};

/**
 * Lấy ảnh tương ứng cho cấp độ
 */
export const getStreakLevelImage = (level: number) => {
  const safeLevel = Math.max(1, Math.min(18, level));
  return STREAK_LEVEL_IMAGES[safeLevel];
};
