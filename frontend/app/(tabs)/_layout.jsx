// frontend/app/(tabs)/_layout.jsx
import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CustomTabBar from '../../components/CustomTabBar';
import { TabBarProvider } from '../../context/TabBarContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <TabBarProvider>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
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
                name={focused ? 'silverware-fork-knife' : 'silverware-fork-knife'}
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
                name={focused ? 'shopping' : 'shopping-outline'}
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
    </TabBarProvider>
  );
}