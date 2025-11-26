import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import AnimatedPressable from './AnimatedPressable'; // Ensure this file exists in your project
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 1. Updated to exactly 4 Tabs as requested
const TAB_ICONS = [
  { name: 'home', label: 'Home' },
  { name: 'search', label: 'Menu' },
  { name: 'file-text', label: 'Orders' }, // 'file-text' represents History/Orders well
  { name: 'user', label: 'Profile' },
];

const ACTIVE_COLOR = '#E8751A';
const INACTIVE_COLOR = '#999';
const BAR_BG = '#fff';

// 2. Dimensions Configuration
const SCREEN_WIDTH = Dimensions.get('window').width;
const MARGIN_SIDE = 16; // Distance from sides of screen
const BAR_WIDTH = SCREEN_WIDTH - (MARGIN_SIDE * 2);
const TAB_COUNT = TAB_ICONS.length;
const TAB_WIDTH = BAR_WIDTH / TAB_COUNT; // Dynamic width based on 4 tabs
const INDICATOR_WIDTH = 40;
const INDICATOR_HEIGHT = 4;

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  
  // 3. Layout Fix: Push bar up above the Home Indicator (black line)
  const bottomMargin = Platform.OS === 'ios' ? Math.max(insets.bottom, 20) : 20;

  // Animated Shared Value
  const indicatorX = useSharedValue(0);

  // 4. Smooth Animation Logic
  useEffect(() => {
    const targetX = state.index * TAB_WIDTH + (TAB_WIDTH - INDICATOR_WIDTH) / 2;
    
    // withSpring makes the movement feel organic/smooth
    indicatorX.value = withSpring(targetX, {
      damping: 14,
      stiffness: 150,
      mass: 0.8,
    });
  }, [state.index, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View style={[styles.container, { bottom: bottomMargin }]}>
      <View style={styles.bar}>
        
        {/* The Sliding Indicator */}
        <Animated.View style={[styles.activeIndicator, indicatorStyle]} />

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined ? options.tabBarLabel : route.name;

          // Logic to match the route to our Icon list
          // Note: Ensure your Navigator screen names match these labels or logical equivalents
          const tabIdx = TAB_ICONS.findIndex(
            tab => tab.label === label || tab.label.toLowerCase() === route.name.toLowerCase()
          );
          
          // Fallback icon if no match found
          const iconName = tabIdx !== -1 ? TAB_ICONS[tabIdx].name : 'circle';
          
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <View key={route.key} style={styles.tabItem}>
              <AnimatedPressable
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={onPress}
                style={styles.iconContainer}
                scaleTo={0.9} 
              >
                <Feather
                  name={iconName}
                  size={24}
                  color={isFocused ? ACTIVE_COLOR : INACTIVE_COLOR}
                />
              </AnimatedPressable>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: MARGIN_SIDE,
    right: MARGIN_SIDE,
    // Shadows for the floating effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 100,
  },
  bar: {
    flexDirection: 'row',
    height: 64, // Comfortable touch target height
    backgroundColor: BAR_BG,
    borderRadius: 20, // Rounded Rectangle (Squircleish), set to 32 for a full "Pill" shape
    alignItems: 'center',
    overflow: 'hidden',
  },
  tabItem: {
    width: TAB_WIDTH,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0, 
    height: INDICATOR_HEIGHT,
    width: INDICATOR_WIDTH,
    borderTopLeftRadius: INDICATOR_HEIGHT,
    borderTopRightRadius: INDICATOR_HEIGHT,
    backgroundColor: ACTIVE_COLOR,
    zIndex: 10,
  },
});

export default CustomTabBar;