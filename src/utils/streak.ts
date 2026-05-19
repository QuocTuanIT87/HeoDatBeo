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
  return Math.min(12, level); // giới hạn tạm thời ở 12 theo số lượng file ảnh hiện có
};

/**
 * Bản đồ các hình ảnh cấp độ ngọn lửa
 */
export const STREAK_LEVEL_IMAGES: Record<number, any> = {
  1: require('../../assets/series/level_1.png'),
  2: require('../../assets/series/level_2.png'),
  3: require('../../assets/series/level_3.png'),
  4: require('../../assets/series/level_4.png'),
  5: require('../../assets/series/level_5.png'),
  6: require('../../assets/series/level_6.png'),
  7: require('../../assets/series/level_7.png'),
  8: require('../../assets/series/level_8.png'),
  9: require('../../assets/series/level_9.png'),
  10: require('../../assets/series/level_10.png'),
  11: require('../../assets/series/level_11.png'),
  12: require('../../assets/series/level_12.png'),
};

/**
 * Lấy ảnh tương ứng cho cấp độ
 */
export const getStreakLevelImage = (level: number) => {
  const safeLevel = Math.max(1, Math.min(12, level));
  return STREAK_LEVEL_IMAGES[safeLevel];
};
