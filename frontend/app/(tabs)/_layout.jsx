// frontend/app/(tabs)/_layout.jsx
import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#E8751A',
        tabBarInactiveTintColor: '#757575',
        // Use a floating pill on iOS; use a standard fixed bar on Android to avoid overlap/clipping
        tabBarStyle: Platform.select({
          ios: {
            height: 64 + insets.bottom,
            paddingBottom: insets.bottom,
            borderTopWidth: 0,
            backgroundColor: '#fff',
            position: 'absolute',
            left: '2.5%',
            right: '2.5%',
            bottom: 8 + insets.bottom,
            borderRadius: 18,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          },
          default: {
            height: 64 + insets.bottom,
            paddingBottom: insets.bottom,
            borderTopWidth: 0,
            backgroundColor: '#fff',
            elevation: 6,
          },
        }),
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 6,
        },
        tabBarItemStyle: {
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="home" // Corresponds to home.jsx
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              size={26}
              color={color}
              name={focused ? 'home-variant' : 'home-variant-outline'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="menu" // Corresponds to menu.jsx
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              size={26}
              color={color}
              name={focused ? 'silverware-fork-knife' : 'silverware'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="orders" // Corresponds to orders.jsx
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              size={26}
              color={color}
              name={focused ? 'shopping-outline' : 'shopping-outline'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile" // Corresponds to profile.jsx
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              size={26}
              color={color}
              name={focused ? 'account-circle' : 'account-circle-outline'}
            />
          ),
        }}
      />
    </Tabs>
  );
}