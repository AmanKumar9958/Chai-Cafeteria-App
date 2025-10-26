import "../global.css"; // Import your global styles
// frontend/app/_layout.jsx
import React, { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import * as SplashScreen from 'expo-splash-screen';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { registerForPushNotificationsAsync, sendPushTokenToBackend, scheduleRegularNotifications, subscribeForegroundNotification, subscribeNotificationResponse } from '../utils/notifications';
import CustomSplash from '../components/CustomSplash';

SplashScreen.preventAutoHideAsync();

function MainLayout() {
  const { userToken, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Hide native splash ASAP so we can show our custom splash with progress
  useEffect(() => {
    (async () => {
      try { await SplashScreen.hideAsync(); } catch {}
    })();
  }, []);
  
  useEffect(() => {
    let unsubscribe = null;
    let unsubscribeResponse = null;
    const initNotifications = async () => {
      if (!userToken) return;
      // Remote push registration can be disabled via env (EXPO_PUBLIC_ENABLE_REMOTE_PUSH=false)
      const expoPushToken = await registerForPushNotificationsAsync();
      if (expoPushToken) await sendPushTokenToBackend(expoPushToken, userToken);
      await scheduleRegularNotifications(); // 2x per day default
      // Optional: show a toast in foreground when notifications arrive
      unsubscribe = subscribeForegroundNotification(() => {
        Toast.show({ type: 'info', text1: 'New update', text2: 'Check your orders for latest status.' });
      });
      // When user taps a notification, navigate to Orders
      unsubscribeResponse = subscribeNotificationResponse(() => {
        try { router.push('/(tabs)/orders'); } catch {}
      });
    };
    if (!isLoading && userToken) {
      initNotifications();
    }
    return () => { if (unsubscribe) unsubscribe(); if (unsubscribeResponse) unsubscribeResponse(); };
  }, [isLoading, userToken]);

  // Navigation from root path is handled by app/index.jsx to avoid unmatched route

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="verify-otp" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      {showSplash && (
        <CustomSplash
          visible={true}
          ready={!isLoading}
          onDone={() => setShowSplash(false)}
        />
      )}
    </>
  );
}

export default function RootLayout() {
  // Stylish toast config with brand colors and top positioning by default
  const toastConfig = {
    success: (props) => (
      <BaseToast
        {...props}
        style={{ borderLeftColor: '#16a34a', backgroundColor: '#F0FDF4', borderRadius: 14 }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{ fontSize: 16, fontWeight: '700', color: '#065F46' }}
        text2Style={{ fontSize: 13, color: '#065F46' }}
      />
    ),
    error: (props) => (
      <ErrorToast
        {...props}
        style={{ borderLeftColor: '#dc2626', backgroundColor: '#FEF2F2', borderRadius: 14 }}
        text1Style={{ fontSize: 16, fontWeight: '700', color: '#7F1D1D' }}
        text2Style={{ fontSize: 13, color: '#7F1D1D' }}
      />
    ),
    info: (props) => (
      <BaseToast
        {...props}
        style={{ borderLeftColor: '#2563eb', backgroundColor: '#EFF6FF', borderRadius: 14 }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{ fontSize: 16, fontWeight: '700', color: '#1E3A8A' }}
        text2Style={{ fontSize: 13, color: '#1E3A8A' }}
      />
    ),
  };
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        <MainLayout />
        <Toast position="top" topOffset={60} config={toastConfig} />
      </CartProvider>
    </AuthProvider>
  );
}