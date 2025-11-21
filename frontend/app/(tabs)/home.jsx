import React, { useEffect, useState, memo } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  FlatList, 
  Dimensions,
  Platform
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
import { ImageCarousel } from '../../components/ImageCarousel';
import Skeleton from '../../components/Skeleton';

// Ensure API URL is correctly loaded from environment variables
const RAW_API = process.env.EXPO_PUBLIC_API_URL;
const API_URL = RAW_API ? (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`) : 'http://YOUR_COMPUTER_IP_ADDRESS:5000/api'; // Fallback needed

// Function to get the time of day greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

// Function to get the time of day greeting translation key
const getGreetingKey = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'greeting_morning';
  if (hour < 18) return 'greeting_afternoon';
  return 'greeting_evening';
};

// --- Your backend should return this data for the carousel ---
// Use HTTPS to avoid Android cleartext (HTTP) blocking in release builds
const sliderImages = [
  { _id: '1', imageURL: 'https://admin.chaicafeteria.com/images/category-burger.png' },
  { _id: '2', imageURL: 'https://admin.chaicafeteria.com/images/category-pizza.png' },
  { _id: '3', imageURL: 'https://admin.chaicafeteria.com/images/category-cookies.png' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
    const { t } = useTranslation();
  // Align with CartContext which exposes `items`
  const { items: cartItems = [] } = useCart() || {}; // Safely get cart items
  const [name, setName] = useState('User');
  const [greeting, setGreeting] = useState('Good Morning');
    const [greetingKey, setGreetingKey] = useState(getGreetingKey());
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const sliderWidth = Dimensions.get('window').width - 48; // match p-6 (24px)
  // Carousel state moved into ImageCarousel component to avoid Home re-renders
  const bottomPadding = Platform.OS === 'ios' ? Math.max(88, insets.bottom + 88) : 24;

  // Normalize incoming image URLs so they render in Android release builds
  const normalizeImageUrl = (u) => {
    try {
      if (!u || typeof u !== 'string') return null;
      // Trim and fix protocol-relative
      let url = u.trim();
      if (url.startsWith('//')) url = `https:${url}`;
      // Prefer HTTPS (cleartext HTTP is blocked in Android release)
      if (url.startsWith('http://')) url = url.replace('http://', 'https://');
      // If it isn't absolute, prefix with API origin (without /api)
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

  // Main data fetching effect
  useEffect(() => {
    setGreeting(getGreeting());
      setGreetingKey(getGreetingKey());
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${API_URL}/menu/categories`);
        // We get everything from the DB: name, imageURL, backgroundColor
        setCategories((res.data.categories || []).slice(0, 6)); // Show max 6
      } catch (err) {
        console.error('Failed to load categories', err?.message || err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Update user's name
  useEffect(() => {
    setName(authUser?.name || authUser?.displayName || 'User');
  }, [authUser]);

  const totalCartQuantity = cartItems.reduce((sum, item) => sum + (item.qty || 0), 0);

  // --- Render Functions ---

  const renderHeader = () => (
    <>
      {/* Carousel - now isolated to prevent Home re-renders on slide change */}
      <ImageCarousel
        images={sliderImages}
        width={sliderWidth}
        height={176}
        interval={3000}
        autoPlay
        onPressSlide={(i, img) => {
          // Navigate to Menu; could be extended to deep-links per slide later
          router.push({ pathname: '/(tabs)/menu', params: { categoryId: 'all' } });
        }}
      />

      {/* Categories Title */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-2xl font-bold text-chai-text-primary">{t('app.categories')}</Text>
        <Pressable onPress={() => router.push({ pathname: '/(tabs)/menu', params: { categoryId: 'all' } })} className="px-2 py-1">
          <Text className="text-sm text-chai-primary font-semibold" numberOfLines={1}>{t('app.see_all')}</Text>
        </Pressable>
      </View>
    </>
  );

  const CategoryCardBase = ({ item }) => {
    const [loaded, setLoaded] = useState(false);
    const src = (() => {
      const u = normalizeImageUrl(item?.imageURL || item?.image);
      return u ? { uri: u } : require('../../assets/images/chai-cafeteria-icon.png');
    })();
    return (
      <Pressable
        onPress={() => router.push({ pathname: '/(tabs)/menu', params: { categoryId: item._id } })}
        className="h-44 rounded-3xl mb-5 overflow-hidden bg-gray-200"
        style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}
      >
        <View className="w-full h-full">
          {!loaded && (
            <View className="absolute inset-0">
              <Skeleton width="100%" height="100%" borderRadius={24} />
            </View>
          )}
          <ExpoImage
            source={src}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={0}
            onLoadEnd={() => setLoaded(true)}
          />
          {/* Bottom overlay for readability */}
          <View className="absolute bottom-0 left-0 right-0 h-20 bg-black/35" />
          <View className="absolute bottom-0 left-0 right-0 p-5">
            <Text className="text-white text-2xl font-extrabold" numberOfLines={2}>
              {item.name}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };
  CategoryCardBase.displayName = 'CategoryCard';
  const CategoryCard = memo(CategoryCardBase);

  const renderCategoryCard = ({ item }) => <CategoryCard item={item} />;

  return (
    <SafeAreaView className="flex-1 bg-chai-bg pt-5">
      <StatusBar style="dark" />
      {isLoading ? (
        <>
          {/* Greeting + Cart (visible even while loading) */}
          <View className="px-6">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-xl text-chai-text-secondary font-medium">{t(`app.${greetingKey}`)},</Text>
                <Text className="text-3xl font-bold text-chai-text-primary" numberOfLines={1}>{name}</Text>
              </View>
              <Pressable className="relative p-2 rounded-full">
                <Ionicons name="cart-outline" size={32} color="#111" />
              </Pressable>
            </View>
            <SearchBar value={search} onChange={setSearch} onSubmit={() => {}} onClear={() => setSearch('')} />
          </View>

          {/* Skeleton carousel and category tiles */}
          <View className="px-6 mt-4">
            <Skeleton width="100%" height={176} borderRadius={16} style={{ marginBottom: 24 }} />
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} width="100%" height={176} borderRadius={24} style={{ marginBottom: 20 }} />
            ))}
          </View>
        </>
      ) : (
        <>
          {/* Greeting + Cart */}
          <View className="px-6">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-xl text-chai-text-secondary font-medium">{t(`app.${greetingKey}`)},</Text>
                <Text className="text-3xl font-bold text-chai-text-primary" numberOfLines={1}>{name}</Text>
              </View>
              <Pressable 
                className="relative p-2 active:bg-gray-200 rounded-full" 
                onPress={() => router.push('/cart')}
              >
                <Ionicons name="cart-outline" size={32} color="#111" />
                {totalCartQuantity > 0 && (
                  <View className="absolute top-0 right-0 bg-red-600 rounded-full w-5 h-5 items-center justify-center border-2 border-gray-50">
                    <Text className="text-white text-xs font-bold">{totalCartQuantity}</Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Search bar placed below greeting and cart */}
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

            {/* Quick filters removed by request */}
          </View>

          <FlatList
            data={categories}
            renderItem={renderCategoryCard}
            keyExtractor={c => c._id}
            ListHeaderComponent={renderHeader}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: bottomPadding }}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </SafeAreaView>
  );
}