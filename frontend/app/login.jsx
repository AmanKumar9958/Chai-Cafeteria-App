// frontend/app/login.jsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    setIsLoading(true);
    await login(email, password);
    setIsLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-chai-bg">
      <StatusBar style="dark" />
      <View className="flex-1 justify-center p-8">
        <View className="items-center mb-10">
          <Image source={require('../assets/images/android-icon-background.png')} className="w-[220px] h-24" />
          <Text className="text-3xl font-bold mt-4 text-chai-text-primary">Welcome Back!</Text>
          <Text className="text-chai-text-secondary mt-2 font-semibold">Login to your account</Text>
        </View>

        <TextInput
          className="bg-white border border-chai-divider p-4 rounded-xl mb-4 text-lg text-chai-text-primary"
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          className="bg-white border border-chai-divider p-4 rounded-xl mb-6 text-lg text-chai-text-primary"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize='none'
        />

        <Pressable
          onPress={handleLogin}
          className="bg-chai-primary p-4 rounded-xl items-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg font-bold">Login</Text>
          )}
        </Pressable>

        <View className="flex-row justify-center mt-6">
          <Text className="text-chai-text-secondary">Don&apos;t have an account? </Text>
          <Link href="/register">
            <Text className="text-chai-primary font-bold">Sign Up</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}