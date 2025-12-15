import React, { useEffect, useState, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  Platform,
  Animated,
  Pressable,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
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

// Specific colors from your screenshots
const COLORS = {
  orange: '#EA580C', // Deep Orange
  black: '#000000',
  text: '#1F2937',
  bg: '#FFFBF7', // Very slight off-white/warm bg
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
  const [categories, setCategories] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [pizzaItems, setPizzaItems] = useState([]); // New section
  const [burgerItems, setBurgerItems] = useState([]); // New section
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const sliderWidth = Dimensions.get('window').width - 48;
  const bottomPadding = Platform.OS === 'ios' ? Math.max(88, insets.bottom + 88) : 24;

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
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [catRes, itemRes] = await Promise.all([
          axios.get(`${API_URL}/menu/categories`),
          axios.get(`${API_URL}/menu/items`)
        ]);
        // Filter out 'sandwich' category as requested
        setCategories((catRes.data.categories || []).filter(c => (c.name || '').toLowerCase() !== 'sandwich'));
        
        // Filter for specific popular items: 3 Pizzas, 2 Burgers, 1 Chowmein, 1 Chilli
        const allItems = itemRes.data.items || [];
        const getItems = (term, limit) => allItems.filter(i => 
          (i.name || '').toLowerCase().includes(term)
        ).slice(0, limit);

        const pizzas = getItems('pizza', 3);
        const burgers = getItems('burger', 2);
        const chowmein = getItems('chowmein', 1);
        const chilli = getItems('chilli', 1);

        setPopularItems([...pizzas, ...burgers, ...chowmein, ...chilli]);

        // Discover Delicious Pizzas section: 4 pizzas
        const discoverPizzas = allItems.filter(i => (i.name || '').toLowerCase().includes('pizza')).slice(0, 4);
        setPizzaItems(discoverPizzas);

        // Wide range of burgers
        const discoverBurgers = allItems.filter(i => (i.name || '').toLowerCase().includes('burger')).slice(0, 4);
        setBurgerItems(discoverBurgers);

      } catch (err) {
        console.error('Failed to load data', err?.message || err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setName(authUser?.name || authUser?.displayName || 'User');
  }, [authUser]);

  const totalCartQuantity = cartItems.reduce((sum, item) => sum + (item.qty || 0), 0);

  // --- Fixed Category Card (Matches the outline style) ---
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
        {/* Simple black border circle, black background with padding */}
        <View className="w-20 h-20 rounded-full bg-black mb-2 overflow-hidden border border-black items-center justify-center p-1.5">
          {!loaded && (
            <View className="absolute inset-0">
              <Skeleton width="100%" height="100%" borderRadius={100} />
            </View>
          )}
          <ExpoImage
            source={src}
            style={{ width: '100%', height: '100%', borderRadius: 100, padding: 6 }} // Slightly smaller to show inside border
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

  // --- Fixed Popular Card (Matches the Pizza Screenshot 1:1) ---
  const PopularItemCardBase = ({ item }) => {
    const [loaded, setLoaded] = useState(false);
    const src = (() => {
      const u = normalizeImageUrl(item?.imageURL || item?.image);
      return u ? { uri: u } : require('../../assets/images/chai-cafeteria-icon.png');
    })();
    
    const handleAddToCart = () => {
      addItem(item);
      Toast.show({ type: 'bannerSuccess', text1: t('app.added_to_cart'), text2: `${item.name} added` });
    };

    return (
      <Pressable
        onPress={() => router.push({ pathname: '/(tabs)/menu', params: { search: item.name } })}
        // Dimensions matching portrait card, white bg, thin black border, rounded-3xl
        className="w-40 mr-4 bg-white border border-black rounded-3xl overflow-hidden" 
      >
        {/* Image Area - White background to blend */}
        <View className="w-full h-36 bg-white items-center justify-center">
           {!loaded && (
            <View className="absolute inset-0">
              <Skeleton width="100%" height="100%" borderRadius={0} />
            </View>
          )}
          <ExpoImage
            source={src}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover" // 'cover' fills the area like the screenshot
            cachePolicy="memory-disk"
            transition={0}
            priority="high"
            onLoadEnd={() => setLoaded(true)}
          />
        </View>
        
        {/* Content Area */}
        <View className="p-2">
          <Text className="text-black font-bold text-base mb-2 leading-5" numberOfLines={1}>
            {item.name}
          </Text>
          
          <View className="flex-row justify-between items-center">
            {/* Price in Orange */}
            <Text className="text-orange-600 font-extrabold text-lg">₹{item.price}</Text>
            
            {/* Orange Circle Button */}
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
            <View className="flex-row">
                 {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} width={100} height={140} borderRadius={24} style={{ marginRight: 15 }} />
                 ))}
            </View>
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
              contentContainerStyle={{ paddingBottom: 120 + bottomPadding }}
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
              <View className="mb-8">
                <View className="flex-row items-center justify-between px-6 mb-4">
                  {/* Styled Header */}
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


              {/* Most Popular Section */}
              {popularItems.length > 0 && (
                <View className="mb-6">
                  <View className="flex-row items-center justify-between px-6 mb-4">
                    <Text className="text-xl font-bold text-black" numberOfLines={1}>
                      {t('app.most_popular') === 'app.most_popular' ? 'Most Popular' : t('app.most_popular')}
                    </Text>
                    <Pressable onPress={() => router.push({ pathname: '/(tabs)/menu' })}>
                      <Text className="text-sm text-orange-600 font-bold" numberOfLines={1}>{t('app.see_all')}</Text>
                    </Pressable>
                  </View>
                  <FlatList
                    horizontal
                    data={popularItems}
                    renderItem={({ item }) => <PopularItemCard item={item} />}
                    keyExtractor={i => i._id}
                    contentContainerStyle={{ paddingHorizontal: 24 }}
                    showsHorizontalScrollIndicator={false}
                  />
                </View>
              )}

              {/* Discover Delicious Pizzas Section */}
              {pizzaItems.length > 0 && (
                <View className="mb-6 mt-4">
                  <View className="flex-row items-center justify-between px-6 mb-4">
                    <Text className="text-xl font-bold text-black" numberOfLines={1}>
                      {t('app.discover_delicious_pizzas') === 'app.discover_delicious_pizzas' ? 'Discover Delicious Pizzas' : t('app.discover_delicious_pizzas')}
                    </Text>
                    {(() => {
                      // Find pizza category _id from categories
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
                    data={pizzaItems}
                    renderItem={({ item }) => <PopularItemCard item={item} />}
                    keyExtractor={i => i._id}
                    contentContainerStyle={{ paddingHorizontal: 24 }}
                    showsHorizontalScrollIndicator={false}
                  />
                </View>
              )}

              {/* Wide range of Burgers */}
              {burgerItems.length > 0 && (
                <View className="mb-6 mt-4">
                  <View className="flex-row items-center justify-between px-6 mb-4">
                    <Text className="text-xl font-bold text-black" numberOfLines={1}>
                      {t('app.discover_wide_range_burgers') === 'app.discover_wide_range_burgers' ? 'Discover Wide Range Burgers' : t('app.discover_wide_range_burgers')}
                    </Text>
                    {(() => {
                      // Find burger category _id from categories
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
                    data={burgerItems}
                    renderItem={({ item }) => <PopularItemCard item={item} />}
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