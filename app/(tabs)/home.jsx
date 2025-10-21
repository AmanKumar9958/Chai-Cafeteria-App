import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase.config';

// Function to get a dynamic greeting based on the time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

export default function HomeScreen() {
  const { user } = useAuth();
  const greeting = getGreeting();
  
  // State to hold categories fetched from Firestore and loading status
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // useEffect hook to fetch data from Firestore when the component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesCollection = collection(db, 'categories');
        const q = query(categoriesCollection, orderBy('sortOrder', 'asc'));
        const querySnapshot = await getDocs(q);
        const fetchedCategories = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Error fetching categories: ", error);
        // Optionally, show an error message to the user
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []); // The empty dependency array ensures this runs only once

  // Function to handle navigation when a category is pressed
  const handleCategoryPress = (categoryName) => {
    // Uses Expo Router to navigate to the dynamic [category].jsx page
    router.push(`/${categoryName}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="p-6">
        {/* Header Section with Greeting and User Name */}
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

        {/* Category List Section */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#C7A27C" className="mt-16" />
        ) : (
          <View>
            {categories.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => handleCategoryPress(category.name)}
                className="h-40 rounded-3xl mb-6 overflow-hidden flex-row items-center justify-between p-6 shadow-md"
                style={{ backgroundColor: category.backgroundColor }}
              >
                <Text className="text-white text-4xl font-extrabold uppercase">{category.name}</Text>
                <Image source={{ uri: category.imageURL }} className="w-32 h-32" resizeMode="contain" />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

