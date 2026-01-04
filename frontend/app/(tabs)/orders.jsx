// frontend/app/(tabs)/Orders.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, Animated, Easing, Platform, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import AnimatedPressable from '../../components/AnimatedPressable';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { useTabBarScroll } from '../../context/TabBarContext';

const RAW_API = process.env.EXPO_PUBLIC_API_URL || 'http://10.225.33.106:5000';
const API_URL = (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`);

export default function OrdersScreen() {
  const { t } = useTranslation();
  const onScroll = useTabBarScroll();
  const { userToken, user } = useAuth();
  const { addItemsBatch } = useCart() || {};
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'ios' ? Math.max(88, insets.bottom + 88) : 24;

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

  // Entrance animation hooks MUST be declared before any conditional returns (Rules of Hooks)
  const slideAnim = useRef(new Animated.Value(36)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ]).start();
  }, [slideAnim, fadeAnim]);

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
        <Animated.View style={{ transform: [{ translateX: slideAnim }], opacity: fadeAnim }}>
          <View className="items-center">
            <ExpoImage
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2822/2822682.png' }}
              style={{ width: 144, height: 144, marginBottom: 16 }}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
              <Text className="text-lg font-semibold text-chai-text-primary mb-1" numberOfLines={1}>
                {t('app.no_orders_yet') === 'app.no_orders_yet' ? 'No orders yet' : t('app.no_orders_yet')}
              </Text>
              <Text className="text-sm text-chai-text-secondary text-center mb-4">
                {t('app.no_orders_yet_description') === 'app.no_orders_yet_description' ? 'You haven\'t placed any orders yet.' : t('app.no_orders_yet_description')}
              </Text>
            <Pressable onPress={() => router.push('/(tabs)/menu')} className="bg-chai-primary px-5 py-3 rounded-full">
              <Text className="text-white font-semibold">{t('app.browse_menu')}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-chai-bg pt-4 mt-4" style={{ paddingBottom: bottomPadding + 40 }}>
      <View className="px-4 pb-2 flex-row items-center justify-between">
        <Text numberOfLines={1} adjustsFontSizeToFit className="text-3xl font-extrabold text-chai-text-primary flex-1 mr-2 py-2">{`${t('app.my_orders')}`}</Text>
        <AnimatedPressable onPress={fetchOrders} className="flex-row items-center gap-1 px-3 py-2 bg-chai-primary rounded-full" scaleTo={0.92} haptic="selection">
          <Ionicons name="refresh" size={16} color="#fff" />
          <Text className="text-white font-semibold">{`${t('app.refresh')}`}</Text>
        </AnimatedPressable>
      </View>
      <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }], opacity: fadeAnim }}>
      <FlatList
        onScroll={onScroll}
        scrollEventThrottle={16}
        data={orders}
        keyExtractor={o => o._id || String(o.id)}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="bg-white p-4 rounded-lg mx-4 mb-3 border border-chai-divider">
            <View className="flex-row justify-between items-center mb-1" style={{ flexWrap: 'nowrap' }}>
              <Text
                numberOfLines={1}
                ellipsizeMode="middle"
                style={{ flexShrink: 1 }}
                className="font-bold text-chai-text-primary"
              >
                Order ID: {item._id || item.id}
              </Text>
              {(() => {
                const s = item.status || 'Order Placed';
                const sty = statusStyle[s] || statusStyle['Order Placed'];
                return (
                  <View style={{ marginLeft: 8, flexShrink: 0 }} className={`px-2 py-1 rounded-full ${sty.bg}`}>
                    <Text className={`text-[10px] font-semibold ${sty.text}`}>{s}</Text>
                  </View>
                );
              })()}
            </View>
            {(() => {
              const d = item.createdAt ? new Date(item.createdAt) : null;
              const when = d ? d.toLocaleString() : null;
              const orderType = item.orderType || 'Pickup';
              const paymentType = item.paymentMethod || '—';
              let paymentBg = 'bg-gray-200', paymentText = 'text-gray-700';
              if (paymentType === 'Online Payment') { paymentBg = 'bg-green-100'; paymentText = 'text-green-700'; }
              else if (paymentType === 'COD') { paymentBg = 'bg-yellow-100'; paymentText = 'text-yellow-800'; }
              return (
                <View className="flex-row items-center mb-1 gap-2">
                  {when ? (
                    <Text className="text-[12px] text-chai-text-secondary">Placed on: {when}</Text>
                  ) : null}
                  <View className={`px-2 py-0.5 rounded-full ${orderType === 'Delivery' ? 'bg-blue-100' : 'bg-amber-100'}`} style={{ marginLeft: 4 }}>
                    <Text className={`text-[11px] font-semibold ${orderType === 'Delivery' ? 'text-blue-700' : 'text-amber-700'}`}>{orderType}</Text>
                  </View>
                  <View className={`px-2 py-0.5 rounded-full ${paymentBg}`} style={{ marginLeft: 4 }}>
                    <Text className={`text-[11px] font-semibold ${paymentText}`}>{paymentType}</Text>
                  </View>
                </View>
              );
            })()}
            <StatusProgress status={item.status} />
            {/* Payment badge now shown above */}
            <View className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
              {(item.items || []).map((it, idx) => (
                <View key={(it._id || it.id || '') + (it.variant || '') + idx} className="flex-row justify-between items-center mb-1.5 last:mb-0">
                  <View className="flex-row items-center flex-1 mr-2">
                    <Text className="text-xs font-bold text-gray-700 w-6">{it.qty || it.quantity || 1}x</Text>
                    <Text className="text-xs text-gray-800 flex-1 font-medium" numberOfLines={1}>
                      {it.name}
                      {(it.variant || it.portion) && (
                        <Text className="text-gray-500 font-normal">
                          {(() => {
                            const v = (it.variant || it.portion).toString().toLowerCase();
                            if (v.includes('half')) return ' (H)';
                            if (v.includes('full')) return ' (F)';
                            if (v.includes('6')) return ' (6)';
                            if (v.includes('12')) return ' (12)';
                            return ` (${it.variant || it.portion})`;
                          })()}
                        </Text>
                      )}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            {(!!item.couponCode || Number(item.discount || 0) > 0) && (
              <View className="mt-2 flex-row justify-between">
                <Text className="text-sm text-chai-text-secondary">Coupon {item.couponCode ? `(${item.couponCode})` : ''}</Text>
                {Number(item.discount || 0) > 0 && (
                  <Text className="text-sm text-chai-success">−₹{Number(item.discount).toFixed(2)}</Text>
                )}
              </View>
            )}
            <View className="flex-row justify-between mt-2 items-center">
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text className="text-sm text-chai-text-secondary">Items: {(item.items || []).length}</Text>
                {(() => {
                  const totalItems = (item.items || []).reduce((sum, it) => sum + (it.qty || it.quantity || 1), 0);
                  let mins = 25;
                  if (totalItems <= 2) mins = 7;
                  else if (totalItems <= 5) mins = 12;
                  else if (totalItems <= 10) mins = 18;
                  // Style for ready time
                  return (
                    <Text className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-800 font-medium" style={{ backgroundColor: '#e6f9ec' }}>
                      Order ready in <Text className="font-bold">{mins}</Text> min{mins > 1 ? 's' : ''}
                    </Text>
                  );
                })()}
              </View>
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
                <AnimatedPressable
                  onPress={() => {
                    try {
                      addItemsBatch && addItemsBatch(item.items || []);
                      // Use bannerSuccess variant and rely on global top positioning
                      Toast.show({ type: 'bannerSuccess', text1: 'Reordered', text2: 'Items added to cart' });
                      router.push('/cart');
                    } catch (e) {
                      Toast.show({ type: 'bannerError', text1: 'Failed to reorder', text2: String(e?.message || e) });
                    }
                  }}
                  className="bg-chai-primary py-3 rounded-full items-center"
                  scaleTo={0.95}
                  haptic="selection"
                >
                  <Text className="text-white font-semibold">Reorder</Text>
                </AnimatedPressable>
              </View>
            )}
          </View>
        )}
      />
      </Animated.View>
    </SafeAreaView>
  );
}