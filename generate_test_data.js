const fs = require('fs');

const profile = {
  name: "Test User",
  initialBalance: 50000000,
  initialBalanceTimestamp: Date.now() - 365 * 24 * 60 * 60 * 1000,
  incomeCategories: ['Lương', 'Thưởng', 'Bán hàng', 'Khác'],
};

const categoryBudgets = [
  { name: 'Ăn uống', budget: 5000000 },
  { name: 'Xăng cộ', budget: 1000000 },
  { name: 'Grab', budget: 500000 },
  { name: 'Tiền Trọ', budget: 3000000 },
];

const expenseCats = ['Ăn uống', 'Xăng cộ', 'Grab', 'Tiền Trọ', 'Mua sắm', 'Giải trí', 'Khác'];
const incomeCats = ['Lương', 'Thưởng', 'Bán hàng', 'Khác'];

const transactions = [];
const now = Date.now();
const oneYearMs = 365 * 24 * 60 * 60 * 1000;

for (let i = 0; i < 10000; i++) {
  const isExpense = Math.random() > 0.2; // 80% chi, 20% thu
  const type = isExpense ? 'expense' : 'income';
  
  // Random số tiền chẵn từ 10k đến vài triệu
  const amount = isExpense 
    ? (Math.floor(Math.random() * 50) + 1) * 10000 
    : (Math.floor(Math.random() * 100) + 5) * 100000;
  
  const cats = isExpense ? expenseCats : incomeCats;
  const category = cats[Math.floor(Math.random() * cats.length)];
  
  const timestamp = now - Math.floor(Math.random() * oneYearMs);
  
  transactions.push({
    id: `test_tx_${i}_${Math.random().toString(36).substr(2, 5)}`,
    type,
    amount,
    category,
    categorySnapshot: category,
    name: `Giao dịch test ${i}`,
    timestamp
  });
}

// Sắp xếp giảm dần theo thời gian (như logic của app)
transactions.sort((a, b) => b.timestamp - a.timestamp);

const exportData = {
  profile,
  transactions,
  categoryBudgets
};

fs.writeFileSync('test_10000_giao_dich.txt', JSON.stringify(exportData), 'utf8');
console.log('File created: test_10000_giao_dich.txt');
