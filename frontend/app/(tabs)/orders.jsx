// frontend/app/(tabs)/Orders.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const RAW_API = process.env.EXPO_PUBLIC_API_URL || 'http://10.225.33.106:5000';
const API_URL = (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`);

export default function OrdersScreen() {
  const { userToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/orders`, { headers: { Authorization: `Bearer ${userToken}` } });
        setOrders(res.data.orders || []);
      } catch (err) {
        // If server doesn't have orders endpoint or returns empty, just treat as no orders
        console.warn('Failed to load orders, treating as none', err?.response?.status || err.message);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [userToken]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-gray-500" numberOfLines={1} ellipsizeMode="tail">You have no orders yet</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB] p-4">
      <FlatList
        data={orders}
        keyExtractor={o => o._id || String(o.id)}
        renderItem={({ item }) => (
          <View className="bg-white p-4 rounded-lg mb-3">
            <Text className="font-bold">Order #{item._id || item.id}</Text>
            <Text className="text-sm text-gray-500">Items: {(item.items || []).length}</Text>
            <Text className="text-sm">Total: ₹{item.total || item.amount || 0}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}