import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, Pressable, FlatList, Image, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import { StatusBar } from 'expo-status-bar';

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

// Default category styles with corrected paths
// Make sure your image filenames in /assets/images match these keys exactly
const categoryStyles = {
  Biryani: { img: require('../../assets/images/category-biryani.png') },
  Chilli: { img: require('../../assets/images/category-chilli.png') },
  Burgers: { img: require('../../assets/images/category-burger.png') },
  Pizza: { img: require('../../assets/images/category-pizza.png') },
  Rolls: { img: require('../../assets/images/category-rolls.png') },
  Noodles: { img: require('../../assets/images/category-noodles.png') },
  Default: { img: require('../../assets/images/chai-cafeteria-icon.png') }, // Fallback
};

export default function HomeScreen() {
  const { user: authUser } = useAuth();
  // Safely read cart items from context (fall back to empty array if context missing)
  const cartContext = useCart() || {};
  const cartItems = cartContext.cartItems || []; // Use cartItems from context
  const [name, setName] = useState('User');
  const [greeting, setGreeting] = useState('Good Morning');
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carousel (auto-sliding) setup
  const sliderRef = useRef(null);
  const [sliderIndex, setSliderIndex] = useState(0);
  const SLIDE_INTERVAL = 3000; // ms
  const sliderImages = useMemo(() => [
    require('../../assets/images/category-biryani.png'),
    require('../../assets/images/category-burger.png'),
    require('../../assets/images/category-pizza.png'),
    require('../../assets/images/category-chilli.png'),
  ], []);
  const sliderWidth = Dimensions.get('window').width - 48; // match paddingHorizontal: 24
  const pausedRef = useRef(false); // pause auto-slide while user interacts

  // auto-advance the slider every SLIDE_INTERVAL ms
  useEffect(() => {
    if (!sliderImages || sliderImages.length === 0) return;
    const id = setInterval(() => {
      // do not advance while paused (user touching/swiping)
      if (!pausedRef.current) {
        setSliderIndex(prev => (prev + 1) % sliderImages.length);
      }
    }, SLIDE_INTERVAL);
    return () => clearInterval(id);
  }, [sliderImages, SLIDE_INTERVAL]);

  // scroll when sliderIndex changes
  useEffect(() => {
    if (!sliderRef.current) return;
    try {
      sliderRef.current.scrollTo({ x: sliderIndex * sliderWidth, animated: true });
    } catch (_e) {
      // ignore scroll errors
    }
  }, [sliderIndex, sliderWidth]);

  useEffect(() => {
    // Set greeting based on time
    setGreeting(getGreeting());

    // Fetch categories from backend
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${API_URL}/menu/categories`);
        // Map fetched categories to include styling info
        const styledCategories = (res.data.categories || []).map(cat => ({
          ...cat,
          // Match DB name (cat.name) to the key in categoryStyles
          style: categoryStyles[cat.name] || categoryStyles.Default,
        }));
        setCategories(styledCategories.slice(0, 6)); // Show max 6 categories
      } catch (err) {
        console.error('Failed to load categories', err?.message || err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Update displayed name when AuthContext user changes
  useEffect(() => {
    setName(authUser?.name || authUser?.displayName || 'User');
  }, [authUser]);

  // Calculate total quantity in cart
  const totalCartQuantity = cartItems.reduce((sum, item) => sum + (item.qty || 0), 0);

  // --- Render Functions ---
  const renderHeader = () => (
    <>
      {/* Header Section */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-xl text-gray-500">{greeting},</Text>
          <Text className="text-3xl font-bold text-gray-800" numberOfLines={1} ellipsizeMode="tail">{name}</Text>
        </View>
        <Pressable className="relative p-2" onPress={() => router.push('/cart')}>
          <Ionicons name="cart-outline" size={32} color="#333" />
          {totalCartQuantity > 0 && (
            <View className="absolute top-0 right-0 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
              <Text className="text-white text-xs font-bold">{totalCartQuantity}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Search Bar */}
      {/* <View className="flex-row items-center bg-white rounded-full p-4 mb-8 shadow-sm border border-gray-200">
        <FontAwesome name="search" size={20} color="#999" className="mr-3" />
        <TextInput placeholder="Search for chai, snacks..." className="flex-1 text-lg text-gray-700" />
      </View> */}

      {/* Carousel - auto sliding images */}
      <View className="mb-6">
        <ScrollView
          ref={sliderRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
            const x = e.nativeEvent.contentOffset.x || 0;
            const idx = Math.round(x / sliderWidth);
            setSliderIndex(idx % sliderImages.length);
          }}
            // Pause auto-advance when user touches or starts dragging, resume when interaction ends
            onTouchStart={() => { pausedRef.current = true; }}
            onTouchEnd={() => { pausedRef.current = false; }}
            onScrollBeginDrag={() => { pausedRef.current = true; }}
            onScrollEndDrag={() => { pausedRef.current = false; }}
        >
          {sliderImages.map((src, i) => (
            <View key={i} style={{ width: sliderWidth, height: 160 }} className="rounded-2xl overflow-hidden mr-4">
              <Image source={src} className="w-full h-full" resizeMode="cover" />
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Categories Title */}
      <View className="flex-row items-center justify-between mb-5">
        <Text className="text-2xl font-bold text-gray-800">Categories</Text>
        <Pressable onPress={() => router.push('/(tabs)/menu')} className="px-2 py-1">
          <Text className="text-sm text-orange-600 font-medium">See all</Text>
        </Pressable>
      </View>
    </>
  );

  const renderCategoryCard = ({ item }) => (
    <Pressable
      // Navigate to menu screen and pass the category ID
      onPress={() => router.push({ pathname: '/(tabs)/menu', params: { categoryId: item._id } })}
      // Removed background color, using image as full background
      className={`h-40 rounded-3xl mb-5 overflow-hidden shadow-md`}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      {/* Image now takes up 100% of the card */}
      <Image
        source={item.style?.img}
        className="w-full h-full"
        resizeMode="cover" // This will make the image fill the box (cropping if needed)
      />
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 pt-5">
      <StatusBar style="dark" />
      {isLoading ? (
          <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#C7A27C" />
          </View>
      ) : (
        <FlatList
          data={categories}
          renderItem={renderCategoryCard}
          keyExtractor={c => c._id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}