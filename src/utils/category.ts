import { UserProfile, CategoryBudget } from "../types";

export function isCategoryIdMatch(id1?: string, id2?: string): boolean {
  if (!id1 || !id2) return false;
  if (id1 === id2) return true;

  const stripSuffix = (id: string) => {
    return id.replace(/_[a-z0-9]{5}$/i, '');
  };

  const base1 = stripSuffix(id1);
  const base2 = stripSuffix(id2);

  return base1 === base2 || id1.startsWith(id2) || id2.startsWith(id1);
}

export function resolveCategoryName(
  tx: { categoryId?: string; type: 'income' | 'expense' },
  profile: UserProfile | null,
  categoryBudgets: CategoryBudget[]
): string {
  const { categoryId, type } = tx;

  // 1. System categories
  if (categoryId === "system_tiet_kiem") return "Nuôi heo béo";
  if (categoryId === "system_rut_tiet_kiem") return "Heo giảm cân";
  if (categoryId === "system_xoa_quy") return "Xóa quỹ";

  // 2. Custom funds
  if (categoryId?.startsWith("fund_")) {
    const fundId = categoryId.substring(5);
    const fund = profile?.customFunds?.find(f => f.id && isCategoryIdMatch(f.id, fundId));
    if (fund) return fund.name;
    return "Quỹ";
  }

  // 3. Normal categories
  if (type === "expense") {
    if (categoryId) {
      const budget = categoryBudgets.find(b => b.id && isCategoryIdMatch(b.id, categoryId));
      if (budget) return budget.name;
    }
    return "Khác";
  } else {
    if (categoryId) {
      const incomeCat = profile?.incomeCategories?.find(c => c.id && isCategoryIdMatch(c.id, categoryId));
      if (incomeCat) return incomeCat.name;
    }
    return "Khác";
  }
}
