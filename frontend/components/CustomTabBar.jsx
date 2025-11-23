import React from 'react';
import { View, Dimensions, Animated, Platform } from 'react-native';
import AnimatedPressable from './AnimatedPressable';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const CustomTabBar = ({ state, descriptors, navigation }) => {
    const insets = useSafeAreaInsets();

  // Reduce excessive bottom gap on Android with 3-button navigation by clamping
  // the safe-area inset influence. Keep full inset on iOS/gesture nav.
  const rawInset = insets.bottom || 0;
  const hasInset = rawInset > 0;
  // Symmetric padding so icons remain visually centered
  const computedPad = Platform.OS === 'android'
    ? (hasInset ? Math.min(rawInset, 10) : 8)
    : rawInset;
  const padTop = computedPad;
  const padBottom = computedPad;
  // Lift the bar when Android returns zero inset (3-button nav often overlays app)
  const positionBottom = Platform.OS === 'android'
    ? (hasInset ? 8 + rawInset : 14)
    : 8 + rawInset;
  // Slightly smaller base height to reduce vertical footprint
  const BASE_HEIGHT = 56;
  const barHeight = BASE_HEIGHT + padTop + padBottom;

  return (
    <View
      style={{
        flexDirection: 'row',
        height: barHeight,
        paddingTop: padTop,
        paddingBottom: padBottom,
        backgroundColor: '#fff',
        position: 'absolute',
        left: '2.5%',
        right: '2.5%',
        bottom: positionBottom,
        borderRadius: 18,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

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

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const iconName =
          label === 'Home'
            ? isFocused
              ? 'home-variant'
              : 'home-variant-outline'
            : label === 'Menu'
            ? isFocused
              ? 'silverware-fork-knife'
              : 'silverware'
            : label === 'Orders'
            ? 'shopping-outline'
            : label === 'Profile'
            ? isFocused
              ? 'account-circle'
              : 'account-circle-outline'
            : 'help-circle';

        return (
          <AnimatedPressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            scaleTo={0.9}
            haptic={false}
          >
            <MaterialCommunityIcons
              name={iconName}
              size={26}
              color={isFocused ? '#E8751A' : '#757575'}
            />
          </AnimatedPressable>
        );
      })}
    </View>
  );
};

export default CustomTabBar;
