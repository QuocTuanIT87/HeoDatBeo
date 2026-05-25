import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    header: {
        backgroundColor: "#f59e0b",
        padding: 24,
        paddingTop: 60,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    backButton: {
        padding: 8,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 12,
    },
    headerTitle: {
        color: "#ffffff",
        fontSize: 20,
        fontWeight: "bold",
    },
    tabBar: {
        flexDirection: "row",
        margin: 16,
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 4,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    tabItem: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        gap: 8,
        borderRadius: 8,
    },
    tabItemActive: {
        backgroundColor: "#fffbeb",
    },
    tabText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#64748b",
    },
    tabTextActive: {
        color: "#f59e0b",
    },
    listContent: {
        padding: 16,
        gap: 16,
        paddingBottom: 40,
    },
    // Goal Card Styles
    goalCard: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    goalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    goalYear: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#0f172a",
    },
    goalBody: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    goalStat: {
        flex: 1,
    },
    goalStatLabel: {
        fontSize: 12,
        color: "#64748b",
        marginBottom: 2,
    },
    goalStatValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1e293b",
    },
    progressContainer: {
        height: 8,
        backgroundColor: "#f1f5f9",
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: 8,
    },
    progressBar: {
        height: "100%",
        borderRadius: 4,
    },
    goalFooter: {
        fontSize: 12,
        color: "#94a3b8",
        textAlign: "right",
    },
    // Log Card Styles
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 16,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    cardRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    cardCategory: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1e293b",
    },
    cardName: {
        fontSize: 13,
        color: "#64748b",
        marginTop: 2,
        fontStyle: "italic",
    },
    cardAmount: {
        fontSize: 18,
        fontWeight: "bold",
    },
    depositText: { color: "#10b981" },
    withdrawText: { color: "#ef4444" },
    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    cardDate: {
        fontSize: 14,
        color: "#94a3b8",
    },
    actionButton: { padding: 4 },
    emptyContainer: { padding: 40, alignItems: "center" },
    emptyText: { color: "#94a3b8", fontSize: 15, textAlign: "center" },
});