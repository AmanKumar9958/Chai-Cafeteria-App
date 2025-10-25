// frontend/app/(tabs)/_layout.jsx
import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#E8751A',
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: {
          height: 64,
          borderTopWidth: 0,
          backgroundColor: '#fff',
          position: 'absolute',
          left: '2.5%',
          right: '2.5%',
          bottom: 8,
          borderRadius: 18,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        },
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