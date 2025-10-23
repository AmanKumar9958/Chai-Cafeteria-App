// frontend/app/(tabs)/_layout.jsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs 
      screenOptions={{
        tabBarActiveTintColor: '#C7A27C', // A color for the active tab icon
        headerShown: false, // We'll add custom headers in each screen
      }}
    >
      <Tabs.Screen
        name="home" // Corresponds to home.jsx
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="home-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu" // Corresponds to menu.jsx
        options={{
          title: 'Menu',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="restaurant-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders" // Corresponds to orders.jsx
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="cart-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile" // Corresponds to profile.jsx
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons size={24} name="person-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}