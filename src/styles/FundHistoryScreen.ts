import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        backgroundColor: '#0ea5e9',
        padding: 24,
        paddingTop: 60,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
        gap: 12,
        paddingBottom: 40,
        paddingTop: 24,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconImage: {
        width: 26,
        height: 26,
        resizeMode: 'contain',
    },
    cardCategory: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    cardName: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
        fontStyle: 'italic',
    },
    cardAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    depositText: { color: '#10b981' },
    withdrawText: { color: '#ef4444' },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardDate: {
        fontSize: 13,
        color: '#94a3b8',
    },
    actionButton: { padding: 4 },
    emptyContainer: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#94a3b8', fontSize: 15, textAlign: 'center' },
});