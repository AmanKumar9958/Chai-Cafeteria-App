// frontend/app/(tabs)/home.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext'; // Go up two directories
import { router } from 'expo-router';
import { useCart } from '../../context/CartContext';
import axios from 'axios';

const RAW_API = process.env.EXPO_PUBLIC_API_URL || 'http://10.225.33.106:5000';
const API_URL = (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`);

export default function HomeScreen({ navigation }) {
  const { userToken } = useAuth();
  const { items: cartItems } = useCart();
  const [name, setName] = useState('User');
  const [greeting, setGreeting] = useState('Good Morning');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/menu/categories`);
        // show only first 5 categories on home to keep UI compact
        setCategories((res.data.categories || []).slice(0, 5));
      } catch (err) {
        console.error('Failed to load categories', err?.message || err);
      }
    };
    fetchCategories();
  }, []);

  // Load name from /auth/me if token present
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userToken) return;
      try {
        const res = await axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${userToken}` } });
        setName(res.data.user?.name || 'User');
      } catch (err) {
        console.error('Failed to get profile', err?.message || err);
      }
    };
    fetchProfile();
  }, [userToken]);

  const renderCategory = ({ item }) => (
    <Pressable className="bg-white rounded-lg p-4 mb-4 flex-row items-center justify-between" onPress={() => router.push({ pathname: '/(tabs)/menu', params: { category: item._id } })}>
      <Text className="text-lg font-bold">{item.name}</Text>
      <Text className="text-sm text-gray-400">›</Text>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB] p-6">
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-xl">{greeting}</Text>
          <Text className="text-2xl font-bold" numberOfLines={1} ellipsizeMode="tail">{name}</Text>
        </View>
        <Pressable className="relative" onPress={() => router.push('/cart')}>
          <Ionicons name="cart-outline" size={28} color="#111" />
          {cartItems.length > 0 && (
            <View className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center">
              {/* show total quantity, not number of distinct items */}
              <Text className="text-white text-xs">{cartItems.reduce((s, it) => s + (it.qty || 0), 0)}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-lg font-bold">Categories</Text>
        <Pressable onPress={() => router.push('/categories')} className="px-2">
          <Text className="text-sm text-gray-500">See all</Text>
        </Pressable>
      </View>

      <FlatList data={categories} renderItem={renderCategory} keyExtractor={c => c._id} />
    </SafeAreaView>
  );
}