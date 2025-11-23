import React, { useRef } from 'react';
import { Pressable, TouchableOpacity, Animated, Easing, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// A reusable pressable with micro‑interaction: scale + optional haptic.
// Props: onPress, children, style, className, disabled, scaleTo (default 0.94), haptic ('selection' | false)
export default function AnimatedPressable({
  children,
  onPress,
  style,
  className,
  disabled,
  scaleTo = 0.94,
  haptic = 'selection',
  onPressIn,
  onPressOut,
  ...rest
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const runScale = (to) => {
    Animated.timing(scale, {
      toValue: to,
      duration: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handlePressIn = (e) => {
    if (!disabled) runScale(scaleTo);
    onPressIn && onPressIn(e);
  };
  const handlePressOut = (e) => {
    runScale(1);
    onPressOut && onPressOut(e);
  };
  const handlePress = async (e) => {
    if (haptic && Platform.OS !== 'web') {
      try { Haptics.selectionAsync(); } catch {}
    }
    onPress && onPress(e);
  };

  // Fallback for environments where Pressable might be missing (older RN / web regression)
  const BaseComponent = Pressable || TouchableOpacity;
  const AnimatedPressableComponent = Animated.createAnimatedComponent(BaseComponent);

  return (
    <AnimatedPressableComponent
      {...rest}
      disabled={disabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, { transform: [{ scale }] }]}
      className={className}
    >
      {children}
    </AnimatedPressableComponent>
  );
}
