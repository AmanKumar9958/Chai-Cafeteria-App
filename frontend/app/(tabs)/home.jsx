// frontend/app/(tabs)/home.jsx
import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext'; // Go up two directories

export default function HomeScreen() {
  const { userToken, logout } = useAuth();

  // We'll decode the JWT to get user info later
  // For now, this is a placeholder screen

  return (
    <SafeAreaView className="flex-1 items-center justify-center">
      <Text className="text-2xl font-bold">Home Screen</Text>
      <Text className="mt-4">Welcome!</Text>
      {/* We can add a temporary logout button for testing */}
    </SafeAreaView>
  );
}