import React, { useEffect, useState, useRef, memo, useMemo } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, Animated } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message'; 
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { useCart } from '../../context/CartContext';
import { useLocalSearchParams, router } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import Skeleton from '../../components/Skeleton';
import AnimatedPressable from '../../components/AnimatedPressable';
import { useTranslation } from 'react-i18next';

const RAW_API = process.env.EXPO_PUBLIC_API_URL;
const API_URL = RAW_API ? (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`) : 'http://YOUR_COMPUTER_IP_ADDRESS:5000/api';

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  // Space for floating checkout bar so list items are not covered
  const checkoutBarHeight = 64;
  const bottomPadding = insets.bottom + checkoutBarHeight + 32; // extra breathing room
  const { categoryId, search: incomingSearch } = useLocalSearchParams();
  const initialCategory = categoryId || 'all';

  const [query, setQuery] = useState(incomingSearch ? String(incomingSearch) : '');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [categories, setCategories] = useState([{ _id: 'all', name: 'All' }]);
  const [selected, setSelected] = useState(initialCategory);
  const [items, setItems] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6); // For 'all' category pagination
  const [isLoadingCats, setIsLoadingCats] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const { addItem, items: itemsInCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const checkoutAnim = useRef(new Animated.Value(0)).current;
  const catsRef = useRef(null);

  useEffect(() => {
    if (itemsInCart.length > 0) {
      setShowCheckout(true);
      Animated.timing(checkoutAnim, { toValue: 1, duration: 220, useNativeDriver: true })?.start();
    } else if (showCheckout) {
      Animated.timing(checkoutAnim, { toValue: 0, duration: 160, useNativeDriver: true })?.start(() => setShowCheckout(false));
    }
  }, [itemsInCart.length]);

  const handleSelectCategory = (cid) => {
    if (selected === cid) return;
    setQuery('');
    setDebouncedQuery('');
    setSelected(cid);
    setItems([]);
    setIsLoadingItems(true);
  };

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
    } catch { return null; }
  };

  useEffect(() => {
    const fetchCats = async () => {
      setIsLoadingCats(true);
      try {
        const res = await axios.get(`${API_URL}/menu/categories`);
        setCategories([{ _id: 'all', name: 'All' }, ...(res.data.categories || [])]);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally { setIsLoadingCats(false); }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    if (categoryId) {
      setSelected(categoryId);
    } else if (incomingSearch === undefined) {
      setSelected('all');
    }
  }, [categoryId, incomingSearch]);

  useEffect(() => {
    if (typeof incomingSearch !== 'undefined') {
      setQuery(String(incomingSearch || ''));
    }
  }, [incomingSearch]);

  useEffect(() => {
    if (isLoadingCats || !catsRef.current || !categories || categories.length === 0) return;
    const index = categories.findIndex(c => c._id === selected);
    if (index >= 0) {
      try {
        catsRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      } catch (e) {
        console.warn('Failed to scroll category list:', e);
      }
    }
  }, [selected, categories, isLoadingCats]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoadingItems(true);
      try {
        let res;
        if (debouncedQuery.length > 0) {
          res = await axios.get(`${API_URL}/menu/search`, { params: { q: debouncedQuery } });
        } else if (selected === 'all') {
          res = await axios.get(`${API_URL}/menu/items`);
        } else {
          res = await axios.get(`${API_URL}/menu/items`, { params: { category: selected } });
        }
        setItems(res.data?.items || []);
        setVisibleCount(6); // Reset visible count when category/search changes
      } catch (err) {
        console.error('Failed to load items:', err);
        setItems([]);
      } finally { setIsLoadingItems(false); }
    };
    fetchItems();
  }, [selected, debouncedQuery]);

  const renderCategory = ({ item }) => {
    // Try i18n key first (e.g., app.all). If missing, fall back to the raw name.
    const key = `app.${String(item?.name || '').toLowerCase()}`;
    const translated = t(key);
    const label = translated === key ? (item?.name || '') : translated;
    return (
      <AnimatedPressable
        onPress={() => handleSelectCategory(item._id)}
        className={`p-1 mr-3 rounded-full items-center justify-center border ${selected === item._id ? 'bg-chai-primary border-chai-primary' : 'bg-white border-chai-divider'}`}
        style={{ minWidth: 96, height: 48 }}
        scaleTo={0.9}
        haptic={false}
      >
        <Text numberOfLines={1} ellipsizeMode="tail" className={`font-semibold text-lg ${selected === item._id ? 'text-white' : 'text-chai-text-secondary'}`}>{label}</Text>
      </AnimatedPressable>
    );
  };

  const ItemCardBase = ({ item }) => {
    const [loaded, setLoaded] = useState(false);
    const src = (() => {
      const u = normalizeImageUrl(item?.image);
      return u ? { uri: u } : require('../../assets/images/chai-cafeteria-icon.png');
    })();
    return (
      <View className="flex-1 p-2">
        <View className="bg-white rounded-2xl shadow-md overflow-hidden">
          <View style={{ width: '100%', height: 128 }}>
            {!loaded && <View className="absolute inset-0"><Skeleton width="100%" height={128} borderRadius={16} /></View>}
            <ExpoImage source={src} style={{ width: '100%', height: '100%' }} contentFit="cover" cachePolicy="memory-disk" transition={0} onLoadEnd={() => setLoaded(true)} />
          </View>
          <View className="p-3">
            <Text className="text-base font-semibold text-chai-text-primary mb-1" numberOfLines={1}>{item.name}</Text>
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-chai-text-secondary">₹{Number(item.price).toFixed(2)}</Text>
              <AnimatedPressable
                onPress={() => {
                  addItem(item);
                  if (itemsInCart.length === 0) {
                    setShowCheckout(true);
                    Animated.timing(checkoutAnim, { toValue: 1, duration: 220, useNativeDriver: true })?.start();
                  }
                  Toast.show({ type: 'bannerSuccess', text1: t('app.added_to_cart'), text2: item.name });
                }}
                className="bg-chai-primary w-8 h-8 rounded-full items-center justify-center active:opacity-90"
                scaleTo={0.85}
                haptic="selection"
              >
                <Ionicons name="add" size={20} color="white" />
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </View>
    );
  };
  ItemCardBase.displayName = 'ItemCard';
  const ItemCard = memo(ItemCardBase);
  const renderItemCard = ({ item }) => <ItemCard item={item} />;

  return (
    <SafeAreaView className="flex-1 bg-chai-bg pt-5 mt-1">
      <View className="px-4 mb-2">
        <View className="flex-row items-center bg-white rounded-full px-4 py-3 shadow-sm border border-chai-divider">
          <Feather name="search" size={20} color="#9CA3AF" className="mr-3" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('app.search_items')}
            placeholderTextColor="#757575"
            className="flex-1 text-[15px] text-chai-text-primary"
            clearButtonMode="while-editing"
            returnKeyType="search"
            onSubmitEditing={() => setDebouncedQuery(query)}
          />
          {query.length > 0 && (
            <AnimatedPressable onPress={() => setQuery('')} className="p-1" scaleTo={0.85} haptic={false}>
              <Feather name="x-circle" size={20} color="#9CA3AF" />
            </AnimatedPressable>
          )}
        </View>
      </View>
      <FlatList
        data={selected === 'all' ? items.slice(0, visibleCount) : items}
        renderItem={renderItemCard}
        keyExtractor={(item) => item._id}
        numColumns={2}
        ListHeaderComponent={!isLoadingCats && categories.length > 0 ? (
          <View style={{ height: 64, backgroundColor: 'transparent' }}>
            <FlatList
              ref={catsRef}
              data={categories}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderCategory}
              keyExtractor={c => c._id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' }}
              getItemLayout={(data, index) => ({ length: 96 + 12, offset: (96 + 12) * index, index })}
            />
          </View>
        ) : (
          <View style={{ height: 64, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#C7A27C" />
          </View>
        )}
        ListEmptyComponent={isLoadingItems ? (
          <View style={{ paddingHorizontal: 8, paddingVertical: 16 }}>
            {[0,1,2].map(r => (
              <View key={r} className="flex-row">
                <View className="flex-1 p-2">
                  <View className="bg-white rounded-2xl overflow-hidden">
                    <Skeleton width="100%" height={128} borderRadius={16} />
                    <View className="p-3">
                      <Skeleton width={120} height={14} borderRadius={7} style={{ marginBottom: 8 }} />
                      <Skeleton width={80} height={12} borderRadius={6} />
                    </View>
                  </View>
                </View>
                <View className="flex-1 p-2">
                  <View className="bg-white rounded-2xl overflow-hidden">
                    <Skeleton width="100%" height={128} borderRadius={16} />
                    <View className="p-3">
                      <Skeleton width={120} height={14} borderRadius={7} style={{ marginBottom: 8 }} />
                      <Skeleton width={80} height={12} borderRadius={6} />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="py-10 items-center px-8">
            <ExpoImage source={{ uri: 'https://cdn-icons-png.flaticon.com/512/562/562678.png' }} style={{ width: 144, height: 144, marginBottom: 12 }} contentFit="contain" />
            <Text className="text-lg font-semibold text-chai-text-primary mb-1" numberOfLines={1}>{t('app.nothing_here')}</Text>
            <Text className="text-sm text-chai-text-secondary text-center">{t('app.nothing_here_hint')}</Text>
            <AnimatedPressable onPress={() => setSelected('all')} className="mt-4 bg-chai-primary px-5 py-3 rounded-full" haptic="selection" scaleTo={0.93}>
              <Text className="text-white font-semibold">{t('app.browse_all_items')}</Text>
            </AnimatedPressable>
          </View>
        )}
        ListFooterComponent={
          <>
            {selected === 'all' && items.length > visibleCount && (
              <View className="w-full items-center mb-2 mt-4">
                <AnimatedPressable
                  onPress={() => setVisibleCount(v => Math.min(v + 6, items.length))}
                  className="bg-chai-primary px-6 py-3 rounded-full"
                  haptic="selection"
                  scaleTo={0.95}
                >
                  <Text className="text-white font-semibold">Show More</Text>
                </AnimatedPressable>
              </View>
            )}
            <View style={{ height: checkoutBarHeight + insets.bottom + 5 }} />
          </>
        }
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
      />
      {showCheckout && (
        <Animated.View
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            // Restore original higher offset so it sits above tab bar visibly
            bottom: insets.bottom + 88,
            opacity: checkoutAnim,
            transform: [{ translateY: checkoutAnim.interpolate({ inputRange: [0,1], outputRange: [40,0] }) }],
            zIndex: 100,
            elevation: 8,
          }}
          pointerEvents={showCheckout ? 'auto' : 'none'}
        >
          <AnimatedPressable onPress={() => router.push('/checkout')} className="bg-chai-primary py-4 rounded-full shadow-lg items-center active:opacity-90 mb-1" haptic="selection" scaleTo={0.95}>
            <Text className="text-white font-semibold">{t('app.checkout')} • {itemsInCart.reduce((s, it) => s + (it.qty || 0), 0)} {t('app.items_suffix')}</Text>
          </AnimatedPressable>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
