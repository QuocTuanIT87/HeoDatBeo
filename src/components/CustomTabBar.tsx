import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Plus } from "lucide-react-native";

export const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const MARGIN_HORIZONTAL = 16;
  const barWidth = windowWidth - MARGIN_HORIZONTAL * 2;
  const barHeight = 64;

  const c = barWidth / 2;
  const cornerRadius = 24;

  // SVG Path calculation for floating curved notch
  // Curves downward smoothly at the center to wrap around the floating FAB button
  const d = `
    M ${cornerRadius},0
    L ${c - 46},0
    C ${c - 28},0 ${c - 24},28 ${c},28
    C ${c + 24},28 ${c + 28},0 ${c + 46},0
    L ${barWidth - cornerRadius},0
    Q ${barWidth},0 ${barWidth},${cornerRadius}
    L ${barWidth},${barHeight - cornerRadius}
    Q ${barWidth},${barHeight} ${barWidth - cornerRadius},${barHeight}
    L ${cornerRadius},${barHeight}
    Q 0,${barHeight} 0,${barHeight - cornerRadius}
    L 0,${cornerRadius}
    Q 0,0 ${cornerRadius},0
    Z
  `;

  const bottomInset = Math.max(insets.bottom, 12);

  // Divide routes into left items, middle item (center FAB), right items
  const centerIndex = Math.floor(state.routes.length / 2);

  return (
    <View
      style={[
        styles.container,
        {
          bottom: bottomInset,
          marginHorizontal: MARGIN_HORIZONTAL,
          width: barWidth,
        },
      ]}
      pointerEvents="box-none"
    >
      {/* Background SVG shape with notch */}
      <View style={styles.svgContainer}>
        <Svg width={barWidth} height={barHeight}>
          <Path d={d} fill="#1e1e1e" />
        </Svg>
      </View>

      {/* Tab buttons layout */}
      <View style={[styles.tabsRow, { height: barHeight }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          // Render Center Floating Action Button (FAB)
          if (index === centerIndex) {
            return (
              <View key={route.key} style={styles.centerTabItem}>
                <TouchableOpacity
                  onPress={onPress}
                  onLongPress={onLongPress}
                  activeOpacity={0.85}
                  style={styles.fabButtonContainer}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                >
                  <View style={styles.fabButton}>
                    <Plus color="#FFFFFF" size={26} strokeWidth={2.5} />
                  </View>
                </TouchableOpacity>
              </View>
            );
          }

          // Side tab buttons
          const activeColor = options.tabBarActiveTintColor || "#3b82f6";
          const inactiveColor = options.tabBarInactiveTintColor || "#475569";
          const iconColor = isFocused ? activeColor : inactiveColor;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.7}
              style={styles.tabItem}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
            >
              <View style={styles.iconWrapper}>
                {options.tabBarIcon
                  ? options.tabBarIcon({
                      focused: isFocused,
                      color: iconColor,
                      size: 24,
                    })
                  : null}
                {/* Active Indicator Line below active tab */}
                {isFocused && (
                  <View
                    style={[
                      styles.activeIndicator,
                      { backgroundColor: activeColor },
                    ]}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignSelf: "center",
    height: 64,
    backgroundColor: "transparent",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  svgContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  centerTabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fabButtonContainer: {
    position: "absolute",
    top: -40,
    alignItems: "center",
    justifyContent: "center",
  },
  fabButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#3b82f6",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    height: 40,
  },
  activeIndicator: {
    width: 14,
    height: 3,
    marginTop: 4,
  },
});

export default CustomTabBar;
