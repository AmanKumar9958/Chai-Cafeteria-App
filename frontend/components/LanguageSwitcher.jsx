import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import AnimatedPressable from './AnimatedPressable';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../i18n';

// Simple language switcher between English and Hindi.
// Usage: <LanguageSwitcher style={{ position: 'absolute', top: 8, right: 16 }} />
// All screens using i18next will re-render when language changes.
export default function LanguageSwitcher({ style }) {
  const { i18n: instance } = useTranslation();
  const current = instance.language || 'en';

  // Single toggle knob animation: 0 = EN (left), 1 = HI (right)
  const anim = useRef(new Animated.Value(current === 'en' ? 0 : 1)).current;
  const [width, setWidth] = useState(0);
  const knobSize = 32; // diameter of the moving button
  const paddingX = 4; // horizontal padding inside track

  useEffect(() => {
    Animated.timing(anim, {
      toValue: current === 'en' ? 0 : 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [current, anim]);

  const trackTravel = Math.max(0, (width - paddingX * 2) - knobSize); // distance knob can travel
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, trackTravel] });

  const toggle = useCallback(() => {
    const next = current === 'en' ? 'hi' : 'en';
    setLanguage(next).catch(e => console.warn('Failed to change language', e));
  }, [current]);

  return (
    <AnimatedPressable
      onPress={toggle}
      scaleTo={0.95}
      haptic="selection"
      accessibilityRole="button"
      accessibilityLabel="Toggle language"
      accessibilityHint="Switch between English and Hindi"
      style={style}
      className="mt-10"
    >
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        className="flex-row items-center bg-white/80 backdrop-blur-sm border border-chai-divider rounded-full"
        style={{ paddingVertical: 6, paddingHorizontal: paddingX, minWidth: 92 }}
      >
        {/* Labels */}
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 }}>
          <Text
            className={`text-[11px] font-semibold ${current === 'en' ? 'text-chai-text-primary' : 'text-chai-text-secondary'}`}
            numberOfLines={1}
          >EN</Text>
          <Text
            className={`text-[11px] font-semibold ${current === 'hi' ? 'text-chai-text-primary' : 'text-chai-text-secondary'}`}
            numberOfLines={1}
          >हिं</Text>
        </View>
        {/* Moving knob */}
        {width > 0 && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: paddingX,
              top: 4,
              width: knobSize,
              height: knobSize,
              borderRadius: knobSize / 2,
              transform: [{ translateX }],
            }}
            className="bg-chai-primary shadow-sm"
          >
            <View className="flex-1 items-center justify-center">
              <Text className="text-white text-[11px] font-bold" numberOfLines={1}>{current === 'en' ? 'EN' : 'हिं'}</Text>
            </View>
          </Animated.View>
        )}
      </View>
    </AnimatedPressable>
  );
}
