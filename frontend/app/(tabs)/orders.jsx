// frontend/app/(tabs)/Orders.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, Pressable, Animated, Easing } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';

const RAW_API = process.env.EXPO_PUBLIC_API_URL || 'http://10.225.33.106:5000';
const API_URL = (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`);

export default function OrdersScreen() {
  const { userToken } = useAuth();
  const { addItemsBatch } = useCart() || {};
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const insets = useSafeAreaInsets();

  const statusStyle = useMemo(() => ({
    'Order Placed': { bg: 'bg-[#FFF3E9]', text: 'text-chai-primary' },
    'Packing': { bg: 'bg-[#FFF3E9]', text: 'text-chai-primary' },
    'Shipped': { bg: 'bg-[#FFF3E9]', text: 'text-chai-primary' },
    'Out for delivery': { bg: 'bg-[#FFF3E9]', text: 'text-chai-primary' },
    'Delivered': { bg: 'bg-[#E9F5EC]', text: 'text-chai-success' },
    'Cancelled': { bg: 'bg-[#FBEAEA]', text: 'text-chai-error' },
  }), []);

  const fetchOrders = useCallback(async () => {
    if (!userToken) {
      setLoading(false);
      setOrders([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/orders`, { headers: { Authorization: `Bearer ${userToken}` } });
      setOrders(res.data.orders || []);
    } catch (err) {
      console.warn('Failed to load orders, treating as none', err?.response?.status || err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [userToken]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Progress indicator for order status
  const STEPS = useMemo(() => ['Order Placed', 'Packing', 'Shipped', 'Out for delivery', 'Delivered'], []);
  const StatusProgress = ({ status }) => {
    const idx = Math.max(0, STEPS.indexOf(status || 'Order Placed'));
    const pct = (idx / (STEPS.length - 1)) * 100;
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(anim, {
        toValue: pct,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }, [pct, anim]);

    const widthInterpolate = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

    return (
      <View className="mt-2">
        <View className="h-2 rounded-full bg-gray-200 overflow-hidden">
          <Animated.View style={{ width: widthInterpolate, height: '100%' }} className="bg-amber-500" />
        </View>
        <View className="flex-row justify-between mt-1">
          {STEPS.map((s) => (
            <Text key={s} className="text-[10px] text-gray-500" numberOfLines={1}>
              {s === 'Out for delivery' ? 'Out for delivery' : s}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-chai-bg">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-chai-bg">
        <Text className="text-lg text-gray-500" numberOfLines={1} ellipsizeMode="tail">You have no orders yet</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-chai-bg pt-4 mt-4" style={{ paddingBottom: Math.max(16, insets.bottom + 16) }}>
      <View className="px-4 pb-2 flex-row items-center">
        <Text className="text-2xl font-bold ml-2 mr-2 flex-1 text-chai-text-primary" numberOfLines={1}>My Orders</Text>
        <Pressable onPress={fetchOrders} className="flex-row items-center gap-1 px-3 py-2 bg-chai-primary rounded-full">
          <Ionicons name="refresh" size={16} color="#fff" />
          <Text className="text-white font-medium">Refresh</Text>
        </Pressable>
      </View>
      <FlatList
        data={orders}
        keyExtractor={o => o._id || String(o.id)}
        renderItem={({ item }) => (
          <View className="bg-white p-4 rounded-lg mx-4 mb-3 border border-chai-divider">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="font-bold text-chai-text-primary">Order ID: {item._id || item.id}</Text>
              {(() => {
                const s = item.status || 'Order Placed';
                const sty = statusStyle[s] || statusStyle['Order Placed'];
                return (
                  <View className={`px-2 py-1 rounded-full ${sty.bg}`}>
                    <Text className={`text-[10px] font-semibold ${sty.text}`}>{s}</Text>
                  </View>
                );
              })()}
            </View>
            <StatusProgress status={item.status} />
            <Text className="text-sm text-chai-text-secondary mb-2">Payment: {item.paymentMethod || '—'}</Text>
            <View className="mt-1">
              {(item.items || []).map((it, idx) => (
                <Text key={(it._id || it.id || idx) + ''} className="text-sm text-chai-text-primary">• {it.name} x {it.qty || it.quantity || 1}</Text>
              ))}
            </View>
            {(item.couponCode || item.discount) && (
              <View className="mt-2 flex-row justify-between">
                <Text className="text-sm text-chai-text-secondary">Coupon {item.couponCode ? `(${item.couponCode})` : ''}</Text>
                {Number(item.discount || 0) > 0 && (
                  <Text className="text-sm text-chai-success">−₹{Number(item.discount).toFixed(2)}</Text>
                )}
              </View>
            )}
            <View className="flex-row justify-between mt-2">
              <Text className="text-sm text-chai-text-secondary">Items: {(item.items || []).length}</Text>
              <Text className="text-sm font-semibold text-chai-text-primary">
                {(() => {
                  const subtotal = (item.items || []).reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || it.quantity || 0), 0);
                  const total = Number.isFinite(Number(item.total)) && Number(item.total) > 0
                    ? Number(item.total)
                    : Math.max(0, subtotal + Number(item.deliveryFee || 0) - Number(item.discount || 0));
                  return `Total: ₹${total.toFixed(2)}`;
                })()}
              </Text>
            </View>
            {String(item.status).toLowerCase() === 'delivered' && (
              <View className="mt-3">
                <Pressable
                  onPress={() => {
                    try {
                      addItemsBatch && addItemsBatch(item.items || []);
                      Toast.show({ type: 'success', text1: 'Reordered', text2: 'Items added to cart', position: 'bottom' });
                      router.push('/cart');
                    } catch (e) {
                      Toast.show({ type: 'error', text1: 'Failed to reorder', text2: String(e?.message || e) });
                    }
                  }}
                  className="bg-chai-primary py-3 rounded-full items-center"
                >
                  <Text className="text-white font-semibold">Reorder</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}