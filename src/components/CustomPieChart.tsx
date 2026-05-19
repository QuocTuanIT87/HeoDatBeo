import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Modal,
  Platform,
} from "react-native";
import Svg, {
  Path,
  G,
  Text as SvgText,
  Polyline,
  Circle,
} from "react-native-svg";
import { formatCurrency } from "../utils/format";
import { Maximize2, X } from "lucide-react-native";

const screenWidth = Dimensions.get("window").width;

type PieItem = {
  name: string;
  population: number;
  color: string;
  baseCategory?: string;
};

type Props = {
  data: PieItem[];
  selectedCategory: string | null;
  onSelectCategory: (name: string) => void;
  renderNoteDetails?: (name: string) => React.ReactNode;
};

const CustomPieChart: React.FC<Props> = ({
  data,
  selectedCategory,
  onSelectCategory,
  renderNoteDetails,
}) => {
  const [showExpandedModal, setShowExpandedModal] = useState(false);
  const total = data.reduce((sum, item) => sum + item.population, 0);
  if (total === 0)
    return <Text style={styles.emptyText}>Không có dữ liệu chi tiền</Text>;

  // > 10 mục → ẩn nhãn % trên biểu đồ (hiển thị trong danh sách), chọn 10 cách đều
  const hideChartLabels = data.length > 10;

  // Gom nhóm "Khác"
  const groupedData: {
    [key: string]: {
      population: number;
      color: string;
      names: string[];
      key: string;
    };
  } = {};
  data.forEach((item) => {
    const isOther = item.baseCategory === "Khác" || item.name === "Khác";
    const groupKey = isOther ? "Khác" : item.name;
    if (!groupedData[groupKey]) {
      groupedData[groupKey] = {
        key: groupKey,
        population: 0,
        color: isOther ? "#64748b" : item.color,
        names: [],
      };
    }
    groupedData[groupKey].population += item.population;
    groupedData[groupKey].names.push(item.name);
  });

  const chartSlices = Object.values(groupedData).sort(
    (a, b) => b.population - a.population,
  );

  const radius = 80;
  const centerX = screenWidth / 2;
  const centerY = 130;
  let currentAngle = 0;

  const getCoordinatesForAngle = (angle: number, rad: number) => {
    const rad2 = ((angle - 90) * Math.PI) / 180.0;
    return {
      x: centerX + rad * Math.cos(rad2),
      y: centerY + rad * Math.sin(rad2),
    };
  };

  // --- Tính arcs ---
  const arcs = chartSlices.map((slice) => {
    const sliceAngle = (slice.population / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    const midAngle = startAngle + sliceAngle / 2;
    currentAngle = endAngle;

    const percentVal = (slice.population / total) * 100;
    // showLabel will be overridden below if hideChartLabels is true, but <= 2% will always be false
    const showLabel = !hideChartLabels && percentVal >= 2.0;

    const isSelected =
      selectedCategory === slice.key ||
      (selectedCategory !== null && slice.names.includes(selectedCategory));
    const activeRadius = isSelected ? radius + 10 : radius;

    const start = getCoordinatesForAngle(startAngle, activeRadius);
    const end = getCoordinatesForAngle(endAngle, activeRadius);
    const largeArcFlag = sliceAngle > 180 ? 1 : 0;

    const isFullCircle = sliceAngle === 360;
    let pathData = "";
    if (isFullCircle) {
      pathData = `
        M ${centerX} ${centerY - activeRadius}
        A ${activeRadius} ${activeRadius} 0 1 1 ${centerX} ${centerY + activeRadius}
        A ${activeRadius} ${activeRadius} 0 1 1 ${centerX} ${centerY - activeRadius}
      `;
    } else {
      pathData = `
        M ${centerX} ${centerY}
        L ${start.x} ${start.y}
        A ${activeRadius} ${activeRadius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}
        Z
      `;
    }

    const percent = percentVal.toFixed(1) + "%";
    const lineStart = getCoordinatesForAngle(midAngle, activeRadius);
    const lineBreak = getCoordinatesForAngle(midAngle, activeRadius + 20);
    const isRightSide = midAngle >= 0 && midAngle < 180;
    const lineEnd = {
      x: lineBreak.x + (isRightSide ? 30 : -30),
      y: lineBreak.y,
    };

    return {
      slice,
      pathData,
      isSelected,
      showLabel,
      midAngle,
      percent,
      lineStart,
      lineBreak,
      lineEnd,
      isRightSide,
    };
  });

  // --- Phân bổ vị trí label ---
  if (hideChartLabels) {
    // Bước 1: Tắt hết showLabel
    arcs.forEach((a) => {
      a.showLabel = false;
    });

    // Bước 2: Chọn 5 slice đều từ nửa PHẢI (0°–180°) và 5 từ nửa TRÁI (180°–360°)
    // → Đảm bảo luôn có 5 label mỗi bên, không bị dồn 1 bên
    const angleSorted = [...arcs].sort((a, b) => a.midAngle - b.midAngle);

    const rightHalf = angleSorted.filter(
      (a) => a.midAngle >= 0 && a.midAngle < 180,
    );
    const leftHalf = angleSorted.filter((a) => a.midAngle >= 180);

    const pickEvenly = (group: typeof arcs, n: number) => {
      const len = group.length;
      if (len === 0 || n === 0) return;
      for (let i = 0; i < n; i++) {
        const idx = Math.floor((i / n) * len);
        group[idx].showLabel = true;
      }
    };

    // Lấy 5 mỗi bên, nếu 1 bên thiếu thì bổ sung từ bên kia
    const wantPerSide = 5;
    const rightCnt = Math.min(wantPerSide, rightHalf.length);
    const leftCnt = Math.min(
      wantPerSide + (wantPerSide - rightCnt),
      leftHalf.length,
    );

    pickEvenly(rightHalf, rightCnt);
    pickEvenly(leftHalf, leftCnt);

    // Bước 3: Anti-overlap giống hệt mode ≤ 10 items
    let rightY = -999;
    let leftY = 999;
    const MIN_Y_DISTANCE = 18;

    arcs
      .filter((a) => a.showLabel && a.isRightSide)
      .forEach((arc) => {
        if (rightY !== -999 && arc.lineEnd.y < rightY + MIN_Y_DISTANCE) {
          arc.lineEnd.y = rightY + MIN_Y_DISTANCE;
          arc.lineBreak.y = arc.lineEnd.y;
        }
        rightY = arc.lineEnd.y;
      });

    arcs
      .filter((a) => a.showLabel && !a.isRightSide)
      .forEach((arc) => {
        if (leftY !== 999 && arc.lineEnd.y > leftY - MIN_Y_DISTANCE) {
          arc.lineEnd.y = leftY - MIN_Y_DISTANCE;
          arc.lineBreak.y = arc.lineEnd.y;
        }
        leftY = arc.lineEnd.y;
      });
  } else {
    // ≤ 10 mục: anti-overlap truyền thống
    let rightY = -999;
    let leftY = 999;
    const MIN_Y_DISTANCE = 18;

    arcs
      .filter((a) => a.showLabel && a.isRightSide)
      .forEach((arc) => {
        if (rightY !== -999 && arc.lineEnd.y < rightY + MIN_Y_DISTANCE) {
          arc.lineEnd.y = rightY + MIN_Y_DISTANCE;
          arc.lineBreak.y = arc.lineEnd.y;
        }
        rightY = arc.lineEnd.y;
      });

    arcs
      .filter((a) => a.showLabel && !a.isRightSide)
      .forEach((arc) => {
        if (leftY !== 999 && arc.lineEnd.y > leftY - MIN_Y_DISTANCE) {
          arc.lineEnd.y = leftY - MIN_Y_DISTANCE;
          arc.lineBreak.y = arc.lineEnd.y;
        }
        leftY = arc.lineEnd.y;
      });
  }

  // Triệt tiêu các nhãn nhỏ hơn 2% theo yêu cầu của người dùng
  arcs.forEach((arc) => {
    const percentVal = (arc.slice.population / total) * 100;
    if (percentVal < 2.0) {
      arc.showLabel = false;
    }
  });

  // Thông tin slice đang được chọn để hiển thị phía trên biểu đồ
  const selectedArc = selectedCategory
    ? arcs.find(
        (a) =>
          a.slice.key === selectedCategory ||
          a.slice.names.includes(selectedCategory),
      )
    : null;

  const renderCategoryList = () => {
    return (
      <>
        {data
          .filter(
            (item) => item.baseCategory !== "Khác" && item.name !== "Khác",
          )
          .map((item, index) => {
            const isSelfSelected = selectedCategory === item.name;
            const percent = ((item.population / total) * 100).toFixed(1) + "%";
            return (
              <View key={`main-group-${index}`}>
                <TouchableOpacity
                  style={[
                    styles.listItem,
                    isSelfSelected && styles.listItemSelected,
                  ]}
                  onPress={() =>
                    onSelectCategory(isSelfSelected ? "" : item.name)
                  }
                >
                  <View style={styles.listLeft}>
                    <View
                      style={[styles.colorDot, { backgroundColor: item.color }]}
                    />
                    <Text
                      style={[
                        styles.listName,
                        isSelfSelected && styles.listTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </View>
                  <View style={styles.listItemRight}>
                    {hideChartLabels && (
                      <Text
                        style={[
                          styles.listPercent,
                          isSelfSelected && styles.listTextSelected,
                        ]}
                      >
                        {percent}
                      </Text>
                    )}
                    <Text
                      style={[
                        styles.listAmount,
                        isSelfSelected && styles.listTextSelected,
                      ]}
                    >
                      {formatCurrency(item.population)} đ
                    </Text>
                  </View>
                </TouchableOpacity>
                {isSelfSelected && renderNoteDetails && (
                  <View style={styles.noteDetailsInList}>
                    {renderNoteDetails(item.name)}
                  </View>
                )}
              </View>
            );
          })}

        {data.filter(
          (item) => item.baseCategory === "Khác" || item.name === "Khác",
        ).length > 0 && (
          <View style={styles.otherHeaderContainer}>
            <Text style={styles.otherHeaderText}>Thu chi khác</Text>
          </View>
        )}

        {data
          .filter(
            (item) => item.baseCategory === "Khác" || item.name === "Khác",
          )
          .map((item, index) => {
            const isGroupSelected = selectedCategory === "Khác";
            const isSelfSelected = selectedCategory === item.name;
            const isItemSelected = isSelfSelected || isGroupSelected;
            const groupColor = "#64748b";
            const percent = ((item.population / total) * 100).toFixed(1) + "%";

            return (
              <View key={`other-group-${index}`}>
                <TouchableOpacity
                  style={[
                    styles.listItem,
                    isItemSelected && styles.listItemSelected,
                  ]}
                  onPress={() =>
                    onSelectCategory(isSelfSelected ? "" : item.name)
                  }
                >
                  <View style={styles.listLeft}>
                    <View
                      style={[styles.colorDot, { backgroundColor: groupColor }]}
                    />
                    <Text
                      style={[
                        styles.listName,
                        isItemSelected && styles.listTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </View>
                  <View style={styles.listItemRight}>
                    {hideChartLabels && (
                      <Text
                        style={[
                          styles.listPercent,
                          isItemSelected && styles.listTextSelected,
                        ]}
                      >
                        {percent}
                      </Text>
                    )}
                    <Text
                      style={[
                        styles.listAmount,
                        isItemSelected && styles.listTextSelected,
                      ]}
                    >
                      {formatCurrency(item.population)} đ
                    </Text>
                  </View>
                </TouchableOpacity>
                {isSelfSelected && renderNoteDetails && (
                  <View style={styles.noteDetailsInList}>
                    {renderNoteDetails(item.name)}
                  </View>
                )}
              </View>
            );
          })}
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* Info box phía trên biểu đồ */}
      {selectedArc ? (
        <View style={styles.infoBox}>
          <View
            style={[
              styles.infoColorDot,
              { backgroundColor: selectedArc.slice.color },
            ]}
          />
          <View style={styles.infoTextBlock}>
            <Text style={styles.infoName} numberOfLines={1}>
              {selectedArc.slice.key}
            </Text>
            <Text style={styles.infoDetail}>
              {selectedArc.percent} · 
              {formatCurrency(selectedArc.slice.population)} đ
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onSelectCategory("")}
            style={styles.infoClose}
          >
            <Text style={styles.infoCloseText}>×</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.infoBoxPlaceholder}>
          <Text style={styles.infoPlaceholderText}>
            Nhấn vào biểu đồ để xem chi tiết
          </Text>
        </View>
      )}
      <Svg width={screenWidth} height={hideChartLabels ? 260 : 300}>
        <G>
          {arcs.map((arc, index) => (
            <G
              key={`slice-${index}`}
              onPress={() => onSelectCategory(arc.slice.key)}
            >
              <Path
                d={arc.pathData}
                fill={arc.slice.color}
                stroke="#ffffff"
                strokeWidth={arc.isSelected ? 0 : 2}
              />
              {arc.showLabel && (
                <>
                  <Polyline
                    points={`${arc.lineStart.x},${arc.lineStart.y} ${arc.lineBreak.x},${arc.lineBreak.y} ${arc.lineEnd.x},${arc.lineEnd.y}`}
                    fill="none"
                    stroke={arc.slice.color}
                    strokeWidth="1.5"
                  />
                  <Circle
                    cx={arc.lineEnd.x}
                    cy={arc.lineEnd.y}
                    r="3"
                    fill={arc.slice.color}
                  />
                  <SvgText
                    x={arc.lineEnd.x + (arc.isRightSide ? 5 : -5)}
                    y={arc.lineEnd.y + 4}
                    fill="#334155"
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor={arc.isRightSide ? "start" : "end"}
                  >
                    {arc.percent}
                  </SvgText>
                </>
              )}
            </G>
          ))}
          {/* Mask circle to create donut chart */}
          <Circle cx={centerX} cy={centerY} r={52} fill="#ffffff" />
        </G>
      </Svg>
      <View style={styles.listHeaderRow}>
        <Text style={styles.listHeaderTitle}>Cơ cấu theo danh mục</Text>
        <TouchableOpacity
          style={styles.expandBtn}
          onPress={() => setShowExpandedModal(true)}
          activeOpacity={0.7}
        >
          <Maximize2 color="#64748b" size={16} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollList}
        contentContainerStyle={styles.listContainer}
      >
        {renderCategoryList()}
      </ScrollView>

      {/* Modal mở rộng full màn hình */}
      <Modal
        visible={showExpandedModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowExpandedModal(false)}
      >
        <View style={styles.expandedModalContainer}>
          {/* Header */}
          <View style={styles.expandedHeader}>
            <Text style={styles.expandedHeaderTitle}>
              Danh sách chi tiết danh mục
            </Text>
            <TouchableOpacity
              style={styles.expandedCloseBtn}
              onPress={() => setShowExpandedModal(false)}
              activeOpacity={0.7}
            >
              <X color="#0f172a" size={20} />
            </TouchableOpacity>
          </View>

          {/* Body: Chỉ hiển thị danh sách danh mục (không hiển thị biểu đồ) */}
          <ScrollView
            style={styles.expandedScrollList}
            contentContainerStyle={styles.expandedListContainer}
          >
            {renderCategoryList()}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flex: 1,
    alignItems: "center",
    paddingBottom: 20,
  },
  emptyText: { padding: 20, color: "#94a3b8", textAlign: "center" },

  // Info box phía trên biểu đồ
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 6,
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#1e293b",
    borderRadius: 14,
    gap: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  infoBoxPlaceholder: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    marginTop: 4,
  },
  infoPlaceholderText: { fontSize: 13, color: "#94a3b8" },
  infoColorDot: { width: 16, height: 16, borderRadius: 8, flexShrink: 0 },
  infoTextBlock: { flex: 1 },
  infoName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: 2,
  },
  infoDetail: { fontSize: 13, color: "#94a3b8", fontWeight: "500" },
  infoClose: { padding: 4 },
  infoCloseText: { fontSize: 20, color: "#64748b", lineHeight: 22 },

  scrollList: { width: "100%", flex: 1 },
  listContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    paddingBottom: 40,
    gap: 8,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
  },
  listItemSelected: { backgroundColor: "#3b82f6" },
  listLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  listName: { fontSize: 15, color: "#334155", fontWeight: "500", flex: 1 },
  listItemRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  listPercent: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
    minWidth: 40,
    textAlign: "right",
  },
  listAmount: { fontSize: 15, color: "#334155", fontWeight: "bold" },
  listTextSelected: { color: "#ffffff" },
  noteDetailsInList: {
    backgroundColor: "#ffffff",
    marginHorizontal: 4,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 12,
    marginTop: -4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderTopWidth: 0,
    marginBottom: 8,
  },
  otherHeaderContainer: {
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 16,
  },
  otherHeaderText: { fontSize: 16, fontWeight: "bold", color: "#475569" },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  listHeaderTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
  },
  expandBtn: {
    padding: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
  },
  expandedModalContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  expandedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    marginTop: 46,
  },
  expandedHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0c2340",
  },
  expandedCloseBtn: {
    padding: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
  },
  expandedScrollList: {
    flex: 1,
    width: "100%",
  },
  expandedListContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 8,
  },
});

export default CustomPieChart;
