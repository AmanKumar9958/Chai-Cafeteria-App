import { View } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import LandingScreen from './landing';

export default function Index() {
  const { isLoading, userToken } = useAuth();

  useEffect(() => {
    if (!isLoading && userToken) {
      router.replace('/(tabs)/home');
    }
  }, [isLoading, userToken]);

  if (isLoading) return <View />;

  if (!userToken) {
    return (
      <LandingScreen onGetStarted={() => router.replace('/login')} />
    );
  }

  return <View />;
}