import { StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerPlaceholder: {
    width: 40,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    borderRadius: 16,
    padding: 16,
  },
  summaryTitle: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  summaryValue: {
    color: "#fbbf24",
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
  },
  summarySubRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 8,
  },
  summarySubLabel: {
    color: "#94a3b8",
    fontSize: 11,
  },
  summarySubValue: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },

  // Tabs
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginTop: -15,
    borderRadius: 14,
    padding: 6,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    zIndex: 10,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabItemActive: {
    backgroundColor: "#fef3c7",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  tabTextActive: {
    color: "#d97706",
  },

  // Content Area
  listContent: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
  },

  // Gold Item Card
  goldCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    borderLeftWidth: 4,
  },
  goldCardActive: {
    borderLeftColor: "#fbbf24", // Gold
  },
  goldCardSold: {
    borderLeftColor: "#ef4444", // Red
  },
  goldCardExchanged: {
    borderLeftColor: "#3b82f6", // Blue
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardQuantity: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  cardDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: "#64748b",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 8,
    marginTop: 4,
  },
  cardDate: {
    fontSize: 11,
    color: "#94a3b8",
  },
  exchangeFeeLabel: {
    fontSize: 11,
    color: "#64748b",
  },

  // Sale Record Card
  saleCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    borderLeftWidth: 4,
  },
  saleCardProfit: {
    borderLeftColor: "#10b981", // Green
  },
  saleCardLoss: {
    borderLeftColor: "#ef4444", // Red
  },
  saleTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  saleDate: {
    fontSize: 11,
    color: "#94a3b8",
  },
  profitBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  profitBadgeProfit: {
    backgroundColor: "#d1fae5",
  },
  profitBadgeLoss: {
    backgroundColor: "#fee2e2",
  },
  profitTextProfit: {
    color: "#065f46",
    fontSize: 10,
    fontWeight: "700",
  },
  profitTextLoss: {
    color: "#991b1b",
    fontSize: 10,
    fontWeight: "700",
  },
  saleDetailsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  diffText: {
    fontSize: 15,
    fontWeight: "700",
  },

  // Selectable Item (in Selling/Exchanging forms)
  selectableItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  selectableItemSelected: {
    borderColor: "#fbbf24",
    backgroundColor: "#fffdf5",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#fbbf24",
    borderColor: "#fbbf24",
  },
  selectableDetails: {
    flex: 1,
  },
  selectableQty: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 2,
  },
  selectableSub: {
    fontSize: 11,
    color: "#64748b",
  },

  // Floating Action Buttons Row
  fabRow: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  fabButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  fabBuy: {
    backgroundColor: "#d97706",
  },
  fabSell: {
    backgroundColor: "#ef4444",
  },
  fabExchange: {
    backgroundColor: "#2563eb",
  },
  fabText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Modal / Form Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    maxHeight: "85%",
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
  },
  modalCloseButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  formContent: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  unitSelector: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    padding: 4,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  unitButtonActive: {
    backgroundColor: "#ffffff",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  unitButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  unitButtonTextActive: {
    color: "#d97706",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputRowFocused: {
    borderColor: "#fbbf24",
    backgroundColor: "#ffffff",
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "500",
  },
  inputSuffix: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginLeft: 8,
  },
  helperText: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 4,
  },

  // Date Picker styling (simplified or input text styled)
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  dateButtonText: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "500",
  },

  // Selection list inside modal
  selectionScroll: {
    maxHeight: 220,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },

  // Form info box (e.g. profit/loss output or exchange details)
  infoBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  infoRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
    marginTop: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  infoValueHighlight: {
    fontSize: 15,
    fontWeight: "700",
  },

  // Form Submit
  submitButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#d97706",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  submitButtonDisabled: {
    backgroundColor: "#cbd5e1",
  },
});
