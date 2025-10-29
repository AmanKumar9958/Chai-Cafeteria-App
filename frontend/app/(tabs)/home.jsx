import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  FlatList, 
  ActivityIndicator, 
  Dimensions,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import { StatusBar } from 'expo-status-bar';
import { Image as ExpoImage } from 'expo-image';
import { SearchBar } from '../../components/SearchBar';
import { ImageCarousel } from '../../components/ImageCarousel';

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

// --- Your backend should return this data for the carousel ---
// Use HTTPS to avoid Android cleartext (HTTP) blocking in release builds
const sliderImages = [
  { _id: '1', imageURL: 'https://admin.chaicafeteria.com/images/category-burger.png' },
  { _id: '2', imageURL: 'https://admin.chaicafeteria.com/images/category-pizza.png' },
  { _id: '3', imageURL: 'https://admin.chaicafeteria.com/images/category-cookies.png' },
];

export default function HomeScreen() {
  const { user: authUser } = useAuth();
  // Align with CartContext which exposes `items`
  const { items: cartItems = [] } = useCart() || {}; // Safely get cart items
  const [name, setName] = useState('User');
  const [greeting, setGreeting] = useState('Good Morning');
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const sliderWidth = Dimensions.get('window').width - 48; // match p-6 (24px)
  // Carousel state moved into ImageCarousel component to avoid Home re-renders

  // Main data fetching effect
  useEffect(() => {
    setGreeting(getGreeting());
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
          router.push('/(tabs)/menu');
        }}
      />

      {/* Categories Title */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-2xl font-bold text-chai-text-primary">Categories</Text>
        <Pressable onPress={() => router.push('/(tabs)/menu')} className="px-2 py-1">
          <Text className="text-sm text-chai-primary font-semibold" numberOfLines={1}>See all</Text>
        </Pressable>
      </View>
    </>
  );

  const renderCategoryCard = ({ item }) => (
    <Pressable
      onPress={() => router.push({ pathname: '/(tabs)/menu', params: { categoryId: item._id } })}
      className="h-44 rounded-3xl mb-5 overflow-hidden bg-gray-200"
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}
    >
      <View className="w-full h-full">
        <ExpoImage
          source={
            item?.imageURL
              ? { uri: item.imageURL }
              : item?.image
              ? { uri: item.image }
              : require('../../assets/images/chai-cafeteria-icon.png')
          }
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
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

  return (
    <SafeAreaView className="flex-1 bg-chai-bg pt-5">
      <StatusBar style="dark" />
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#E8751A" />
        </View>
      ) : (
        <>
          {/* Greeting + Cart */}
          <View className="px-6">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-xl text-chai-text-secondary font-medium">{greeting},</Text>
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

            {/* Quick filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 24 }}
              className="-mx-1 mt-2"
            >
              {[
                { label: 'Popular', param: 'popular' },
                { label: 'New', param: 'new' },
                { label: 'Best Value', param: 'value' },
                { label: 'Chai', param: 'chai' },
                { label: 'Snacks', param: 'snacks' },
              ].map((chip) => (
                <Pressable
                  key={chip.param}
                  onPress={() => router.push({ pathname: '/(tabs)/menu', params: { filter: chip.param } })}
                  className="px-4 py-2 bg-white rounded-full mx-1 border border-orange-200"
                >
                  <Text className="text-chai-primary font-medium">{chip.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <FlatList
          data={categories}
          renderItem={renderCategoryCard}
          keyExtractor={c => c._id}
          ListHeaderComponent={renderHeader}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }} // Increased bottom padding
          showsVerticalScrollIndicator={false}
        />
        </>
      )}
    </SafeAreaView>
  );
}