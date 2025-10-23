// frontend/app/(tabs)/profile.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import Toast from 'react-native-toast-message';

const RAW_API = process.env.EXPO_PUBLIC_API_URL || 'http://10.225.33.106:5000';
const API_URL = (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`);

export default function ProfileScreen() {
  const { logout, userToken, refreshProfile } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address1: '', address2: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${userToken}` } });
        setUser(res.data.user);
        setForm({ name: res.data.user?.name || '', phone: res.data.user?.phone || '', address1: res.data.user?.address1 || '', address2: res.data.user?.address2 || '' });
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
    <SafeAreaView className="flex-1 bg-[#F9FAFB] p-6">
      <View className="items-center mt-2 mb-6">
        <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center">
          <Text className="text-xl font-bold">{(display.name || 'U').charAt(0)}</Text>
        </View>
      </View>

      <View className="bg-white rounded-xl p-4 shadow-md">
        {!isEditing ? (
          <>
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
          </>
        ) : (
          <>
            <View className="mb-4">
              <Text className="text-sm text-gray-400">Full Name</Text>
              <TextInput value={form.name} onChangeText={v => setForm(prev => ({ ...prev, name: v }))} className="border rounded p-2 mt-1" />
            </View>

            <View className="mb-4">
              <Text className="text-sm text-gray-400">Phone number</Text>
              <TextInput value={form.phone} onChangeText={v => setForm(prev => ({ ...prev, phone: v }))} className="border rounded p-2 mt-1" keyboardType="phone-pad" />
            </View>

            <View className="mb-4">
              <Text className="text-sm text-gray-400">Address 1 - (Home)</Text>
              <TextInput value={form.address1} onChangeText={v => setForm(prev => ({ ...prev, address1: v }))} className="border rounded p-2 mt-1" />
            </View>

            <View className="mb-4">
              <Text className="text-sm text-gray-400">Address 2 - (Work)</Text>
              <TextInput value={form.address2} onChangeText={v => setForm(prev => ({ ...prev, address2: v }))} className="border rounded p-2 mt-1" />
            </View>
          </>
        )}
      </View>

      {!isEditing ? (
        <Pressable onPress={() => setIsEditing(true)} className="mt-6 border-2 border-[#C7A27C] rounded-lg p-4 items-center">
          <Text className="text-[#C7A27C] font-bold">Edit Profile</Text>
        </Pressable>
      ) : (
        <View className="mt-6">
          <Pressable onPress={async () => {
            // Save profile
            try {
              const res = await axios.put(`${API_URL}/auth/me`, form, { headers: { Authorization: `Bearer ${userToken}` } });
              // refresh local profile from context
              await refreshProfile();
              setUser(res.data.user);
              setIsEditing(false);
              Toast.show({ type: 'success', text1: 'Profile updated' });
            } catch (err) {
              console.error('Failed to update profile', err?.response?.data || err.message);
              const msg = err?.response?.data?.msg || err?.response?.data || 'Failed to update profile';
              Toast.show({ type: 'error', text1: 'Update failed', text2: String(msg) });
            }
          }} className="border-2 border-[#C7A27C] rounded-lg p-4 items-center">
            <Text className="text-[#C7A27C] font-bold">Save Changes</Text>
          </Pressable>

          <Pressable onPress={() => { setIsEditing(false); setForm({ name: user?.name || '', phone: user?.phone || '', address1: user?.address1 || '', address2: user?.address2 || '' }); }} className="mt-4 border-2 border-gray-200 rounded-lg p-4 items-center">
            <Text className="text-gray-600">Cancel</Text>
          </Pressable>
        </View>
      )}

      <Pressable onPress={confirmLogout} className="mt-4 border-2 border-red-300 rounded-lg p-4 items-center">
        <Text className="text-red-500 font-bold">Logout</Text>
      </Pressable>
    </SafeAreaView>
  );
}