import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator, Image } from 'react-native'; // Added Image, ActivityIndicator
import { Feather, Ionicons } from '@expo/vector-icons';
// If using Toast, make sure it's configured in your root layout
// import Toast from 'react-native-toast-message'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useCart } from '../../context/CartContext';
import { useLocalSearchParams } from 'expo-router'; // Import useLocalSearchParams

const RAW_API = process.env.EXPO_PUBLIC_API_URL;
const API_URL = RAW_API ? (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`) : 'http://YOUR_COMPUTER_IP_ADDRESS:5000/api'; // Fallback needed

// --- MOCK ITEM DATA (Replace with API call eventually) ---
// We'll keep this simple for now, assuming your API fetches items based on categoryId
const allMockItems = [
    { _id: 'item1', name: "Wendy's Burger", price: 10.40, categoryId: 'burgerCatId', image: 'https://placehold.co/150x150/FFC72C/FFFFFF?text=Burger' },
    { _id: 'item2', name: 'Veggie Burger', price: 10.40, categoryId: 'burgerCatId', image: 'https://placehold.co/150x150/FFC72C/FFFFFF?text=Burger' },
    { _id: 'item3', name: 'Margherita Magic', price: 12.00, categoryId: 'pizzaCatId', image: 'https://placehold.co/150x150/008000/FFFFFF?text=Pizza' },
    // ... add more items with correct categoryIds
];
// --- END MOCK ITEM DATA ---

export default function MenuScreen() {
  // Get the categoryId passed from the previous screen
  const { categoryId } = useLocalSearchParams(); 
  
  // Set the initial selected category based on the param, default to 'all'
  const initialCategory = categoryId || 'all'; 

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [categories, setCategories] = useState([{ _id: 'all', name: 'All' }]); // Start with 'All'
  const [selected, setSelected] = useState(initialCategory);
  const [items, setItems] = useState([]);
  const [isLoadingCats, setIsLoadingCats] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const { addItem, cartItems } = useCart(); // Use updated CartContext

  const catsRef = useRef(null); // Ref for the horizontal category FlatList

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

  // Fetch items based on selected category or search query
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoadingItems(true);
      try {
        let res;
        if (debouncedQuery.length > 0) {
          // --- TODO: Implement backend search endpoint ---
          // res = await axios.get(`${API_URL}/menu/search?q=${encodeURIComponent(debouncedQuery)}`);
          // For now, filter mock data:
          setItems(allMockItems.filter(item => item.name.toLowerCase().includes(debouncedQuery.toLowerCase())));

        } else if (selected === 'all') {
            // --- TODO: Implement backend endpoint to get ALL items ---
            // res = await axios.get(`${API_URL}/menu/items`);
            // For now, use all mock data:
             setItems(allMockItems);
        }
         else {
          // --- TODO: Implement backend endpoint to get items by categoryId ---
          // res = await axios.get(`${API_URL}/menu/items?categoryId=${selected}`);
          // For now, filter mock data:
          setItems(allMockItems.filter(item => item.categoryId === selected));
        }
        // if (res) setItems(res.data.items || []);

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
      className={`p-3 mr-3 rounded-lg items-center justify-center border ${selected === item._id ? 'bg-[#C7A27C] border-[#C7A27C]' : 'bg-white border-gray-200'}`} 
      style={{ minWidth: 96, height: 48 }} // Ensure consistent size
    >
      <Text 
        numberOfLines={1} 
        ellipsizeMode="tail" 
        className={`font-semibold ${selected === item._id ? 'text-white' : 'text-gray-700'}`}
      >
        {item.name}
      </Text>
    </Pressable>
  );

  const renderItemCard = ({ item }) => {
    // Find item in cart to display quantity if needed (adjust based on CartContext)
    const cartEntry = cartItems.find(cartItem => cartItem._id === item._id);
    const quantityInCart = cartEntry?.qty || 0;

    return (
        // Using a card style similar to the reference image
       <View className="flex-1 m-2 bg-white rounded-2xl shadow-md overflow-hidden">
         <Image source={{ uri: item.image }} className="w-full h-32" resizeMode="cover"/>
         <View className="p-3">
           <Text className="text-base font-semibold text-gray-800 mb-1" numberOfLines={1}>{item.name}</Text>
           <View className="flex-row justify-between items-center">
             <Text className="text-sm text-gray-600">₹{item.price.toFixed(2)}</Text>
             <Pressable 
                onPress={() => { 
                    addItem(item); 
                    // Example using Alert, replace with Toast if configured
                    // Toast.show({ type: 'success', text1: `${item.name} added` }); 
                    alert(`${item.name} added to cart!`); // Simple confirmation
                }} 
                className="bg-orange-500 w-8 h-8 rounded-full items-center justify-center active:bg-orange-600"
             >
               <Ionicons name="add" size={20} color="white" />
             </Pressable>
           </View>
           {/* Optionally display quantity if > 0 */}
           {/* {quantityInCart > 0 && <Text className="text-xs text-green-600 mt-1">{quantityInCart} in cart</Text>} */}
         </View>
       </View>
    );
  };


  return (
    <SafeAreaView className="flex-1 bg-gray-50 pt-5">
      {/* Search Input */}
      <View className="px-4 mb-4">
        <View className="flex-row items-center bg-white rounded-full p-3 shadow-sm border border-gray-200">
          <Feather name="search" size={20} color="#9CA3AF" className="mr-3" />
          <TextInput 
            value={query} 
            onChangeText={setQuery} 
            placeholder="Search items..." 
            className="flex-1 text-lg text-gray-700" 
            clearButtonMode="while-editing" // iOS clear button
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} className="p-1">
              <Feather name="x-circle" size={20} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Horizontal Category List */}
      {!isLoadingCats && categories.length > 0 && (
         <View style={{ height: 64 }}> {/* Give the FlatList a fixed height */}
            <FlatList
              ref={catsRef}
              data={categories}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderCategory}
              keyExtractor={c => c._id}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' }}
              // Add props needed for scrollToIndex to work reliably
              getItemLayout={(data, index) => (
                { length: 96 + 12, offset: (96 + 12) * index, index } // width + margin
              )}
            />
         </View>
      )}

      {/* Items Grid */}
      {isLoadingItems ? (
        <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#C7A27C"/>
        </View>
      ) : items.length === 0 ? (
         <View className="flex-1 justify-center items-center">
            <Text className="text-gray-500">No items found.</Text>
         </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItemCard} // Use the new card renderer
          keyExtractor={i => i._id}
          numColumns={2} // Two columns
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
