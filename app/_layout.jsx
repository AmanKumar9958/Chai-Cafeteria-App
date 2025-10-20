import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext'; // <-- STEP 1: Import CartProvider

export default function RootLayout() {
  return (
    // AuthProvider is the outermost provider
    <AuthProvider>
      {/* STEP 2: CartProvider is nested inside, wrapping the navigator */}
      <CartProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* All screens below can now access both Auth and Cart contexts */}
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}