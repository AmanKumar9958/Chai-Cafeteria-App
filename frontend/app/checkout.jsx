import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';

const RAW_API = process.env.EXPO_PUBLIC_API_URL;
const API_URL = RAW_API ? (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`) : 'http://YOUR_COMPUTER_IP_ADDRESS:5000/api';

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { items, updateQty, removeItem, clear } = useCart();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('Pickup'); // Pickup | Delivery
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [payment, setPayment] = useState('COD'); // 'Online Payment' | 'COD'
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, type, value, discount, freeDelivery }
  const [couponMessage, setCouponMessage] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + (Number(it.price) * (it.qty || 0)), 0);
    let delivery = type === 'Delivery' ? 20 : 0; // example
    let discount = appliedCoupon?.discount || 0;
    if (appliedCoupon?.freeDelivery) delivery = 0;
    const total = Math.max(0, subtotal + delivery - discount);
    return { subtotal, delivery, discount, total };
  }, [items, type, appliedCoupon]);

  const canSubmit = useMemo(() => {
    if (items.length === 0) return false;
    if (!name.trim()) return false;
    if (!/^[0-9]{10}$/.test(phone)) return false;
    if (type === 'Delivery') {
      if (!address1.trim()) return false;
      if (!/^[0-9]{4,6}$/.test(pincode)) return false;
    }
    return true;
  }, [items.length, name, phone, type, address1, pincode]);

  const placeOrder = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload = {
        customer: { name, phone, email },
        type, // Pickup/Delivery
        address: type === 'Delivery' ? { address1, address2, landmark, pincode } : null,
        paymentMethod: payment,
        note,
        couponCode: appliedCoupon?.code || null,
        items: items.map(it => ({ itemId: it._id, name: it.name, price: Number(it.price), qty: it.qty })),
        totals,
      };
      await axios.post(`${API_URL}/orders`, payload);
      Toast.show({ type: 'success', text1: 'Order placed!', text2: "We'll get started right away.", position: 'bottom' });
      clear();
      router.replace('/(tabs)/orders');
    } catch (e) {
      console.error('Order failed', e?.response?.data || e?.message || e);
      Toast.show({ type: 'error', text1: 'Failed to place order', text2: 'Please try again.', position: 'bottom' });
    } finally {
      setSubmitting(false);
    }
  };

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setApplyingCoupon(true);
    try {
      const subtotal = items.reduce((s, it) => s + (Number(it.price) * (it.qty || 0)), 0);
      const { data } = await axios.post(`${API_URL}/coupons/validate`, { code, subtotal, orderType: type });
      if (data && data.valid) {
        setAppliedCoupon({ code: data.coupon.code, type: data.coupon.type, value: data.coupon.value, discount: data.discount || 0, freeDelivery: !!data.freeDelivery });
        setCouponMessage('Coupon applied');
        Toast.show({ type: 'success', text1: 'Coupon applied', position: 'bottom' });
      } else {
        setAppliedCoupon(null);
        setCouponMessage('Invalid coupon');
        Toast.show({ type: 'error', text1: 'Invalid coupon', position: 'bottom' });
      }
    } catch (err) {
      setAppliedCoupon(null);
      setCouponMessage(err?.response?.data?.msg || 'Invalid coupon');
      Toast.show({ type: 'error', text1: 'Invalid coupon', text2: err?.response?.data?.msg, position: 'bottom' });
    } finally {
      setApplyingCoupon(false);
    }
  };

  const QtyControl = ({ item }) => (
    <View className="flex-row items-center">
      <Pressable onPress={() => updateQty(item._id, Math.max(1, (item.qty || 1) - 1))} className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center"><Text>-</Text></Pressable>
      <Text className="mx-3 font-semibold">{item.qty || 0}</Text>
      <Pressable onPress={() => updateQty(item._id, (item.qty || 0) + 1)} className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center"><Text>+</Text></Pressable>
      <Pressable onPress={() => removeItem(item._id)} className="ml-3 px-3 py-1 rounded-full bg-red-100"><Text className="text-red-600 text-xs">Remove</Text></Pressable>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-chai-bg" style={{ paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 140 }} showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold mb-4 text-chai-text-primary">Checkout</Text>

        {/* Cart Summary */}
        <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-chai-divider">
          <Text className="text-lg font-semibold mb-3 text-chai-text-primary">Your Items</Text>
          {items.length === 0 ? (
            <Text className="text-chai-text-secondary">Your cart is empty.</Text>
          ) : (
            items.map(it => (
              <View key={it._id} className="flex-row items-center justify-between py-2 border-b border-chai-divider/60">
                <View style={{ flex: 1 }}>
                  <Text className="font-medium text-chai-text-primary" numberOfLines={1}>{it.name}</Text>
                  <Text className="text-chai-text-secondary">₹{Number(it.price).toFixed(2)}</Text>
                </View>
                <QtyControl item={it} />
              </View>
            ))
          )}
          <View className="mt-3">
            <View className="flex-row justify-between mb-1"><Text className="text-chai-text-secondary">Subtotal</Text><Text className="text-chai-text-primary">₹{totals.subtotal.toFixed(2)}</Text></View>
            {type === 'Delivery' && (
              <View className="flex-row justify-between mb-1"><Text className="text-chai-text-secondary">Delivery</Text><Text className="text-chai-text-primary">₹{totals.delivery.toFixed(2)}</Text></View>
            )}
            {appliedCoupon && appliedCoupon.type !== 'freeship' && totals.discount > 0 && (
              <View className="flex-row justify-between mb-1"><Text className="text-chai-text-secondary">Discount ({appliedCoupon.code})</Text><Text className="text-chai-success">-₹{totals.discount.toFixed(2)}</Text></View>
            )}
            {appliedCoupon && appliedCoupon.type === 'freeship' && (
              <View className="flex-row justify-between mb-1"><Text className="text-chai-text-secondary">Delivery Discount ({appliedCoupon.code})</Text><Text className="text-chai-success">-₹20.00</Text></View>
            )}
            <View className="flex-row justify-between mt-2">
              <Text className="font-semibold text-chai-text-primary">Total</Text>
              <Text className={`font-semibold ${appliedCoupon ? 'text-chai-success' : 'text-chai-text-primary'}`}>₹{totals.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Customer Info */}
        <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-chai-divider">
          <Text className="text-lg font-semibold mb-3 text-chai-text-primary">Customer</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Full name" className="bg-white border border-chai-divider rounded-xl px-4 py-3 mb-3 text-chai-text-primary" />
          <TextInput value={phone} onChangeText={setPhone} keyboardType="number-pad" maxLength={10} placeholder="Phone (10 digits)" className="bg-white border border-chai-divider rounded-xl px-4 py-3 mb-3 text-chai-text-primary" />
          <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="Email (optional)" className="bg-white border border-chai-divider rounded-xl px-4 py-3 text-chai-text-primary" />
        </View>

        {/* Order Type */}
        <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-chai-divider">
          <Text className="text-lg font-semibold mb-3 text-chai-text-primary">Order Type</Text>
          <View className="flex-row bg-[#FFF3E9] rounded-xl p-1">
            {['Pickup', 'Delivery'].map(opt => (
              <Pressable key={opt} onPress={() => setType(opt)} className={`flex-1 py-3 rounded-xl ${type === opt ? 'bg-chai-primary' : ''}`}>
                <Text className={`text-center font-medium ${type === opt ? 'text-white' : 'text-chai-text-primary'}`}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Coupon */}
        <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-chai-divider">
          <Text className="text-lg font-semibold mb-3 text-chai-text-primary">Have a coupon?</Text>
          <View className="flex-row items-center">
            <TextInput
              value={couponCode}
              onChangeText={setCouponCode}
              placeholder="Enter code (e.g. CHAI10)"
              autoCapitalize="characters"
              className="flex-1 bg-white border border-chai-divider rounded-xl px-4 py-3 mr-3 text-chai-text-primary"
            />
            {appliedCoupon ? (
              <Pressable onPress={() => { setAppliedCoupon(null); setCouponCode(''); setCouponMessage(''); Toast.show({ type: 'info', text1: 'Coupon removed', position: 'bottom' }); }} className="px-4 py-3 rounded-xl bg-gray-200">
                <Text className="font-medium text-gray-800">Remove</Text>
              </Pressable>
            ) : (
              <Pressable onPress={applyCoupon} disabled={applyingCoupon} className={`px-4 py-3 rounded-xl ${applyingCoupon ? 'bg-chai-primary opacity-60' : 'bg-chai-primary'}`}>
                <Text className="font-medium text-white">{applyingCoupon ? 'Applying...' : 'Apply'}</Text>
              </Pressable>
            )}
          </View>
          {!!couponMessage && (
            <Text className={`mt-2 text-sm ${appliedCoupon ? 'text-chai-success' : 'text-red-600'}`}>{couponMessage}</Text>
          )}
        </View>

        {/* Delivery Address */}
        {type === 'Delivery' && (
          <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-chai-divider">
            <Text className="text-lg font-semibold mb-3 text-chai-text-primary">Delivery Address</Text>
            <TextInput value={address1} onChangeText={setAddress1} placeholder="Address line 1" className="bg-white border border-chai-divider rounded-xl px-4 py-3 mb-3 text-chai-text-primary" />
            <TextInput value={address2} onChangeText={setAddress2} placeholder="Address line 2 (optional)" className="bg-white border border-chai-divider rounded-xl px-4 py-3 mb-3 text-chai-text-primary" />
            <TextInput value={landmark} onChangeText={setLandmark} placeholder="Landmark (optional)" className="bg-white border border-chai-divider rounded-xl px-4 py-3 mb-3 text-chai-text-primary" />
            <TextInput value={pincode} onChangeText={setPincode} keyboardType="number-pad" maxLength={6} placeholder="Pincode" className="bg-white border border-chai-divider rounded-xl px-4 py-3 text-chai-text-primary" />
          </View>
        )}

        {/* Payment */}
        <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-chai-divider">
          <Text className="text-lg font-semibold mb-3 text-chai-text-primary">Payment Method</Text>
          <View className="flex-row bg-[#FFF3E9] rounded-xl p-1">
            {['Online Payment', 'COD'].map(opt => (
              <Pressable key={opt} onPress={() => setPayment(opt)} className={`flex-1 py-3 rounded-xl ${payment === opt ? 'bg-chai-primary' : ''}`}>
                <Text className={`text-center font-medium ${payment === opt ? 'text-white' : 'text-chai-text-primary'}`}>{opt}</Text>
              </Pressable>
            ))}
          </View>
          {payment === 'Online Payment' && (
            <Text className="mt-2 text-xs text-chai-text-secondary">Online payments will be enabled soon (Razorpay integration coming).</Text>
          )}
          <TextInput value={note} onChangeText={setNote} placeholder="Add a note (optional)" className="mt-3 bg-white border border-chai-divider rounded-xl px-4 py-3 text-chai-text-primary" />
        </View>
      </ScrollView>

      {/* Submit bar */}
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 16 }}>
        <Pressable
          disabled={!canSubmit || submitting}
          onPress={placeOrder}
          className={`py-4 rounded-full items-center ${!canSubmit || submitting ? 'bg-gray-300' : 'bg-chai-primary'}`}
        >
          <Text className="text-white font-semibold">{submitting ? 'Placing order...' : `Place order • ₹${totals.total.toFixed(2)}`}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
