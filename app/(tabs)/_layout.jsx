import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons'; // For the icons

export default function TabLayout() {
  return (
    <Tabs 
      screenOptions={{
        tabBarActiveTintColor: '#C7A27C', // A nice brown color for the active tab
        headerShown: false, // We will add custom headers in each screen later
      }}
    >
      <Tabs.Screen
        name="home" // This corresponds to the file home.jsx
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu" // This corresponds to the file menu.jsx
        options={{
          title: 'Menu',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="cutlery" color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders" // This corresponds to the file orders.jsx
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="shopping-bag" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile" // This corresponds to the file profile.jsx
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
