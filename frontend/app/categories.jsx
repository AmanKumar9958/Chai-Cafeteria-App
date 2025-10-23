import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { router } from 'expo-router';

const RAW_API = process.env.EXPO_PUBLIC_API_URL || 'http://10.225.33.106:5000';
const API_URL = (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`);

export default function CategoriesScreen() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API_URL}/menu/categories`);
        setCategories(res.data.categories || []);
      } catch (err) {
        console.error('Failed to load categories', err?.message || err);
      }
    };
    fetch();
  }, []);

  const renderCategory = ({ item }) => (
    <Pressable className="bg-white rounded-lg p-4 mb-4 flex-row items-center justify-between" onPress={() => router.push({ pathname: '/(tabs)/menu', params: { category: item._id } })}>
      <Text className="text-lg font-bold">{item.name}</Text>
      <Text className="text-sm text-gray-400">›</Text>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB] p-6">
      <View className="mb-4">
        <Text className="text-xl font-bold">Categories</Text>
      </View>

      <FlatList data={categories} renderItem={renderCategory} keyExtractor={c => c._id} />
    </SafeAreaView>
  );
}
