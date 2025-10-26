import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';
import { openRazorpayCheckout } from '../utils/razorpay';

const RAW_API = process.env.EXPO_PUBLIC_API_URL;
const API_URL = RAW_API ? (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`) : 'http://YOUR_COMPUTER_IP_ADDRESS:5000/api';
// Ensure Razorpay key is clean if .env value is quoted
const RZP_KEY = (process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '').replace(/^['"]|['"]$/g, '');
// Optional env overrides for backend paths (relative like "/payments/razorpay/create-order" or absolute "https://host/api/...")
const RZP_CREATE_PATH = (process.env.EXPO_PUBLIC_RAZORPAY_CREATE_PATH || '').trim();
const RZP_VERIFY_PATH = (process.env.EXPO_PUBLIC_RAZORPAY_VERIFY_PATH || '').trim();

// Helper to POST JSON with fallback paths (handles servers that mount different prefixes)
async function postJsonWithFallback(relativePaths, body) {
  let lastErr;
  const tried = [];
  for (const rel of relativePaths) {
    const isAbsolute = /^https?:\/\//i.test(rel);
    const url = isAbsolute ? rel : `${API_URL}${rel.startsWith('/') ? rel : `/${rel}`}`;
    tried.push(url);
    try {
      const res = await axios.post(url, body, { headers: { 'Content-Type': 'application/json' } });
      const contentType = String(res?.headers?.['content-type'] || '');
      if (contentType.includes('text/html')) {
        // Not a JSON API (likely 404 HTML). Try next fallback
        lastErr = new Error(`Unexpected HTML from ${url}`);
        continue;
      }
      return res;
    } catch (err) {
      // Save and continue to next path on 404/405/Not Found patterns
      const status = err?.response?.status || 0;
      const dataText = typeof err?.response?.data === 'string' ? err.response.data : '';
      const looksNotFound = status === 404 || status === 405 || /Cannot (GET|POST)/i.test(dataText || '');
      lastErr = err;
      if (looksNotFound) continue;
      // Other errors (500, CORS, network) – stop early
      break;
    }
  }
  const suffix = tried.length ? ` Tried: ${tried.join(', ')}` : '';
  const baseErr = lastErr || new Error('Request failed');
  baseErr.message = `${baseErr.message}${suffix}`;
  throw baseErr;
}

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
  const [paying, setPaying] = useState(false);
  const [checkingDistance, setCheckingDistance] = useState(false);
  const [distanceKm, setDistanceKm] = useState(null); // number | null
  const [deliveryAllowed, setDeliveryAllowed] = useState(null); // boolean | null (unknown)
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

  const DISABLE_DISTANCE_CHECK = String(process.env.EXPO_PUBLIC_DISABLE_DISTANCE_CHECK || '').toLowerCase() === 'true' || String(process.env.EXPO_PUBLIC_DISABLE_DISTANCE_CHECK || '') === '1';

  const canSubmit = useMemo(() => {
    if (items.length === 0) return false;
    if (!name.trim()) return false;
    if (!/^[0-9]{10}$/.test(phone)) return false;
    if (type === 'Delivery') {
      if (!address1.trim()) return false;
      if (!/^[0-9]{4,6}$/.test(pincode)) return false;
      // If we checked distance and it's not allowed, prevent submission
      if (!DISABLE_DISTANCE_CHECK && deliveryAllowed === false) return false;
    }
    return true;
  }, [items.length, name, phone, type, address1, pincode, deliveryAllowed, DISABLE_DISTANCE_CHECK]);

  // Cafe coordinates and radius (km)
  const DELIVERY_RADIUS_KM = Number(process.env.EXPO_PUBLIC_DELIVERY_RADIUS_KM || 5);
  const CAFE_LAT = Number(process.env.EXPO_PUBLIC_CAFE_LAT || 0);
  const CAFE_LNG = Number(process.env.EXPO_PUBLIC_CAFE_LNG || 0);

  const cafeCoordsAvailable = Number.isFinite(CAFE_LAT) && Number.isFinite(CAFE_LNG) && (CAFE_LAT !== 0 || CAFE_LNG !== 0);

  const haversineKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (d) => (d * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const checkDeliveryEligibility = async () => {
    if (String(process.env.EXPO_PUBLIC_DISABLE_DISTANCE_CHECK || '').toLowerCase() === 'true' || String(process.env.EXPO_PUBLIC_DISABLE_DISTANCE_CHECK || '') === '1') {
      setDeliveryAllowed(true);
      setDistanceKm(null);
      Toast.show({ type: 'info', text1: 'Distance check bypassed', text2: 'EXPO_PUBLIC_DISABLE_DISTANCE_CHECK is enabled', position: 'bottom' });
      return;
    }
    if (!cafeCoordsAvailable) {
      Toast.show({ type: 'error', text1: 'Cafe location not set', text2: 'Set EXPO_PUBLIC_CAFE_LAT/LNG in your env', position: 'bottom' });
      return;
    }
    setCheckingDistance(true);
    try {
      // Dynamically import to avoid route evaluation failure if native module isn't built yet
      const LocMod = await import('expo-location');
      const Loc = (LocMod && LocMod.default) ? LocMod.default : LocMod; // support both CJS/ESM shapes
      const permFn = Loc.requestForegroundPermissionsAsync || Loc.requestPermissionsAsync;
      if (typeof permFn !== 'function') {
        throw new Error('Location module not fully available. Rebuild the Dev Client after installing expo-location.');
      }
      const { status } = await permFn();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Location permission required', text2: 'Enable location to check delivery eligibility', position: 'bottom' });
        setDeliveryAllowed(null);
        return;
      }
      const accuracy = (Loc.Accuracy && Loc.Accuracy.Balanced) ? Loc.Accuracy.Balanced : undefined;
      const pos = await Loc.getCurrentPositionAsync({ accuracy });
      const userLat = pos?.coords?.latitude;
      const userLng = pos?.coords?.longitude;
      if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) throw new Error('Unable to read current location');
      const km = haversineKm(userLat, userLng, CAFE_LAT, CAFE_LNG);
      setDistanceKm(km);
      const allowed = km <= DELIVERY_RADIUS_KM;
      setDeliveryAllowed(allowed);
      if (!allowed) {
        // Force to Pickup + Online Payment only
        setType('Pickup');
        setPayment('Online Payment');
        Toast.show({ type: 'info', text1: `You are ${km.toFixed(1)} km away`, text2: 'Delivery unavailable. Pickup with advance payment only.', position: 'bottom' });
      } else {
        Toast.show({ type: 'success', text1: `You are ${km.toFixed(1)} km away`, text2: 'Delivery available with COD or Online Payment', position: 'bottom' });
      }
    } catch (err) {
      console.error('Distance check failed', err?.message || err);
      Toast.show({ type: 'error', text1: 'Could not check distance', text2: String(err?.message || 'Try again.'), position: 'bottom' });
      setDeliveryAllowed(null);
    } finally {
      setCheckingDistance(false);
    }
  };

  const placeOrder = async () => {
    if (!canSubmit) return;
    // If online payment, run Razorpay flow first, then place order with payment details
    if (payment === 'Online Payment') {
      return handleOnlinePaymentAndPlaceOrder();
    }
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

  const handleOnlinePaymentAndPlaceOrder = async () => {
    setPaying(true);
    try {
      // 1) Create Razorpay order on backend (amount in paise)
      const amountPaise = Math.round(totals.total * 100);
      if (!RZP_KEY) {
        Toast.show({ type: 'error', text1: 'Razorpay key missing', text2: 'Set EXPO_PUBLIC_RAZORPAY_KEY_ID in your env', position: 'bottom' });
        setPaying(false);
        return;
      }
      const createRes = await postJsonWithFallback(
        [
          RZP_CREATE_PATH,
          '/payments/razorpay/create-order',
          '/payment/razorpay/create-order',
          '/razorpay/create-order',
        ].filter(Boolean),
        {
          amount: amountPaise,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
          notes: { customer: name || '', phone, type },
        }
      );
      const { orderId } = createRes.data || {};
      if (!orderId) throw new Error('No orderId returned by backend');

      // 2) Open Razorpay checkout UI
      const paymentRes = await openRazorpayCheckout({
        key: RZP_KEY,
        amount: amountPaise,
        orderId,
        name: 'Chai Cafeteria',
        description: 'Order payment',
        prefill: { name, contact: phone, email },
        notes: { cartItems: String(items.length) },
      });

      // 3) Verify signature with backend
      const verifyRes = await postJsonWithFallback(
        [
          RZP_VERIFY_PATH,
          '/payments/razorpay/verify',
          '/payment/razorpay/verify',
          '/razorpay/verify',
        ].filter(Boolean),
        paymentRes
      );
      if (!verifyRes.data?.success) throw new Error('Payment verification failed');

      // 4) Place order with payment details
      setSubmitting(true);
      const payload = {
        customer: { name, phone, email },
        type,
        address: type === 'Delivery' ? { address1, address2, landmark, pincode } : null,
        paymentMethod: 'Online Payment',
        paymentDetails: {
          provider: 'razorpay',
          orderId: paymentRes?.razorpay_order_id,
          paymentId: paymentRes?.razorpay_payment_id,
          signature: paymentRes?.razorpay_signature,
        },
        note,
        couponCode: appliedCoupon?.code || null,
        items: items.map(it => ({ itemId: it._id, name: it.name, price: Number(it.price), qty: it.qty })),
        totals,
      };
      await axios.post(`${API_URL}/orders`, payload);
      Toast.show({ type: 'success', text1: 'Payment successful', text2: 'Order placed!', position: 'bottom' });
      clear();
      router.replace('/(tabs)/orders');
    } catch (e) {
      const status = e?.response?.status;
      const data = e?.response?.data;
      const msg = typeof data === 'string' ? data : (data?.message || e?.message);
      console.error('Online payment failed', data || msg || e);
      // Make the common route-missing case more readable to users
      const friendly = /Cannot (GET|POST)/i.test(String(msg)) || status === 404 || status === 405
        ? 'Payment API route not found on server. Please deploy the Razorpay endpoints.'
        : (msg || 'Please try again.');
      Toast.show({ type: 'error', text1: 'Payment failed', text2: friendly, position: 'bottom' });
    } finally {
      setPaying(false);
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
          <TextInput value={name} onChangeText={setName} placeholderTextColor="#757575" placeholder="Full name" className="bg-white border border-chai-divider rounded-xl px-4 py-3 mb-3 text-chai-text-primary" />
          <TextInput value={phone} onChangeText={setPhone} placeholderTextColor="#757575" keyboardType="number-pad" maxLength={10} placeholder="Phone (10 digits)" className="bg-white border border-chai-divider rounded-xl px-4 py-3 mb-3 text-chai-text-primary" />
          <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" placeholderTextColor="#757575" placeholder="Email (optional)" className="bg-white border border-chai-divider rounded-xl px-4 py-3 text-chai-text-primary" />
        </View>

        {/* Order Type */}
        <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-chai-divider">
          <Text className="text-lg font-semibold mb-3 text-chai-text-primary">Order Type</Text>
          <View className="flex-row bg-[#FFF3E9] rounded-xl p-1">
            {['Pickup', 'Delivery'].map(opt => {
              const disabled = opt === 'Delivery' && deliveryAllowed === false;
              return (
              <Pressable key={opt} onPress={() => { if (disabled) return; setType(opt); if (opt==='Delivery') checkDeliveryEligibility(); }} className={`flex-1 py-3 rounded-xl ${type === opt ? 'bg-chai-primary' : ''} ${disabled ? 'opacity-40' : ''}`}>
                <Text className={`text-center font-medium ${type === opt ? 'text-white' : 'text-chai-text-primary'}`}>{opt}</Text>
              </Pressable>
            );})}
          </View>
          <View className="mt-2">
            {deliveryAllowed === false && (
              <Text className="text-xs text-red-600">Outside {DELIVERY_RADIUS_KM} km radius. Delivery disabled; Pickup with advance payment only.</Text>
            )}
            {deliveryAllowed === true && (
              <Text className="text-xs text-chai-success">Within {DELIVERY_RADIUS_KM} km radius. Delivery available.</Text>
            )}
            {deliveryAllowed === null && (
              <Text className="text-xs text-chai-text-secondary">Tap Delivery to check eligibility based on your current location.</Text>
            )}
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
              placeholderTextColor="#757575"
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
            <TextInput value={address1} onChangeText={setAddress1} placeholderTextColor="#757575" placeholder="Address line 1" className="bg-white border border-chai-divider rounded-xl px-4 py-3 mb-3 text-chai-text-primary" />
            <TextInput value={address2} onChangeText={setAddress2} placeholderTextColor="#757575" placeholder="Address line 2 (optional)" className="bg-white border border-chai-divider rounded-xl px-4 py-3 mb-3 text-chai-text-primary" />
            <TextInput value={landmark} onChangeText={setLandmark} placeholderTextColor="#757575" placeholder="Landmark (optional)" className="bg-white border border-chai-divider rounded-xl px-4 py-3 mb-3 text-chai-text-primary" />
            <TextInput value={pincode} onChangeText={setPincode} keyboardType="number-pad" maxLength={6} placeholderTextColor="#757575" placeholder="Pincode" className="bg-white border border-chai-divider rounded-xl px-4 py-3 text-chai-text-primary" />
            <Pressable onPress={checkDeliveryEligibility} disabled={checkingDistance} className={`mt-3 px-4 py-3 rounded-xl ${checkingDistance ? 'bg-gray-300' : 'bg-chai-primary'}`}>
              <Text className="text-white font-medium">{checkingDistance ? 'Checking distance…' : 'Check delivery eligibility'}</Text>
            </Pressable>
            {Number.isFinite(distanceKm) && (
              <Text className="mt-2 text-xs text-chai-text-secondary">You are approximately {distanceKm.toFixed(2)} km from the cafe.</Text>
            )}
          </View>
        )}

        {/* Payment */}
        <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-chai-divider">
          <Text className="text-lg font-semibold mb-3 text-chai-text-primary">Payment Method</Text>
          <View className="flex-row bg-[#FFF3E9] rounded-xl p-1">
            {['Online Payment', 'COD'].map(opt => {
              const codDisabled = (deliveryAllowed === false) || (type === 'Delivery' && deliveryAllowed === false) || (type === 'Pickup' && deliveryAllowed === false);
              const disabled = (opt === 'COD') && codDisabled;
              const hidden = (opt === 'COD') && codDisabled; // hide COD when out of radius
              if (hidden) return null;
              return (
                <Pressable key={opt} onPress={() => !disabled && setPayment(opt)} className={`flex-1 py-3 rounded-xl ${payment === opt ? 'bg-chai-primary' : ''} ${disabled ? 'opacity-40' : ''}`}>
                  <Text className={`text-center font-medium ${payment === opt ? 'text-white' : 'text-chai-text-primary'}`}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>
          {payment === 'Online Payment' && (
            <Text className="mt-2 text-xs text-chai-text-secondary">You&apos;ll be redirected to Razorpay to complete payment securely.</Text>
          )}
          {payment === 'COD' && deliveryAllowed === false && (
            <Text className="mt-2 text-xs text-red-600">COD is not available outside the {DELIVERY_RADIUS_KM} km radius.</Text>
          )}
          <TextInput value={note} onChangeText={setNote} placeholderTextColor="#757575" placeholder="Add a note (optional)" className="mt-3 bg-white border border-chai-divider rounded-xl px-4 py-3 text-chai-text-primary" />
        </View>
      </ScrollView>

      {/* Submit bar */}
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 16 }}>
        <Pressable
          disabled={!canSubmit || submitting || paying}
          onPress={placeOrder}
          className={`py-4 rounded-full items-center ${!canSubmit || submitting || paying ? 'bg-gray-300' : 'bg-chai-primary'}`}
        >
              <Text className="text-white font-semibold">{paying ? 'Processing payment…' : (submitting ? 'Placing order...' : `Place order • ₹${totals.total.toFixed(2)}`)}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
