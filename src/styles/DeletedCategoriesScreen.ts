import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#ffffff",
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
  },
  tabsContainer: {
    flexDirection: "row",
    margin: 16,
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabButtonActiveExpense: {
    backgroundColor: "#ef4444",
  },
  tabButtonActiveIncome: {
    backgroundColor: "#10b981",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  tabTextActive: {
    color: "#ffffff",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardMainRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  categoryInfo: {
    flex: 1,
    justifyContent: "center",
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
  },
  deletionDate: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  txCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  txCountText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  restoreButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  restoreButtonText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#059669",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 12,
  },
  txSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 8,
  },
  txList: {
    gap: 8,
  },
  txItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  txItemLeft: {
    flex: 1,
    paddingRight: 12,
  },
  txName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  txNote: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    fontStyle: "italic",
  },
  txDate: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "bold",
  },
  expenseText: {
    color: "#ef4444",
  },
  incomeText: {
    color: "#10b981",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
    marginTop: 64,
  },
  emptyText: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 24,
  },
});
