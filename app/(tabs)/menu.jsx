import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';

// --- MOCK DATA ---
// In a real application, you would fetch this data from your Firebase Firestore database.
const menuData = [
  { id: '1', name: "Wendy's Burger", price: '10.40', category: 'Burgers', image: 'https://placehold.co/150x150/FFC72C/FFFFFF?text=Burger' },
  { id: '2', name: 'Veggie Burger', price: '10.40', category: 'Burgers', image: 'https://placehold.co/150x150/FFC72C/FFFFFF?text=Burger' },
  { id: '3', name: 'Margherita Magic', price: '12.00', category: 'Pizza', image: 'https://placehold.co/150x150/008000/FFFFFF?text=Pizza' },
  { id: '4', name: 'Veggie Delight', price: '11.50', category: 'Pizza', image: 'https://placehold.co/150x150/008000/FFFFFF?text=Pizza' },
  { id: '5', name: 'Chicken Wrap', price: '8.50', category: 'Rolls', image: 'https://placehold.co/150x150/E64A19/FFFFFF?text=Roll' },
  { id: '6', name: 'Big Beef Burrito', price: '9.75', category: 'Rolls', image: 'https://placehold.co/150x150/E64A19/FFFFFF?text=Roll' },
  { id: '7', name: 'Spicy Noodles', price: '13.25', category: 'Noodles', image: 'https://placehold.co/150x150/B71C1C/FFFFFF?text=Noodles' },
  { id: '8', name: 'Classic Pepperoni', price: '14.00', category: 'Pizza', image: 'https://placehold.co/150x150/008000/FFFFFF?text=Pizza' },
];

const categories = ['All', 'Burgers', 'Pizza', 'Rolls', 'Noodles'];
// --- END MOCK DATA ---


export default function MenuScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { addToCart } = useCart(); // Hook to get the addToCart function

  // Filter the items based on the selected category
  const filteredItems = selectedCategory === 'All'
    ? menuData
    : menuData.filter(item => item.category === selectedCategory);

  // Reusable component for each item card in the grid
  const ItemCard = ({ item }) => (
    <View className="flex-1 m-2 bg-white rounded-2xl shadow-lg overflow-hidden">
      <Image source={{ uri: item.image }} className="w-full h-32" />
      <View className="p-4">
        <Text className="text-lg font-bold text-gray-800" numberOfLines={1}>{item.name}</Text>
        <View className="flex-row justify-between items-center mt-2">
          <Text className="text-md text-gray-600">From ${item.price}</Text>
          <Pressable 
            onPress={() => addToCart(item)} 
            className="bg-orange-500 w-8 h-8 rounded-full items-center justify-center active:bg-orange-600"
          >
            <FontAwesome name="plus" size={16} color="white" />
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 pt-5">
      {/* Header & Search Bar */}
      <View className="px-4 mb-4">
        <Text className="text-3xl font-bold text-center mb-4 text-gray-800">Our Menu</Text>
        <View className="flex-row items-center bg-white rounded-full p-3 shadow-sm">
          <FontAwesome name="search" size={20} color="#999" className="mr-3" />
          <TextInput placeholder="Search for any food..." className="flex-1 text-lg" />
        </View>
      </View>
      
      {/* Horizontal Category Filter */}
      <View className="h-16">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-4 items-center">
          {categories.map(category => (
            <Pressable
              key={category}
              onPress={() => setSelectedCategory(category)}
              className={`px-5 py-2 rounded-full mr-3 justify-center shadow-sm ${selectedCategory === category ? 'bg-orange-500' : 'bg-white'}`}
            >
              <Text className={`text-md font-semibold ${selectedCategory === category ? 'text-white' : 'text-gray-600'}`}>
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Food Items Grid */}
      <FlatList
        data={filteredItems}
        renderItem={({ item }) => <ItemCard item={item} />}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 4 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}