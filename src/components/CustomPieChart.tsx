import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import Svg, { Path, G, Text as SvgText, Polyline, Circle } from 'react-native-svg';
import { formatCurrency } from '../utils/format';

const screenWidth = Dimensions.get('window').width;

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

const CustomPieChart: React.FC<Props> = ({ data, selectedCategory, onSelectCategory, renderNoteDetails }) => {
  const total = data.reduce((sum, item) => sum + item.population, 0);
  if (total === 0) return <Text style={styles.emptyText}>Không có dữ liệu chi tiền</Text>;

  // Gom nhóm dữ liệu cho biểu đồ tròn (các danh mục thuộc "Khác" gom lại)
  const groupedData: { [key: string]: { population: number, color: string, names: string[], key: string } } = {};
  
  data.forEach(item => {
    const isOther = item.baseCategory === "Khác" || item.name === "Khác";
    const groupKey = isOther ? "Khác" : item.name;
    
    if (!groupedData[groupKey]) {
      groupedData[groupKey] = {
        key: groupKey,
        population: 0,
        color: isOther ? "#64748b" : item.color,
        names: []
      };
    }
    groupedData[groupKey].population += item.population;
    groupedData[groupKey].names.push(item.name);
  });

  const chartSlices = Object.values(groupedData).sort((a, b) => b.population - a.population);

  const radius = 80;
  const centerX = screenWidth / 2;
  const centerY = 150; // Dịch biểu đồ xuống dưới một chút
  
  let currentAngle = 0;

  const getCoordinatesForAngle = (angle: number, rad: number) => {
    const angleInRadians = (angle - 90) * Math.PI / 180.0;
    return {
      x: centerX + rad * Math.cos(angleInRadians),
      y: centerY + rad * Math.sin(angleInRadians),
    };
  };

  const arcs = chartSlices.map((slice) => {
    const sliceAngle = (slice.population / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    const midAngle = startAngle + sliceAngle / 2;
    currentAngle = endAngle;

    const isSelected = selectedCategory === slice.key || (selectedCategory !== null && slice.names.includes(selectedCategory));
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

    const percent = ((slice.population / total) * 100).toFixed(1) + "%";
    const lineStart = getCoordinatesForAngle(midAngle, activeRadius);
    const lineBreak = getCoordinatesForAngle(midAngle, activeRadius + 20);
    const isRightSide = midAngle >= 0 && midAngle < 180;
    
    let lineEnd = {
      x: lineBreak.x + (isRightSide ? 30 : -30),
      y: lineBreak.y
    };

    return {
      slice,
      pathData,
      isSelected,
      percent,
      lineStart,
      lineBreak,
      lineEnd,
      isRightSide,
    };
  });

  // Chống đè chữ: Cập nhật toạ độ Y của đường nối
  let rightY = -999;
  let leftY = 999;
  const MIN_Y_DISTANCE = 18;
  
  arcs.filter(a => a.isRightSide).forEach(arc => {
    if (rightY !== -999 && arc.lineEnd.y < rightY + MIN_Y_DISTANCE) {
      arc.lineEnd.y = rightY + MIN_Y_DISTANCE;
      arc.lineBreak.y = arc.lineEnd.y;
    }
    rightY = arc.lineEnd.y;
  });

  arcs.filter(a => !a.isRightSide).forEach(arc => {
    if (leftY !== 999 && arc.lineEnd.y > leftY - MIN_Y_DISTANCE) {
      arc.lineEnd.y = leftY - MIN_Y_DISTANCE;
      arc.lineBreak.y = arc.lineEnd.y;
    }
    leftY = arc.lineEnd.y;
  });

  return (
    <View style={styles.container}>
      <Svg width={screenWidth} height={300}>
        <G>
          {arcs.map((arc, index) => (
            <G key={`slice-${index}`} onPress={() => onSelectCategory(arc.slice.key)}>
              <Path
                d={arc.pathData}
                fill={arc.slice.color}
                stroke="#ffffff"
                strokeWidth={arc.isSelected ? 0 : 2}
              />
              <Polyline
                points={`${arc.lineStart.x},${arc.lineStart.y} ${arc.lineBreak.x},${arc.lineBreak.y} ${arc.lineEnd.x},${arc.lineEnd.y}`}
                fill="none"
                stroke={arc.slice.color}
                strokeWidth="1.5"
              />
              <Circle cx={arc.lineEnd.x} cy={arc.lineEnd.y} r="3" fill={arc.slice.color} />
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
            </G>
          ))}
        </G>
      </Svg>

      <ScrollView style={styles.scrollList} contentContainerStyle={styles.listContainer}>
        {data.filter(item => item.baseCategory !== "Khác" && item.name !== "Khác").map((item, index) => {
          const isSelfSelected = selectedCategory === item.name;
          return (
            <View key={`main-group-${index}`}>
              <TouchableOpacity
                style={[styles.listItem, isSelfSelected && styles.listItemSelected]}
                onPress={() => onSelectCategory(isSelfSelected ? "" : item.name)}
              >
                <View style={styles.listLeft}>
                  <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.listName, isSelfSelected && styles.listTextSelected]}>
                    {item.name}
                  </Text>
                </View>
                <Text style={[styles.listAmount, isSelfSelected && styles.listTextSelected]}>
                  {formatCurrency(item.population)} đ
                </Text>
              </TouchableOpacity>
              {isSelfSelected && renderNoteDetails && (
                <View style={styles.noteDetailsInList}>
                  {renderNoteDetails(item.name)}
                </View>
              )}
            </View>
          );
        })}

        {data.filter(item => item.baseCategory === "Khác" || item.name === "Khác").length > 0 && (
          <View style={styles.otherHeaderContainer}>
            <Text style={styles.otherHeaderText}>Thu chi khác</Text>
          </View>
        )}

        {data.filter(item => item.baseCategory === "Khác" || item.name === "Khác").map((item, index) => {
          const isGroupSelected = selectedCategory === "Khác";
          const isSelfSelected = selectedCategory === item.name;
          const isItemSelected = isSelfSelected || isGroupSelected;
          const groupColor = "#64748b";

          return (
            <View key={`other-group-${index}`}>
              <TouchableOpacity
                style={[styles.listItem, isItemSelected && styles.listItemSelected]}
                onPress={() => onSelectCategory(isSelfSelected ? "" : item.name)}
              >
                <View style={styles.listLeft}>
                  <View style={[styles.colorDot, { backgroundColor: groupColor }]} />
                  <Text style={[styles.listName, isItemSelected && styles.listTextSelected]}>
                    {item.name}
                  </Text>
                </View>
                <Text style={[styles.listAmount, isItemSelected && styles.listTextSelected]}>
                  {formatCurrency(item.population)} đ
                </Text>
              </TouchableOpacity>
              {isSelfSelected && renderNoteDetails && (
                <View style={styles.noteDetailsInList}>
                  {renderNoteDetails(item.name)}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    paddingBottom: 20,
  },
  emptyText: {
    padding: 20,
    color: '#94a3b8',
    textAlign: 'center',
  },
  scrollList: {
    width: '100%',
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    paddingBottom: 40,
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  listItemSelected: {
    backgroundColor: '#3b82f6',
  },
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  listName: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
  },
  listAmount: {
    fontSize: 15,
    color: '#334155',
    fontWeight: 'bold',
  },
  listTextSelected: {
    color: '#ffffff',
  },
  noteDetailsInList: {
    backgroundColor: '#ffffff',
    marginHorizontal: 4,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 12,
    marginTop: -4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderTopWidth: 0,
    marginBottom: 8,
  },
  otherHeaderContainer: {
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
  },
  otherHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#475569',
  },
});

export default CustomPieChart;
