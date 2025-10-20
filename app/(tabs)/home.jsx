import React from 'react';
import { View, Text, SafeAreaView, TextInput, ScrollView, Pressable, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';

// Mock data for the food categories
const categories = [
  {
    name: 'Burgers',
    image: require('../../assets/images/category-burger.png'), // Add this image to your assets
    backgroundColor: '#FFC72C', // Yellow
  },
  {
    name: 'Pizza',
    image: require('../../assets/images/category-pizza.png'), // Add this image to your assets
    backgroundColor: '#008000', // Green
  },
  {
    name: 'Rolls',
    image: require('../../assets/images/category-rolls.png'), // Add this image to your assets
    backgroundColor: '#E64A19', // Orange
  },
  {
    name: 'Noodles',
    image: require('../../assets/images/category-noodles.png'), // Add this image to your assets
    backgroundColor: '#B71C1C', // Red
  },
];

// Function to get the time of day greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

export default function HomeScreen() {
  const { user } = useAuth();
  const greeting = getGreeting();

  const handleCategoryPress = (categoryName) => {
    // Navigate to the dynamic category screen, passing the category name
    router.push(`/${categoryName}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="p-6">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-xl text-gray-500">{greeting},</Text>
            <Text className="text-3xl font-bold text-gray-800">{user?.displayName || 'Guest'}</Text>
          </View>
          <Pressable onPress={() => router.push('/cart')}>
            <FontAwesome name="shopping-bag" size={28} color="#333" />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-white rounded-full p-4 mb-8 shadow-sm">
          <FontAwesome name="search" size={20} color="#999" className="mr-3" />
          <TextInput placeholder="Search for food..." className="flex-1 text-lg" />
        </View>

        {/* Category List */}
        <View>
          {categories.map((category) => (
            <Pressable
              key={category.name}
              onPress={() => handleCategoryPress(category.name)}
              className="h-40 rounded-3xl mb-6 overflow-hidden flex-row items-center justify-between p-6"
              style={{ backgroundColor: category.backgroundColor }}
            >
              <Text className="text-white text-4xl font-extrabold uppercase">{category.name}</Text>
              <Image source={category.image} className="w-32 h-32" resizeMode="contain" />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

