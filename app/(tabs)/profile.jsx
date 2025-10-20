import React from 'react';
import { View, Text, SafeAreaView, Image, Pressable } from 'react-native';
import { useAuth } from '../../context/AuthContext'; // Go up two directories to find context
import { auth } from '../../firebase.config'; // Go up two directories to find config
import { signOut } from 'firebase/auth';
import { FontAwesome } from '@expo/vector-icons';

export default function ProfileScreen() {
  // The useAuth hook gives us the current user object
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // The onAuthStateChanged listener in our AuthContext will automatically
      // handle navigating the user back to the login screen.
      console.log('User signed out successfully!');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 items-center p-6">
        {/* Profile Picture */}
        <View className="mb-6 items-center">
          <Image
            source={{
              // Use the user's photoURL from Google, or a placeholder if it doesn't exist
              uri: user?.photoURL || 'https://placehold.co/120x120/FDEADB/333333?text=User',
            }}
            className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
          />
        </View>

        {/* User Details Card */}
        <View className="w-full bg-white rounded-2xl p-6 shadow-md mb-8">
          <View className="flex-row items-center mb-6">
            <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mr-4">
              <FontAwesome name="user" size={24} color="#C7A27C" />
            </View>
            <View>
              <Text className="text-gray-500 text-sm">Full Name</Text>
              <Text className="text-gray-800 text-lg font-semibold">{user?.displayName || 'N/A'}</Text>
            </View>
          </View>
          
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mr-4">
               <FontAwesome name="envelope" size={24} color="#C7A27C" />
            </View>
            <View>
              <Text className="text-gray-500 text-sm">Email</Text>
              <Text className="text-gray-800 text-lg font-semibold">{user?.email || 'N/A'}</Text>
            </View>
          </View>
        </View>
        
        {/* Logout Button */}
        <Pressable
          onPress={handleLogout}
          className="w-full bg-red-500 p-4 rounded-2xl flex-row justify-center items-center shadow-md"
        >
          <FontAwesome name="sign-out" size={24} color="white" className="mr-3" />
          <Text className="text-white text-lg font-bold">Logout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

