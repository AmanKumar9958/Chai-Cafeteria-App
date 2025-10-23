// frontend/app/(tabs)/profile.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const RAW_API = process.env.EXPO_PUBLIC_API_URL || 'http://10.225.33.106:5000';
const API_URL = (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`);

export default function ProfileScreen() {
  const { logout, userToken } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${userToken}` } });
        setUser(res.data.user);
      } catch (err) {
        console.error('Failed to load profile', err?.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userToken]);

  const confirmLogout = () => {
    Alert.alert('Confirm logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const display = user || { name: 'User', email: '-', phone: '-', address1: '-', address2: '-' };

  return (
    <SafeAreaView className="flex-1 bg-white p-6">
      <View className="items-center mt-2 mb-6">
        <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center">
          <Text className="text-xl font-bold">{(display.name || 'U').charAt(0)}</Text>
        </View>
      </View>

      <View className="bg-white rounded-xl p-4 shadow-md">
        <View className="flex-row items-center mb-4">
          <View className="flex-1">
            <Text className="text-sm text-gray-400">Full Name</Text>
            <Text className="text-lg font-bold">{display.name}</Text>
          </View>
        </View>

        <View className="flex-row items-center mb-4">
          <View className="flex-1">
            <Text className="text-sm text-gray-400">Email</Text>
            <Text className="text-base">{display.email}</Text>
          </View>
        </View>

        <View className="flex-row items-center mb-4">
          <View className="flex-1">
            <Text className="text-sm text-gray-400">Phone number</Text>
            <Text className="text-base">{display.phone || '-'}</Text>
          </View>
        </View>

        <View className="flex-row items-center mb-4">
          <View className="flex-1">
            <Text className="text-sm text-gray-400">Address 1 - (Home)</Text>
            <Text className="text-base">{display.address1 || '-'}</Text>
          </View>
        </View>

        <View className="flex-row items-center mb-4">
          <View className="flex-1">
            <Text className="text-sm text-gray-400">Address 2 - (Work)</Text>
            <Text className="text-base">{display.address2 || '-'}</Text>
          </View>
        </View>
      </View>

      <Pressable onPress={() => { /* TODO: open edit profile */ }} className="mt-6 border-2 border-[#C7A27C] rounded-lg p-4 items-center">
        <Text className="text-[#C7A27C] font-bold">Edit Profile</Text>
      </Pressable>

      <Pressable onPress={confirmLogout} className="mt-4 border-2 border-red-300 rounded-lg p-4 items-center">
        <Text className="text-red-500 font-bold">Logout</Text>
      </Pressable>
    </SafeAreaView>
  );
}