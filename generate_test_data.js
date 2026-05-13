const fs = require('fs');

const profile = {
  name: "Test User",
  initialBalance: 50000000,
  initialBalanceTimestamp: Date.now() - 365 * 24 * 60 * 60 * 1000,
  incomeCategories: ['Lương', 'Thưởng', 'Bán hàng', 'Khác'],
};

const categoryBudgets = [
  { name: 'Ăn uống', budget: 5000000, spent: 0 },
  { name: 'Xăng cộ', budget: 1000000, spent: 0 },
  { name: 'Grab', budget: 500000, spent: 0 },
  { name: 'Tiền Trọ', budget: 3000000, spent: 0 },
  { name: 'Mua sắm', budget: 2000000, spent: 0 },
  { name: 'Giải trí', budget: 1000000, spent: 0 },
];

const expenseCats = ['Ăn uống', 'Xăng cộ', 'Grab', 'Tiền Trọ', 'Mua sắm', 'Giải trí', 'Khác'];
const incomeCats = ['Lương', 'Thưởng', 'Bán hàng', 'Khác'];

// Ghi chú theo danh mục — phong phú để test biểu đồ theo ghi chú
const notesByCategory = {
  'Ăn uống': [
    'Bún bò Huế', 'Cơm văn phòng', 'Phở gà sáng', 'Trà sữa Gong Cha', 'Pizza Domino',
    'Cơm tấm sườn', 'Bánh mì thịt', 'KFC bữa trưa', 'Lẩu cùng bạn bè', 'Sinh tố bơ',
    'Sushi Japan', 'Bún đậu mắm tôm', 'Gà rán Texas', 'Cháo dinh dưỡng', 'Mì Ý',
    null, null, // 2/17 cơ hội không có ghi chú
  ],
  'Xăng cộ': [
    'Đổ xăng A95', 'Đổ xăng E5', 'Xăng đầu tuần', 'Xăng về quê', 'Đổ xăng 50k',
    'Đổ xăng đầy bình', 'Xăng đi làm',
    null, null,
  ],
  'Grab': [
    'Grab đi làm sáng', 'Grab về nhà tối', 'Grab đi siêu thị', 'Grab đi khám bệnh',
    'GrabFood trưa', 'Grab đi tiệc', 'Grab đón bạn',
    null, null,
  ],
  'Tiền Trọ': [
    'Tiền phòng tháng này', 'Tiền điện', 'Tiền nước', 'Tiền internet VNPT',
    'Tiền rác tháng', 'Tiền điện điều hòa',
    null,
  ],
  'Mua sắm': [
    'Quần áo Zara', 'Giày Nike sale', 'Áo khoác mùa đông', 'Túi xách', 'Đồng hồ Casio',
    'Mỹ phẩm The Body Shop', 'Laptop phụ kiện', 'Tai nghe JBL', 'Sạc dự phòng',
    'Bàn phím cơ', 'Chuột gaming', 'Màn hình 27 inch',
    null, null, null,
  ],
  'Giải trí': [
    'Xem phim Avengers', 'Netflix tháng', 'Spotify Premium', 'Vé concert Sơn Tùng',
    'Game Steam', 'Bowling cùng nhóm', 'Karaoke cuối tuần', 'Escape Room',
    'Vé xem bóng đá', 'Cà phê làm việc',
    null, null,
  ],
  'Khác': [
    'Thuốc cảm cúm', 'Khám sức khỏe định kỳ', 'Phí giao dịch ngân hàng',
    'Quà sinh nhật bạn', 'Sửa xe máy', 'Cắt tóc', 'Tiền vé xe buýt',
    'Sách kỹ năng', 'Khóa học online', 'Đồng phục công ty',
    null, null,
  ],
  'Lương': ['Lương tháng', 'Lương thưởng KPI', null],
  'Thưởng': ['Thưởng tết', 'Thưởng dự án', 'Thưởng hiệu suất', null],
  'Bán hàng': ['Bán đồ cũ Shopee', 'Bán quần áo', 'Thanh lý laptop cũ', null],
};

const getNote = (category) => {
  const notes = notesByCategory[category] || [null];
  return notes[Math.floor(Math.random() * notes.length)] || undefined;
};

const transactions = [];
const now = Date.now();
const oneYearMs = 365 * 24 * 60 * 60 * 1000;

for (let i = 0; i < 10000; i++) {
  const isExpense = Math.random() > 0.2; // 80% chi, 20% thu
  const type = isExpense ? 'expense' : 'income';

  // Random số tiền chẵn
  const amount = isExpense
    ? (Math.floor(Math.random() * 50) + 1) * 10000
    : (Math.floor(Math.random() * 100) + 5) * 100000;

  const cats = isExpense ? expenseCats : incomeCats;
  const category = cats[Math.floor(Math.random() * cats.length)];
  const note = getNote(category);

  const timestamp = now - Math.floor(Math.random() * oneYearMs);

  const tx = {
    id: `test_tx_${i}_${Math.random().toString(36).substr(2, 5)}`,
    type,
    amount,
    category,
    categorySnapshot: category,
    name: type === 'income' ? `Thu nhập ${i}` : `Chi tiêu ${i}`,
    timestamp,
  };

  if (note) tx.note = note;

  transactions.push(tx);
}

// Sắp xếp giảm dần theo thời gian
transactions.sort((a, b) => b.timestamp - a.timestamp);

// Thống kê ghi chú
const withNote = transactions.filter(t => t.note).length;
const withoutNote = transactions.filter(t => !t.note).length;
console.log(`Tổng: ${transactions.length} giao dịch`);
console.log(`Có ghi chú: ${withNote} (${((withNote/transactions.length)*100).toFixed(1)}%)`);
console.log(`Không ghi chú: ${withoutNote} (${((withoutNote/transactions.length)*100).toFixed(1)}%)`);

const exportData = {
  profile,
  transactions,
  categoryBudgets
};

fs.writeFileSync('test_10000_giao_dich.txt', JSON.stringify(exportData), 'utf8');
console.log('\nFile created: test_10000_giao_dich.txt');
console.log(`Kích thước: ${(fs.statSync('test_10000_giao_dich.txt').size / 1024 / 1024).toFixed(2)} MB`);
