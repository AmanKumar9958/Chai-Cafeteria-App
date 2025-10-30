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
import { Image as ExpoImage } from 'expo-image';

const RAW_API = process.env.EXPO_PUBLIC_API_URL || 'http://10.225.33.106:5000';
const API_URL = (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`);

export default function OrdersScreen() {
  const { userToken, user } = useAuth();
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
      const incoming = res.data.orders || [];
      // Defensive: filter orders to current user, in case backend forgets to scope
      const myId = user?._id || user?.id || user?.userId || user?.uid || null;
      const myEmail = user?.email || user?.username || null;
      const mine = incoming.filter((o) => {
        const oid = o?.user?._id || o?.userId || o?.user || o?.customerId || null;
        const oemail = o?.user?.email || o?.userEmail || o?.email || null;
        // Match by id when possible, else by email as a fallback
        if (myId && oid && String(oid) === String(myId)) return true;
        if (!myId && myEmail && oemail && String(oemail).toLowerCase() === String(myEmail).toLowerCase()) return true;
        // If backend did not include any user marker, we can't be certain; drop it.
        if (!oid && !oemail) return false;
        return false;
      });
      setOrders(mine);
    } catch (err) {
      console.warn('Failed to load orders, treating as none', err?.response?.status || err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [userToken, user]);

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
      <SafeAreaView className="flex-1 items-center justify-center bg-chai-bg px-8">
        <View className="items-center">
          <ExpoImage
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2822/2822682.png' }}
            style={{ width: 144, height: 144, marginBottom: 16 }}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
          <Text className="text-lg font-semibold text-chai-text-primary mb-1">No orders yet</Text>
          <Text className="text-sm text-chai-text-secondary text-center mb-4">Your past orders will show up here once you place one.</Text>
          <Pressable onPress={() => router.push('/(tabs)/menu')} className="bg-chai-primary px-5 py-3 rounded-full">
            <Text className="text-white font-semibold">Browse menu</Text>
          </Pressable>
        </View>
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
        contentContainerStyle={{ paddingBottom: Math.max(32, insets.bottom + 100) }}
        showsVerticalScrollIndicator={false}
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
              {(() => {
                const toNum = (n) => {
                  if (n == null) return 0;
                  if (typeof n === 'number') return n;
                  if (typeof n === 'string') return Number(n.replace(/[^0-9.\-]/g, '')) || 0;
                  return Number(n) || 0;
                };
                const subtotal = (item.items || []).reduce((s, it) => s + toNum(it.price) * toNum(it.qty || it.quantity || 0), 0);
                const delivery = toNum(item.deliveryFee ?? item.totals?.delivery ?? 0);
                const discount = toNum(item.discount ?? item.totals?.discount ?? 0);
                const candidates = [item.total, item.totals?.total];
                const picked = candidates.map(toNum).find(n => Number.isFinite(n) && n > 0);
                const total = Number.isFinite(picked) && picked > 0 ? picked : Math.max(0, subtotal + delivery - discount);
                return (
                  <View className="flex-row items-center">
                    <Text className="text-sm font-semibold text-chai-text-primary">Total:</Text>
                    <Text className="text-sm font-semibold text-chai-text-primary ml-1">₹{toNum(total).toFixed(2)}</Text>
                  </View>
                );
              })()}
              
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