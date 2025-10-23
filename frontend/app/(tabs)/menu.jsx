// frontend/app/(tabs)/menu.jsx
import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MenuScreen() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center">
      <Text className="text-2xl">Menu Screen</Text>
    </SafeAreaView>
  );
}