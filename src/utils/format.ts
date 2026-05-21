export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('vi-VN');
};

export const formatPercent = (percent: number): string => {
  const rounded = parseFloat(percent.toFixed(1));
  return rounded.toString().replace('.', ',');
};

