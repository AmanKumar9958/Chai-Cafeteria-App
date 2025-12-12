import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CustomSplash({ visible = true, ready = false, onDone }) {
  const progress = useRef(new Animated.Value(0)).current; // 0..1

  useEffect(() => {
    // Animate from 0 -> 0.9 quickly
    Animated.timing(progress, {
      toValue: 0.9,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    if (ready) {
      // Finish to 1.0 and then call onDone
      Animated.timing(progress, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) setTimeout(() => onDone && onDone(), 200);
      });
    }
  }, [ready, onDone, progress]);

  if (!visible) return null;

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: [0, SCREEN_WIDTH * 0.6] });

  return (
    <View style={{ position: 'absolute', inset: 0, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
      <ExpoImage
        source={require('../assets/images/android-icon-foreground.png')}
        style={{ width: SCREEN_WIDTH * 0.45, height: SCREEN_WIDTH * 0.45 }}
        contentFit="contain"
      />
      {/* Progress bar at bottom */}
      <View style={{ position: 'absolute', bottom: SCREEN_HEIGHT * 0.08, width: SCREEN_WIDTH * 0.6, height: 8, borderRadius: 9999, backgroundColor: '#EDE7E1', overflow: 'hidden' }}>
        <Animated.View style={{ width: barWidth, height: '100%', backgroundColor: '#E8751A' }} />
      </View>
    </View>
  );
}
