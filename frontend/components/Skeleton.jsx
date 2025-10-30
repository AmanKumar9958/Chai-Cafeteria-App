import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

// Lightweight pulsing skeleton block with no extra deps
// Usage: <Skeleton width={"100%"} height={120} borderRadius={16} style={{ marginBottom: 16 }} />
export default function Skeleton({ width = '100%', height = 120, borderRadius = 12, style }) {
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.6, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E5E7EB', // Tailwind gray-200
          opacity,
        },
        style,
      ]}
    />
  );
}
