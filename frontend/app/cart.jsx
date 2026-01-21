import React, { useRef, useEffect, useState } from 'react';
import { View, Text, FlatList, Alert, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { router } from 'expo-router';
import AnimatedPressable from '../components/AnimatedPressable';
import { Ionicons, Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Image as ExpoImage } from 'expo-image';
import ItemCustomizationModal from '../components/ItemCustomizationModal';

const RAW_API = process.env.EXPO_PUBLIC_API_URL;
const API_URL = RAW_API ? (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`) : 'http://YOUR_COMPUTER_IP_ADDRESS:5000/api';

export default function CartScreen() {
  const { t } = useTranslation();
  const { items, updateQty, removeItem, clear, suggestions, updateSuggestions, addItem } = useCart();
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [customizationItem, setCustomizationItem] = useState(null);
  const [isCustomizationVisible, setIsCustomizationVisible] = useState(false);

  // Guard items in case the context is not yet initialized
  const itemsList = items || [];
  const total = itemsList.reduce((s, i) => s + (i.qty || 0) * (i.price || 0), 0);

  // Fetch menu items on mount
  useEffect(() => {
    const fetchMenuItems = async () => {
      setIsLoadingMenu(true);
      try {
        const res = await axios.get(`${API_URL}/menu/items`);
        const fetchedItems = res.data?.items || [];
        setAllMenuItems(fetchedItems);
        updateSuggestions(fetchedItems);
      } catch (err) {
        console.error('Failed to load menu items:', err);
      } finally {
        setIsLoadingMenu(false);
      }
    };
    fetchMenuItems();
  }, []);

  // Update suggestions when cart items change
  useEffect(() => {
    if (allMenuItems.length > 0) {
      updateSuggestions(allMenuItems);
    }
  }, [items, allMenuItems]);

  const normalizeImageUrl = (u) => {
    try {
      if (!u || typeof u !== 'string') return null;
      let url = u.trim();
      if (url.startsWith('//')) url = `https:${url}`;
      if (url.startsWith('http://')) url = url.replace('http://', 'https://');
      if (!/^https?:\/\//i.test(url)) {
        const base = API_URL.replace(/\/api$/, '');
        if (url.startsWith('/')) return `${base}${url}`;
        return `${base}/${url}`;
      }
      return url;
    } catch {
      return null;
    }
  };

  const handleAddSuggestion = (item) => {
    // Check if item has portions
    if (item.portions && item.portions.length > 0) {
      setCustomizationItem(item);
      setIsCustomizationVisible(true);
    } else {
      addItem(item);
      Toast.show({ type: 'bannerSuccess', text1: t('app.added_to_cart'), text2: `${item.name} added` });
    }
  };

  const handleCustomizationAddToCart = (customizedItem) => {
    addItem(customizedItem);
    Toast.show({ type: 'bannerSuccess', text1: t('app.added_to_cart'), text2: `${customizedItem.name} added` });
  };

  const renderItem = ({ item }) => (
    <View className="bg-white rounded-lg p-4 mb-4 flex-row items-center justify-between border border-chai-divider">
      <View style={{ flex: 1 }}>
        <Text className="font-bold text-chai-text-primary">
          {item.name}
          {(item.variant || item.portion) && (
            <Text className="font-normal text-chai-text-secondary">
              {(() => {
                const v = (item.variant || item.portion).toString().toLowerCase();
                if (v.includes('half')) return ' (H)';
                if (v.includes('full')) return ' (F)';
                if (v.includes('6')) return ' (6)';
                if (v.includes('12')) return ' (12)';
                return ` (${item.variant || item.portion})`;
              })()}
            </Text>
          )}
        </Text>
        <Text className="text-sm text-chai-text-secondary">₹{item.price}</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <AnimatedPressable
          onPress={() => {
            const current = item.qty || 0;
            if (current <= 1) {
              removeItem(item._id, item.portion);
              Toast.show({ type: 'bannerSuccess', text1: 'Removed from cart' });
              return;
            }
            // Fast decrement without toast for smoother UX
            updateQty(item._id, Math.max(0, current - 1), item.portion);
          }}
          className="p-2 mr-2 bg-gray-200 rounded"
          scaleTo={0.85}
          haptic="selection"
        >
          <Feather name="minus" size={18} color="#111" />
        </AnimatedPressable>

        <Text className="mx-2 font-bold">{item.qty || 0}</Text>

        <AnimatedPressable onPress={() => { // Fast increment without toast for smoother UX
          updateQty(item._id, (item.qty || 0) + 1, item.portion);
        }} className="p-2 ml-2 bg-chai-primary rounded" scaleTo={0.85} haptic="selection">
          <Ionicons name="add" size={18} color="#fff" />
        </AnimatedPressable>

        <AnimatedPressable onPress={() => {
          removeItem(item._id, item.portion);
          Toast.show({ type: 'bannerSuccess', text1: 'Removed from cart' });
        }} className="ml-3 p-2" scaleTo={0.9} haptic="impactLight">
          <Feather name="x" size={18} color="#e11d48" />
        </AnimatedPressable>
      </View>
    </View>
  );

  const renderSuggestion = ({ item }) => {
    const src = (() => {
      const u = normalizeImageUrl(item?.imageURL || item?.image);
      return u ? { uri: u } : require('../assets/images/chai-cafeteria-icon.png');
    })();

    return (
      <View className="w-40 mr-4 bg-white border border-black rounded-3xl overflow-hidden">
        <View className="w-full h-36 bg-white items-center justify-center">
          <ExpoImage
            source={src}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={0}
            priority="normal"
          />
        </View>
        
        <View className="p-2">
          <Text className="text-black font-bold text-base mb-2 leading-5" numberOfLines={1}>
            {item.name}
          </Text>
          <View className="flex-row justify-between items-center">
            <Text className="text-orange-600 font-extrabold text-lg">₹{item.price}</Text>
            <AnimatedPressable
              onPress={() => handleAddSuggestion(item)}
              className="bg-orange-600 w-8 h-8 rounded-full items-center justify-center"
              scaleTo={0.85}
              haptic="selection"
            >
              <Ionicons name="add" size={20} color="white" />
            </AnimatedPressable>
          </View>
        </View>
      </View>
    );
  };

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
            <FlatList data={itemsList} renderItem={renderItem} keyExtractor={(i, idx) => String(i._id) + (i.variant || i.portion || '') + idx} />
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
              </View>

              {/* Suggestions Section */}
              {suggestions && suggestions.length > 0 && (
                <View className="mt-2 mb-4">
                  <View className="h-[1px] bg-chai-divider mb-4" />
                  <Text className="text-lg font-bold text-chai-text-primary px-4 mb-3">
                    {t('app.add_more')}
                  </Text>
                  <FlatList
                    horizontal
                    data={suggestions}
                    renderItem={renderSuggestion}
                    keyExtractor={(item) => String(item._id)}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                    showsHorizontalScrollIndicator={false}
                  />
                </View>
              )}

              <View className="px-4">
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

      {/* Customization Modal */}
      <ItemCustomizationModal
        visible={isCustomizationVisible}
        item={customizationItem}
        onClose={() => {
          setIsCustomizationVisible(false);
          setCustomizationItem(null);
        }}
        onAddToCart={handleCustomizationAddToCart}
      />
    </SafeAreaView>
  );
}
