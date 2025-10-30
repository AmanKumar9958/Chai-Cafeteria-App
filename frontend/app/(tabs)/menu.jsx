import React, { useEffect, useState, useRef, memo } from 'react';
import { View, Text, TextInput, FlatList, SectionList, Pressable, ActivityIndicator } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message'; 
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { useCart } from '../../context/CartContext';
import { useLocalSearchParams, router } from 'expo-router'; // Import useLocalSearchParams
import { Image as ExpoImage } from 'expo-image';
import Skeleton from '../../components/Skeleton';

const RAW_API = process.env.EXPO_PUBLIC_API_URL;
const API_URL = RAW_API ? (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`) : 'http://YOUR_COMPUTER_IP_ADDRESS:5000/api'; // Fallback needed

// No mock data — real API will be used

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(24, insets.bottom + 90); // ensure last row clears floating tab bar
  // Get the categoryId passed from the previous screen
  const { categoryId, search: incomingSearch } = useLocalSearchParams(); 
  
  // Set the initial selected category based on the param, default to 'all'
  const initialCategory = categoryId || 'all'; 

  const [query, setQuery] = useState(incomingSearch ? String(incomingSearch) : '');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [categories, setCategories] = useState([{ _id: 'all', name: 'All' }]); // Start with 'All'
  const [selected, setSelected] = useState(initialCategory);
  const [items, setItems] = useState([]);
  const [isLoadingCats, setIsLoadingCats] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const { addItem, items: itemsInCart } = useCart();

  const catsRef = useRef(null); // Ref for the horizontal category FlatList

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

  // --- Effects ---

  // Fetch categories when the component mounts
  useEffect(() => {
    const fetchCats = async () => {
      setIsLoadingCats(true);
      try {
        const res = await axios.get(`${API_URL}/menu/categories`);
        setCategories([{ _id: 'all', name: 'All' }, ...(res.data.categories || [])]);
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setIsLoadingCats(false);
      }
    };
    fetchCats();
  }, []);

  // Update selected state if the categoryId param changes (e.g., navigating again)
  useEffect(() => {
    if (categoryId) {
      setSelected(categoryId);
    }
  }, [categoryId]);

  // If routed here with a search query from Home, seed the search box
  useEffect(() => {
    if (typeof incomingSearch !== 'undefined') {
      setQuery(String(incomingSearch || ''));
    }
  }, [incomingSearch]);

  // Scroll the category list when 'selected' changes or categories load
  useEffect(() => {
    if (isLoadingCats || !catsRef.current || !categories || categories.length === 0) return;
    
    const index = categories.findIndex(c => c._id === selected);
    if (index >= 0) {
      // Try scrolling to the index. Add error handling.
      try {
          catsRef.current.scrollToIndex({
            index: index,
            animated: true,
            viewPosition: 0.5, // Try to center the item
          });
      } catch (e) {
         console.warn("Failed to scroll category list:", e);
         // Fallback or alternative scroll method if scrollToIndex fails
         // const ITEM_WIDTH = 108; // Approximate width + margin
         // const offset = Math.max(0, index * ITEM_WIDTH - ITEM_WIDTH / 2); // Center attempt
         // catsRef.current.scrollToOffset({ offset, animated: true });
      }
    }
  }, [selected, categories, isLoadingCats]); // Rerun when categories load too

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch items based on selected category or search query (from real backend)
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoadingItems(true);
      try {
        let res;
        if (debouncedQuery.length > 0) {
          res = await axios.get(`${API_URL}/menu/search`, { params: { q: debouncedQuery } });
          setItems(res.data?.items || []);
        } else if (selected === 'all') {
          res = await axios.get(`${API_URL}/menu/items`);
          setItems(res.data?.items || []);
        } else {
          res = await axios.get(`${API_URL}/menu/items`, { params: { category: selected } });
          setItems(res.data?.items || []);
        }

      } catch (err) {
        console.error("Failed to load items:", err);
        setItems([]); // Clear items on error
      } finally {
        setIsLoadingItems(false);
      }
    };
    fetchItems();
  }, [selected, debouncedQuery]);

  // --- Render Functions ---

  const renderCategory = ({ item, index }) => (
    // Added padding, fixed width/height for better consistency
    <Pressable 
      onPress={() => setSelected(item._id)} 
      className={`p-3 mr-3 rounded-lg items-center justify-center border ${selected === item._id ? 'bg-chai-primary border-chai-primary' : 'bg-white border-chai-divider'}`} 
      style={{ minWidth: 96, height: 48 }} // Ensure consistent size
    >
      <Text 
        numberOfLines={1} 
        ellipsizeMode="tail" 
        className={`font-semibold ${selected === item._id ? 'text-white' : 'text-chai-text-secondary'}`}
      >
        {item.name}
      </Text>
    </Pressable>
  );

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
            {!loaded && (
              <View className="absolute inset-0">
                <Skeleton width="100%" height={128} borderRadius={16} />
              </View>
            )}
            <ExpoImage
              source={src}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
              onLoadEnd={() => setLoaded(true)}
            />
          </View>
          <View className="p-3">
            <Text className="text-base font-semibold text-chai-text-primary mb-1" numberOfLines={1}>{item.name}</Text>
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-chai-text-secondary">₹{Number(item.price).toFixed(2)}</Text>
              <Pressable 
                onPress={() => { 
                  addItem(item); 
                  Toast.show({ type: 'success', text1: 'Added to cart', text2: item.name, position: 'bottom' });
                }} 
                className="bg-chai-primary w-8 h-8 rounded-full items-center justify-center active:opacity-90"
              >
                <Ionicons name="add" size={20} color="white" />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  };
  ItemCardBase.displayName = 'ItemCard';
  const ItemCard = memo(ItemCardBase);

  const renderItemCard = ({ item }) => <ItemCard item={item} />;

  // Render a row containing up to two item cards
  const renderRow = ({ item: row }) => {
    const [left, right] = row;
    return (
      <View className="flex-row">
        {left && renderItemCard({ item: left })}
        {right ? renderItemCard({ item: right }) : <View style={{ flex: 1, padding: 8 }} />}
      </View>
    );
  };


  // Build two-column rows for SectionList
  const rows = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push([items[i], items[i + 1] || null]);
  }
  const sections = [{ title: 'menu', data: rows }];

  return (
  <SafeAreaView className="flex-1 bg-chai-bg pt-5">
      <SectionList
        sections={sections}
        keyExtractor={(row, index) => {
          const [a, b] = row;
          return `${a?._id || 'empty'}_${b?._id || 'empty'}_${index}`;
        }}
        renderItem={renderRow}
        stickySectionHeadersEnabled={true}
        renderSectionHeader={() => (
          !isLoadingCats && categories.length > 0 ? (
            <View style={{ height: 64, backgroundColor: 'white' }}>
              <FlatList
                ref={catsRef}
                data={categories}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={renderCategory}
                keyExtractor={c => c._id}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' }}
                getItemLayout={(data, index) => (
                  { length: 96 + 12, offset: (96 + 12) * index, index }
                )}
              />
            </View>
          ) : (
            <View style={{ height: 64, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#C7A27C" />
            </View>
          )
        )}
        ListHeaderComponent={(
          <View className="px-4 mb-2">
            <View className="flex-row items-center bg-white rounded-full p-3 shadow-sm border border-chai-divider">
              <Feather name="search" size={20} color="#9CA3AF" className="mr-3" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search items..."
                placeholderTextColor="#757575"
                className="flex-1 text-lg text-chai-text-primary"
                clearButtonMode="while-editing"
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} className="p-1">
                  <Feather name="x-circle" size={20} color="#9CA3AF" />
                </Pressable>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={isLoadingItems ? (
          <View style={{ paddingHorizontal: 8, paddingVertical: 16 }}>
            {/* Skeleton grid: two columns, three rows */}
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
            <ExpoImage
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/562/562678.png' }}
              style={{ width: 144, height: 144, marginBottom: 12 }}
              contentFit="contain"
            />
            <Text className="text-lg font-semibold text-chai-text-primary mb-1">Nothing here yet</Text>
            <Text className="text-sm text-chai-text-secondary text-center">No items in this category. Try a different category or browse all.</Text>
            <Pressable onPress={() => setSelected('all')} className="mt-4 bg-chai-primary px-5 py-3 rounded-full">
              <Text className="text-white font-semibold">Browse all items</Text>
            </Pressable>
          </View>
        )}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      />
      {itemsInCart.length > 0 && (
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 16 }}>
          <Pressable onPress={() => router.push('/checkout')} className="bg-chai-primary py-4 rounded-full shadow-lg items-center">
            <Text className="text-white font-semibold">
              Checkout • {itemsInCart.reduce((s, it) => s + (it.qty || 0), 0)} item(s)
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
