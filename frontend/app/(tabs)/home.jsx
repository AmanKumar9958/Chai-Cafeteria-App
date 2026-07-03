import React, { useEffect, useState, memo, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  Platform,
  Animated,
  Pressable,
  Easing,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Image as ExpoImage } from 'expo-image';
import { SearchBar } from '../../components/SearchBar';
import AnimatedPressable from '../../components/AnimatedPressable';
import { ImageCarousel } from '../../components/ImageCarousel';
import Skeleton from '../../components/Skeleton';
import Toast from 'react-native-toast-message';
import { useTabBarScroll } from '../../context/TabBarContext';

const RAW_API = process.env.EXPO_PUBLIC_API_URL;
const API_URL = RAW_API ? (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`) : 'http://YOUR_COMPUTER_IP_ADDRESS:5000/api';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

const getGreetingKey = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'greeting_morning';
  if (hour < 18) return 'greeting_afternoon';
  return 'greeting_evening';
};

const sliderImages = [
  { _id: '1', imageURL: 'https://admin.chaicafeteria.com/images/category-burger.png' },
  { _id: '2', imageURL: 'https://admin.chaicafeteria.com/images/category-pizza.png' },
  { _id: '3', imageURL: 'https://admin.chaicafeteria.com/images/category-cookies.png' },
];

const PRICE_FILTERS = [80, 100, 150, 200];

// ── API fetch functions (used by React Query) ──
const fetchHomeData = async () => {
  const [catRes, itemRes] = await Promise.all([
    axios.get(`${API_URL}/menu/categories`),
    axios.get(`${API_URL}/menu/items`, { params: { limit: 100 } }),
  ]);

  const categories = (catRes.data.categories || []).filter(c => (c.name || '').toLowerCase() !== 'sandwich');
  const allItems = itemRes.data.items || [];

  // Pick 4 random items for initial display
  const shuffled = [...allItems].sort(() => 0.5 - Math.random());
  const randomItems = shuffled.slice(0, 4);

  // Discover Delicious Pizzas section
  const pizzaItems = allItems.filter(i => (i.name || '').toLowerCase().includes('pizza')).slice(0, 4);

  // Wide range of burgers
  const burgerItems = allItems.filter(i => (i.name || '').toLowerCase().includes('burger')).slice(0, 4);

  return { categories, allItems, randomItems, pizzaItems, burgerItems };
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const onScroll = useTabBarScroll();
  const { user: authUser } = useAuth();
  const { t } = useTranslation();
  const { items: cartItems = [], addItem } = useCart() || {};
  const [name, setName] = useState('User');
  const [greeting, setGreeting] = useState('Good Morning');
  const [greetingKey, setGreetingKey] = useState(getGreetingKey());
  
  const [search, setSearch] = useState('');
  const [activePriceFilter, setActivePriceFilter] = useState(null);

  const sliderWidth = Dimensions.get('window').width - 48;
  const bottomPadding = Platform.OS === 'ios' ? Math.max(88, insets.bottom + 88) : 24;

  // ── React Query: Home Data ──
  const { data: homeData, isLoading } = useQuery({
    queryKey: ['home', 'data'],
    queryFn: fetchHomeData,
    staleTime: 5 * 60 * 1000, // 5 min — home data doesn't change often
  });

  const categories = homeData?.categories || [];
  const allItems = homeData?.allItems || [];
  const randomItems = homeData?.randomItems || [];
  const pizzaItems = homeData?.pizzaItems || [];
  const burgerItems = homeData?.burgerItems || [];

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

  useEffect(() => {
    setGreeting(getGreeting());
    setGreetingKey(getGreetingKey());
  }, []);

  useEffect(() => {
    setName(authUser?.name || authUser?.displayName || 'User');
  }, [authUser]);

  const totalCartQuantity = cartItems.reduce((sum, item) => sum + (item.qty || 0), 0);

  const getFilteredItems = (items) => {
    if (!activePriceFilter) return items;
    return items.filter(item => (item.price || 0) <= activePriceFilter);
  };

  // Determine what to show in the grid
  const gridItems = activePriceFilter 
    ? allItems.filter(item => (item.price || 0) <= activePriceFilter).slice(0, 4) 
    : randomItems;

  const filteredPizzas = getFilteredItems(pizzaItems);
  const filteredBurgers = getFilteredItems(burgerItems);

  // --- Category Card ---
  const CategoryCardBase = ({ item }) => {
    const [loaded, setLoaded] = useState(false);
    const src = (() => {
      const u = normalizeImageUrl(item?.imageURL || item?.image);
      return u ? { uri: u } : require('../../assets/images/chai-cafeteria-icon.png');
    })();
    return (
      <Pressable
        onPress={() => router.push({ pathname: '/(tabs)/menu', params: { categoryId: item._id } })}
        className="mr-5 items-center"
      >
        <View className="w-20 h-20 rounded-full bg-black mb-2 overflow-hidden border border-black items-center justify-center p-1.5">
          {!loaded && (
            <View className="absolute inset-0">
              <Skeleton width="100%" height="100%" borderRadius={100} />
            </View>
          )}
          <ExpoImage
            source={src}
            style={{ width: '100%', height: '100%', borderRadius: 100, padding: 6 }} 
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={0}
            priority="high"
            onLoadEnd={() => setLoaded(true)}
          />
        </View>
        <Text className="text-black text-md font-semibold text-center capitalize" numberOfLines={1}>
          {item.name}
        </Text>
      </Pressable>
    );
  };
  const CategoryCard = memo(CategoryCardBase);

  // --- Regular Item Card (Horizontal Lists) ---
  const PopularItemCardBase = ({ item, isGrid }) => {
    const [loaded, setLoaded] = useState(false);
    const src = (() => {
      const u = normalizeImageUrl(item?.imageURL || item?.image);
      return u ? { uri: u } : require('../../assets/images/chai-cafeteria-icon.png');
    })();
    
    const handleAddToCart = () => {
      addItem(item);
      Toast.show({ type: 'bannerSuccess', text1: t('app.added_to_cart'), text2: `${item.name} added` });
    };

    // Responsive width for Grid: 'w-[48%]' ensures 2 items per row with space
    const containerClass = isGrid 
      ? "w-[48%] mb-4 bg-white border border-black rounded-3xl overflow-hidden" 
      : "w-40 mr-4 bg-white border border-black rounded-3xl overflow-hidden";

    return (
      <Pressable
        onPress={() => router.push({ pathname: '/(tabs)/menu', params: { search: item.name } })}
        className={containerClass}
      >
        <View className="w-full h-36 bg-white items-center justify-center">
           {!loaded && (
            <View className="absolute inset-0">
              <Skeleton width="100%" height="100%" borderRadius={0} />
            </View>
          )}
          <ExpoImage
            source={src}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover" 
            cachePolicy="memory-disk"
            transition={0}
            priority="normal"
            onLoadEnd={() => setLoaded(true)}
          />
        </View>
        
        <View className="p-2">
          <Text className="text-black font-bold text-base mb-2 leading-5" numberOfLines={1}>
            {item.name}
          </Text>
          <View className="flex-row justify-between items-center">
            <Text className="text-orange-600 font-extrabold text-lg">₹{item.price}</Text>
            <Pressable 
              onPress={handleAddToCart}
              className="bg-orange-600 w-8 h-8 rounded-full items-center justify-center"
            >
              <Ionicons name="add" size={20} color="white" />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };
  const PopularItemCard = memo(PopularItemCardBase);

  // Animation Refs
  const slideAnim = React.useRef(new Animated.Value(42)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ]).start();
  }, [slideAnim, fadeAnim]);

  return (
    <SafeAreaView className="flex-1 bg-[#FFFBF7] pt-5 mt-1" style={{ paddingBottom: bottomPadding + 40 }}>
      <StatusBar style="dark" />
      {isLoading ? (
        <>
           <View className="px-6">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-xl text-gray-500 font-medium">{t(`app.${greetingKey}`)},</Text>
                <Text className="text-3xl font-bold text-black" numberOfLines={1}>{name}</Text>
              </View>
              <Ionicons name="cart-outline" size={32} color="#000" />
            </View>
            <SearchBar value={search} onChange={setSearch} onSubmit={() => {}} onClear={() => setSearch('')} />
          </View>
          <View className="px-6 mt-4">
            <Skeleton width="100%" height={176} borderRadius={16} style={{ marginBottom: 24 }} />
          </View>
        </>
      ) : (
        <>
          {/* Header Section */}
          <View className="px-6">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-xl text-gray-500 font-medium">{t(`app.${greetingKey}`)},</Text>
                <Text className="text-3xl font-bold text-black" numberOfLines={1}>{name}</Text>
              </View>
              <AnimatedPressable 
                className="relative p-2" 
                onPress={() => router.push('/cart')}
                scaleTo={0.9}
              >
                <Ionicons name="cart-outline" size={30} color="#000" />
                {totalCartQuantity > 0 && (
                  <View className="absolute top-0 right-0 bg-red-600 rounded-full w-5 h-5 items-center justify-center border-2 border-white">
                    <Text className="text-white text-[10px] font-bold">{totalCartQuantity}</Text>
                  </View>
                )}
              </AnimatedPressable>
            </View>

            <SearchBar
              value={search}
              onChange={setSearch}
              onSubmit={() => {
                const q = search.trim();
                if (q.length > 0) router.push({ pathname: '/(tabs)/menu', params: { search: q } });
                else router.push('/(tabs)/menu');
              }}
              onClear={() => setSearch('')}
            />
          </View>

          <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }], opacity: fadeAnim }}>
            <Animated.ScrollView 
              onScroll={onScroll}
              scrollEventThrottle={16}
              // REDUCED BOTTOM PADDING HERE (From 120 to 80)
              contentContainerStyle={{ paddingBottom: 80 + bottomPadding }}
              showsVerticalScrollIndicator={false}
            >
              {/* Carousel */}
              <View className="mt-4 mb-3 ml-2">
                <ImageCarousel
                  images={sliderImages}
                  width={sliderWidth}
                  height={176}
                  interval={3000}
                  autoPlay
                  onPressSlide={(i, img) => {
                    router.push({ pathname: '/(tabs)/menu', params: { categoryId: 'all' } });
                  }}
                />
              </View>

              {/* Categories Section */}
              <View className="mb-6">
                <View className="flex-row items-center justify-between px-6 mb-4">
                  <Text className="text-xl font-bold text-black">
                    {t('app.categories')}
                  </Text>
                  <Pressable onPress={() => router.push({ pathname: '/(tabs)/menu', params: { categoryId: 'all' } })}>
                    <Text className="text-sm text-orange-600 font-bold" numberOfLines={1}>{t('app.see_all')}</Text>
                  </Pressable>
                </View>
                <FlatList
                  horizontal
                  data={categories}
                  renderItem={({ item }) => <CategoryCard item={item} />}
                  keyExtractor={c => c._id}
                  contentContainerStyle={{ paddingHorizontal: 24 }}
                  showsHorizontalScrollIndicator={false}
                />
              </View>

              {/* --- PRICE FILTER SECTION --- */}
              <View className="mb-6">
                 <View className="flex-row items-center justify-between px-6 mb-3">
                    <View className="flex-row items-center">
                        <Text className="text-xl font-bold text-black mr-3">Filter by Price</Text>
                        {activePriceFilter && (
                            <Pressable 
                                onPress={() => setActivePriceFilter(null)}
                                className="bg-gray-200 px-2 py-1 rounded-md"
                            >
                                <Text className="text-xs text-black font-semibold">Clear</Text>
                            </Pressable>
                        )}
                    </View>
                 </View>
                 <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={{ paddingHorizontal: 24 }}
                 >
                    {PRICE_FILTERS.map((price) => {
                        const isActive = activePriceFilter === price;
                        return (
                            <Pressable
                                key={price}
                                onPress={() => setActivePriceFilter(isActive ? null : price)}
                                className={`mr-3 px-4 py-2 rounded-full border ${isActive ? 'bg-orange-600 border-orange-600' : 'bg-white border-black'}`}
                            >
                                <Text className={`font-bold ${isActive ? 'text-white' : 'text-black'}`}>
                                    Under ₹{price}
                                </Text>
                            </Pressable>
                        );
                    })}
                 </ScrollView>
              </View>

              {/* --- DYNAMIC GRID SECTION (REPLACES MOST POPULAR) --- */}
              <View className="mb-6 px-6">
                  {/* Title changes based on state */}
                  <Text className="text-xl font-bold text-black mb-4">
                     {activePriceFilter ? `Best under ₹${activePriceFilter}` : 'Quick Picks For You'}
                  </Text>
                  
                  {gridItems.length > 0 ? (
                      <View className="flex-row flex-wrap justify-between">
                          {gridItems.map(item => (
                             <PopularItemCard key={item._id} item={item} isGrid={true} />
                          ))}
                      </View>
                  ) : (
                      <Text className="text-gray-500 italic">No items found in this range.</Text>
                  )}
              </View>

              {/* Discover Delicious Pizzas Section (Filtered) */}
              {filteredPizzas.length > 0 && (
                <View className="mb-6 mt-2">
                  <View className="flex-row items-center justify-between px-6 mb-4">
                    <Text className="text-xl font-bold text-black" numberOfLines={1}>
                      {t('app.discover_delicious_pizzas') === 'app.discover_delicious_pizzas' ? 'Discover Delicious Pizzas' : t('app.discover_delicious_pizzas')}
                    </Text>
                    {(() => {
                      const pizzaCat = categories.find(c => (c.name || '').toLowerCase().includes('pizza'));
                      const pizzaCatId = pizzaCat?._id || 'all';
                      return (
                        <Pressable onPress={() => router.push({ pathname: '/(tabs)/menu', params: { categoryId: pizzaCatId } })}>
                          <Text className="text-sm text-orange-600 font-bold" numberOfLines={1}>{t('app.see_all')}</Text>
                        </Pressable>
                      );
                    })()}
                  </View>
                  <FlatList
                    horizontal
                    data={filteredPizzas}
                    renderItem={({ item }) => <PopularItemCard item={item} isGrid={false} />}
                    keyExtractor={i => i._id}
                    contentContainerStyle={{ paddingHorizontal: 24 }}
                    showsHorizontalScrollIndicator={false}
                  />
                </View>
              )}

              {/* Wide range of Burgers (Filtered) */}
              {filteredBurgers.length > 0 && (
                <View className="mb-6 mt-4">
                  <View className="flex-row items-center justify-between px-6 mb-4">
                    <Text className="text-xl font-bold text-black" numberOfLines={1}>
                      {t('app.discover_wide_range_burgers') === 'app.discover_wide_range_burgers' ? 'Discover Wide Range Burgers' : t('app.discover_wide_range_burgers')}
                    </Text>
                    {(() => {
                      const burgerCat = categories.find(c => (c.name || '').toLowerCase().includes('burger'));
                      const burgerCatId = burgerCat?._id || 'all';
                      return (
                        <Pressable onPress={() => router.push({ pathname: '/(tabs)/menu', params: { categoryId: burgerCatId } })}>
                          <Text className="text-sm text-orange-600 font-bold" numberOfLines={1}>{t('app.see_all')}</Text>
                        </Pressable>
                      );
                    })()}
                  </View>
                  <FlatList
                    horizontal
                    data={filteredBurgers}
                    renderItem={({ item }) => <PopularItemCard item={item} isGrid={false} />}
                    keyExtractor={i => i._id}
                    contentContainerStyle={{ paddingHorizontal: 24 }}
                    showsHorizontalScrollIndicator={false}
                  />
                </View>
              )}

            </Animated.ScrollView>
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}