import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { storage } from '../store/storage';
import { Transaction } from '../types';
import { formatCurrency } from './format';
import { resolveCategoryName } from './category';

export const exportYearlyPdfReport = async (year: number): Promise<void> => {
  const transactions = await storage.getTransactions();
  const profile = await storage.getUserProfile();
  const categoryBudgets = await storage.getCategoryBudgets();
  
  // Filter transactions for this year
  let yearTxs = transactions.filter(tx => {
    const date = new Date(tx.timestamp);
    return date.getFullYear() === year;
  });

  // Exclude transfer/savings target like in Statistics Screen to match official stats
  yearTxs = yearTxs.filter(
    (tx) =>
      tx.categoryId !== "system_tiet_kiem" &&
      tx.categoryId !== "system_rut_tiet_kiem" &&
      tx.categoryId !== "system_xoa_quy" &&
      !tx.categoryId?.startsWith("fund_") &&
      tx.category !== "Tiết kiệm" &&
      tx.category !== "Rút tiết kiệm" &&
      tx.category !== "Xóa Quỹ" &&
      !(tx.category && (profile?.customFunds || []).some((f) => f.name === tx.category))
  );

  // Group transactions by month
  const monthlyData: Record<number, Transaction[]> = {};
  for (let m = 0; m < 12; m++) {
    monthlyData[m] = [];
  }

  yearTxs.forEach(tx => {
    const month = new Date(tx.timestamp).getMonth();
    monthlyData[month].push(tx);
  });

  // Calculate Yearly stats
  let yearlyIncome = 0;
  let yearlyExpense = 0;
  const yearlyCategoryTotals: Record<string, { amount: number; type: 'income' | 'expense' }> = {};

  yearTxs.forEach(tx => {
    const isExpense = tx.type === 'expense';
    if (isExpense) {
      yearlyExpense += tx.amount;
    } else {
      yearlyIncome += tx.amount;
    }

    const catName = resolveCategoryName(tx, profile, categoryBudgets);
    if (!yearlyCategoryTotals[catName]) {
      yearlyCategoryTotals[catName] = { amount: 0, type: tx.type };
    }
    yearlyCategoryTotals[catName].amount += tx.amount;
  });

  const yearlyNet = yearlyIncome - yearlyExpense;
  const netSign = yearlyNet >= 0 ? '+' : '';
  const netColor = yearlyNet >= 0 ? '#16a34a' : '#dc2626'; // Green 600 or Red 600

  // Generate HTML
  let html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Báo cáo tài chính năm ${year}</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #1e293b;
        margin: 0;
        padding: 30px;
        line-height: 1.5;
        background-color: #ffffff;
      }
      .header-container {
        text-align: center;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 20px;
        margin-bottom: 30px;
      }
      .app-title {
        font-size: 14px;
        font-weight: bold;
        color: #94a3b8;
        letter-spacing: 2px;
        text-transform: uppercase;
        margin: 0;
      }
      .report-title {
        font-size: 28px;
        font-weight: bold;
        color: #0f172a;
        margin: 10px 0;
      }
      .report-meta {
        font-size: 12px;
        color: #64748b;
      }
      
      /* Yearly Summary Card */
      .section-title {
        font-size: 20px;
        font-weight: bold;
        color: #1e293b;
        margin-top: 40px;
        margin-bottom: 15px;
        border-left: 4px solid #f43f5e; /* Rose accent */
        padding-left: 10px;
        page-break-after: avoid;
      }
      
      .card-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
        margin-bottom: 30px;
        page-break-inside: avoid;
      }
      .summary-card {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 15px;
        text-align: center;
      }
      .card-label {
        font-size: 11px;
        font-weight: bold;
        color: #64748b;
        text-transform: uppercase;
        margin-bottom: 5px;
      }
      .card-value {
        font-size: 16px;
        font-weight: bold;
      }
      .value-income { color: #16a34a; }
      .value-expense { color: #dc2626; }
      
      /* Tables */
      .table-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 30px;
        page-break-inside: avoid;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      th, td {
        padding: 10px 12px;
        text-align: left;
        font-size: 13px;
        border-bottom: 1px solid #e2e8f0;
      }
      th {
        background-color: #f1f5f9;
        font-weight: bold;
        color: #475569;
      }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      
      /* Monthly items */
      .month-section {
        margin-top: 50px;
        page-break-before: always;
      }
      .month-title {
        font-size: 22px;
        font-weight: bold;
        color: #0f172a;
        border-bottom: 2px solid #fda4af;
        padding-bottom: 8px;
        margin-bottom: 20px;
        page-break-after: avoid;
      }
      .tx-table th {
        background-color: #f8fafc;
      }
      
      @media print {
        .no-print { display: none; }
        .page-break-inside-avoid {
          page-break-inside: avoid;
        }
      }
    </style>
  </head>
  <body>
    <div class="header-container">
      <p class="app-title">🐷 Ứng Dụng Quản Lý Chi Tiêu Heo Đất Béo 🐷</p>
      <h1 class="report-title">Báo Cáo Tài Chính Năm ${year}</h1>
      <p class="report-meta">Xuất ngày: ${new Date().toLocaleDateString('vi-VN')} lúc ${new Date().toLocaleTimeString('vi-VN')}</p>
    </div>

    <div class="section-title">TỔNG HỢP CẢ NĂM ${year}</div>
    <div class="card-grid">
      <div class="summary-card">
        <div class="card-label">Tổng Thu Nhập</div>
        <div class="card-value value-income">+${formatCurrency(yearlyIncome)} đ</div>
      </div>
      <div class="summary-card">
        <div class="card-label">Tổng Chi Tiêu</div>
        <div class="card-value value-expense">-${formatCurrency(yearlyExpense)} đ</div>
      </div>
      <div class="summary-card" style="border-color: ${netColor}44; background-color: ${netColor}05;">
        <div class="card-label">Tích Lũy Ròng (Thu - Chi)</div>
        <div class="card-value" style="color: ${netColor};">${netSign}${formatCurrency(yearlyNet)} đ</div>
      </div>
    </div>

    <div class="table-grid">
      <div>
        <h3 style="color: #16a34a; margin-top: 0; font-size: 15px;">🟢 Thu Nhập Theo Danh Mục</h3>
        <table>
          <thead>
            <tr>
              <th>Danh mục</th>
              <th class="text-right">Tổng thu</th>
            </tr>
          </thead>
          <tbody>
  `;

  // Render yearly income categories
  const yearlyIncomes = Object.entries(yearlyCategoryTotals).filter(([_, val]) => val.type === 'income');
  if (yearlyIncomes.length === 0) {
    html += `<tr><td colspan="2" style="color: #94a3b8; font-style: italic;">Không có dữ liệu thu nhập</td></tr>`;
  } else {
    yearlyIncomes.forEach(([cat, val]) => {
      html += `
        <tr>
          <td>${cat}</td>
          <td class="text-right value-income">+${formatCurrency(val.amount)} đ</td>
        </tr>
      `;
    });
  }

  html += `
          </tbody>
        </table>
      </div>

      <div>
        <h3 style="color: #dc2626; margin-top: 0; font-size: 15px;">🔴 Chi Tiêu Theo Danh Mục</h3>
        <table>
          <thead>
            <tr>
              <th>Danh mục</th>
              <th class="text-right">Tổng chi</th>
            </tr>
          </thead>
          <tbody>
  `;

  // Render yearly expense categories
  const yearlyExpenses = Object.entries(yearlyCategoryTotals).filter(([_, val]) => val.type === 'expense');
  if (yearlyExpenses.length === 0) {
    html += `<tr><td colspan="2" style="color: #94a3b8; font-style: italic;">Không có dữ liệu chi tiêu</td></tr>`;
  } else {
    yearlyExpenses.forEach(([cat, val]) => {
      html += `
        <tr>
          <td>${cat}</td>
          <td class="text-right value-expense">-${formatCurrency(val.amount)} đ</td>
        </tr>
      `;
    });
  }

  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Monthly Details
  for (let m = 0; m < 12; m++) {
    const monthTxs = monthlyData[m];
    if (monthTxs.length === 0) continue;

    // Sort transactions by timestamp ascending
    monthTxs.sort((a, b) => a.timestamp - b.timestamp);

    let mIncome = 0;
    let mExpense = 0;
    const mCategoryTotals: Record<string, { amount: number; type: 'income' | 'expense' }> = {};

    monthTxs.forEach(tx => {
      const isExpense = tx.type === 'expense';
      if (isExpense) {
        mExpense += tx.amount;
      } else {
        mIncome += tx.amount;
      }

      const catName = resolveCategoryName(tx, profile, categoryBudgets);
      if (!mCategoryTotals[catName]) {
        mCategoryTotals[catName] = { amount: 0, type: tx.type };
      }
      mCategoryTotals[catName].amount += tx.amount;
    });

    const mNet = mIncome - mExpense;
    const mNetSign = mNet >= 0 ? '+' : '';
    const mNetColor = mNet >= 0 ? '#16a34a' : '#dc2626';

    html += `
      <div class="month-section">
        <div class="month-title">Tháng ${(m + 1).toString().padStart(2, '0')}/${year}</div>
        
        <div class="card-grid">
          <div class="summary-card">
            <div class="card-label">Tổng Thu Tháng</div>
            <div class="card-value value-income">+${formatCurrency(mIncome)} đ</div>
          </div>
          <div class="summary-card">
            <div class="card-label">Tổng Chi Tháng</div>
            <div class="card-value value-expense">-${formatCurrency(mExpense)} đ</div>
          </div>
          <div class="summary-card" style="border-color: ${mNetColor}44; background-color: ${mNetColor}05;">
            <div class="card-label">Thặng Dư Tháng</div>
            <div class="card-value" style="color: ${mNetColor};">${mNetSign}${formatCurrency(mNet)} đ</div>
          </div>
        </div>

        <div class="table-grid">
          <div>
            <h4 style="color: #16a34a; margin: 0 0 10px 0; font-size: 14px;">🟢 Thu Nhập Theo Danh Mục</h4>
            <table>
              <thead>
                <tr>
                  <th>Danh mục</th>
                  <th class="text-right">Tổng thu</th>
                </tr>
              </thead>
              <tbody>
    `;

    const mIncomes = Object.entries(mCategoryTotals).filter(([_, val]) => val.type === 'income');
    if (mIncomes.length === 0) {
      html += `<tr><td colspan="2" style="color: #94a3b8; font-style: italic;">Không có thu nhập</td></tr>`;
    } else {
      mIncomes.forEach(([cat, val]) => {
        html += `
          <tr>
            <td>${cat}</td>
            <td class="text-right value-income">+${formatCurrency(val.amount)} đ</td>
          </tr>
        `;
      });
    }

    html += `
              </tbody>
            </table>
          </div>

          <div>
            <h4 style="color: #dc2626; margin: 0 0 10px 0; font-size: 14px;">🔴 Chi Tiêu Theo Danh Mục</h4>
            <table>
              <thead>
                <tr>
                  <th>Danh mục</th>
                  <th class="text-right">Tổng chi</th>
                </tr>
              </thead>
              <tbody>
    `;

    const mExpenses = Object.entries(mCategoryTotals).filter(([_, val]) => val.type === 'expense');
    if (mExpenses.length === 0) {
      html += `<tr><td colspan="2" style="color: #94a3b8; font-style: italic;">Không có chi tiêu</td></tr>`;
    } else {
      mExpenses.forEach(([cat, val]) => {
        html += `
          <tr>
            <td>${cat}</td>
            <td class="text-right value-expense">-${formatCurrency(val.amount)} đ</td>
          </tr>
        `;
      });
    }

    html += `
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  html += `
  </body>
  </html>
  `;

  // Write to PDF using expo-print
  const { uri } = await Print.printToFileAsync({ html });
  
  // Share the generated PDF
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Báo cáo tài chính năm ${year}`,
    UTI: 'com.adobe.pdf'
  });
};
