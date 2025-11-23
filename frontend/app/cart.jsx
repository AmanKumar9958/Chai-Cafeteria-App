import React, { useRef, useEffect } from 'react';
import { View, Text, FlatList, Alert, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { router } from 'expo-router';
import AnimatedPressable from '../components/AnimatedPressable';
import { Ionicons, Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

export default function CartScreen() {
  const { t } = useTranslation();
  const { items, updateQty, removeItem, clear } = useCart();

  // Guard items in case the context is not yet initialized
  const itemsList = items || [];
  const total = itemsList.reduce((s, i) => s + (i.qty || 0) * (i.price || 0), 0);

  const renderItem = ({ item }) => (
    <View className="bg-white rounded-lg p-4 mb-4 flex-row items-center justify-between border border-chai-divider">
      <View style={{ flex: 1 }}>
        <Text className="font-bold text-chai-text-primary">{item.name}</Text>
        <Text className="text-sm text-chai-text-secondary">₹{item.price}</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <AnimatedPressable
          onPress={() => {
            const current = item.qty || 0;
            if (current <= 1) {
              Alert.alert('Remove item', `Remove ${item.name} from cart?`, [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: () => {
                    removeItem(item._id);
                    Toast.show({ type: 'bannerSuccess', text1: 'Removed from cart' });
                  }
                }
              ]);
              return;
            }
            // Fast decrement without toast for smoother UX
            updateQty(item._id, Math.max(0, current - 1));
          }}
          className="p-2 mr-2 bg-gray-200 rounded"
          scaleTo={0.85}
          haptic="selection"
        >
          <Feather name="minus" size={18} color="#111" />
        </AnimatedPressable>

        <Text className="mx-2 font-bold">{item.qty || 0}</Text>

        <AnimatedPressable onPress={() => { // Fast increment without toast for smoother UX
          updateQty(item._id, (item.qty || 0) + 1);
        }} className="p-2 ml-2 bg-chai-primary rounded" scaleTo={0.85} haptic="selection">
          <Ionicons name="add" size={18} color="#fff" />
        </AnimatedPressable>

        <AnimatedPressable onPress={() => {
          Alert.alert('Remove item', `Remove ${item.name} from cart?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => { removeItem(item._id); Toast.show({ type: 'bannerSuccess', text1: 'Removed from cart' }); } }
          ]);
        }} className="ml-3 p-2" scaleTo={0.9} haptic="impactLight">
          <Feather name="x" size={18} color="#e11d48" />
        </AnimatedPressable>
      </View>
    </View>
  );

  // Entrance animation
  const slideAnim = useRef(new Animated.Value(44)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ]).start();
  }, [slideAnim, fadeAnim]);

  return (
    <SafeAreaView className="flex-1 bg-chai-bg p-4 mt-1">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl font-bold text-chai-text-primary" numberOfLines={1} ellipsizeMode="tail">{t('app.my_cart')}</Text>
        <AnimatedPressable onPress={() => router.back()} className="p-2" scaleTo={0.9} haptic="selection">
          <Text className="text-chai-text-secondary">{t('app.close')}</Text>
        </AnimatedPressable>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
        {itemsList.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-chai-text-secondary">Your cart is empty</Text>
          </View>
        ) : (
          <>
            <FlatList data={itemsList} renderItem={renderItem} keyExtractor={i => String(i._id)} />
            <View className="mt-auto">
              <View className="h-[1px] bg-chai-divider mx-4" />
              <View className="flex-row justify-between items-center p-4">
                <Text className="font-bold text-chai-text-primary">{t('app.total')}</Text>
                <Text className="font-bold text-chai-text-primary">₹{Number(total).toFixed(2)}</Text>
              </View>

              <View className="p-4">
                <AnimatedPressable onPress={() => router.push('/checkout')} className="bg-chai-primary p-4 rounded-xl items-center" scaleTo={0.95} haptic="impactMedium">
                  <Text className="text-white font-bold">{t('app.checkout_title')}</Text>
                </AnimatedPressable>

                <AnimatedPressable onPress={() => {
                  Alert.alert('Clear cart', 'Are you sure you want to clear the cart?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear', style: 'destructive', onPress: () => { clear(); Toast.show({ type: 'bannerInfo', text1: 'Cart cleared' }); } }
                  ]);
                }} className="mt-3 items-center" scaleTo={0.9} haptic="selection">
                  <Text className="text-red-500">{t('app.clear_cart')}</Text>
                </AnimatedPressable>
              </View>
            </View>
          </>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}
