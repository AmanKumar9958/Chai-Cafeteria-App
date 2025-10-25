import React, { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { isLoading, userToken } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (userToken) router.replace('/(tabs)/home');
    else router.replace('/login');
  }, [isLoading, userToken]);

  return <View />; // Empty screen while redirecting
}
