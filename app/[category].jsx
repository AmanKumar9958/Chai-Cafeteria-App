import React from 'react';
import { View, Text, SafeAreaView, FlatList, Image, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

// Mock data for items - In a real app, this would come from Firebase
const menuItems = {
  Burgers: [
    { id: '1', name: 'Classic Cheeseburger', price: '9.99', image: 'https://placehold.co/100x100/FFC72C/FFFFFF?text=Burger' },
    { id: '2', name: 'Bacon Deluxe Burger', price: '12.50', image: 'https://placehold.co/100x100/FFC72C/FFFFFF?text=Burger' },
    { id: '3', name: 'Veggie Burger', price: '8.75', image: 'https://placehold.co/100x100/FFC72C/FFFFFF?text=Burger' },
  ],
  Pizza: [
    { id: '4', name: 'Margherita Pizza', price: '14.00', image: 'https://placehold.co/100x100/008000/FFFFFF?text=Pizza' },
    { id: '5', name: 'Pepperoni Pizza', price: '16.50', image: 'https://placehold.co/100x100/008000/FFFFFF?text=Pizza' },
  ],
  // Add data for Rolls and Noodles here...
};

const carouselImages = [
  'https://placehold.co/400x200/FFC72C/FFFFFF?text=Special+Offer',
  'https://placehold.co/400x200/008000/FFFFFF?text=New+Items',
  'https://placehold.co/400x200/E64A19/FFFFFF?text=Combos',
];

export default function CategoryScreen() {
  const { category } = useLocalSearchParams();
  const items = menuItems[category] || [];

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-gray-200">
        <Pressable onPress={() => router.back()} className="p-2">
          <FontAwesome name="arrow-left" size={24} color="#333" />
        </Pressable>
        <Text className="text-2xl font-bold ml-4 capitalize">{category}</Text>
      </View>
      
      {/* Carousel */}
      <View className="h-48">
        <FlatList
          data={carouselImages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item }}
              className="w-screen h-48" // Use screen width for full-bleed effect
            />
          )}
        />
      </View>
      
      {/* Item List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="flex-row items-center p-4 border-b border-gray-100">
            <Image source={{ uri: item.image }} className="w-24 h-24 rounded-lg mr-4" />
            <View className="flex-1">
              <Text className="text-lg font-bold">{item.name}</Text>
              <Text className="text-md text-gray-600 mt-1">${item.price}</Text>
            </View>
            <Pressable className="bg-orange-500 p-3 rounded-full">
              <FontAwesome name="plus" size={20} color="white" />
            </Pressable>
          </View>
        )}
        ListHeaderComponent={<Text className="p-4 text-xl font-bold text-gray-500">All {category}</Text>}
      />
    </SafeAreaView>
  );
}
