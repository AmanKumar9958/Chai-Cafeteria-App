// frontend/app/(tabs)/menu.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useCart } from '../../context/CartContext';

const RAW_API = process.env.EXPO_PUBLIC_API_URL || 'http://10.225.33.106:5000';
const API_URL = (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`);

export default function MenuScreen({ route }) {
  const initialCategory = route?.params?.category || 'all';
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(initialCategory);
  const [items, setItems] = useState([]);
  const { addItem, items: cartItems } = useCart();

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await axios.get(`${API_URL}/menu/categories`);
        setCategories([{ _id: 'all', name: 'All' }, ...(res.data.categories || [])]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        if (query.length > 0) {
          const res = await axios.get(`${API_URL}/menu/search?q=${encodeURIComponent(query)}`);
          setItems(res.data.items || []);
          return;
        }
        const res = await axios.get(`${API_URL}/menu/items?category=${selected}`);
        setItems(res.data.items || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchItems();
  }, [selected, query]);

  const renderCategory = ({ item }) => (
    <Pressable onPress={() => setSelected(item._id)} className={`mr-3 rounded-lg items-center justify-center ${selected === item._id ? 'bg-[#C7A27C]' : 'bg-white'}`} style={{ width: 96, height: 72 }}>
      <Text numberOfLines={1} ellipsizeMode="tail" className={`${selected === item._id ? 'text-white' : 'text-black'}`}>{item.name}</Text>
    </Pressable>
  );



  const renderItem = ({ item }) => {
    const cartEntry = cartItems.find(c => c._id === item._id);
    const qty = cartEntry?.qty || 0;
    return (
      <View className="bg-white rounded-lg p-4 mb-4 flex-row items-center justify-between">
        <View>
          <Text className="font-bold">{item.name}</Text>
          <Text className="text-sm text-gray-500">₹{item.price}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {qty > 0 && <Text className="mr-3 font-bold">{qty}</Text>}
          <Pressable onPress={() => { addItem(item); Toast.show({ type: 'success', text1: 'Added to cart' }); }} className="bg-[#C7A27C] p-3 rounded-full">
            <Ionicons name="add" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB] p-4">
      <View className="flex-row items-center bg-white rounded-lg p-2 mb-4">
        <Feather name="search" size={18} color="#9CA3AF" style={{ marginLeft: 8 }} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search items or categories" className="flex-1 p-2" />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} className="px-2">
            <Feather name="x" size={18} color="#9CA3AF" />
          </Pressable>
        )}
      </View>

      <FlatList data={categories} horizontal showsHorizontalScrollIndicator={false} renderItem={renderCategory} keyExtractor={c => c._id} className="mb-4" />

      {/* make items list expand to fill remaining space so items render from top (no centered gap) */}
          <FlatList data={items} renderItem={renderItem} keyExtractor={i => i._id} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} />
    </SafeAreaView>
  );
}