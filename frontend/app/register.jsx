// frontend/app/register.jsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import axios from 'axios';
import Toast from 'react-native-toast-message';

// Get this from your AuthContext file
// Normalize API base: allow EXPO_PUBLIC_API_URL with or without trailing "/api" or "/"
const RAW_API = process.env.EXPO_PUBLIC_API_URL || 'http://10.225.33.106:5000';
const API_URL = (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`);

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async () => {
        setIsLoading(true);
        try {
            await axios.post(`${API_URL}/auth/register`, { name, email, password });
            // On success, navigate to the OTP screen, passing the email along
            Toast.show({ type: 'success', text1: 'Registration successful', text2: `OTP sent to ${email}` });
            router.push({ pathname: '/verify-otp', params: { email } });
        } catch (error) {
            const serverMsg = error?.response?.data?.msg || error?.response?.data || error?.message || 'Unknown error';
            console.error('Registration failed:', serverMsg);
            Toast.show({ type: 'error', text1: 'Registration failed', text2: String(serverMsg) });
            // Show an error message
        }
        setIsLoading(false);
    };

    return (
        <SafeAreaView className="flex-1 bg-[#FCE7D8] justify-center p-8">
            <View className="items-center mb-10">
                <Image source={require('../assets/images/android-icon-background.png')} className="w-[220px] h-24" />
                <Text className="text-3xl font-bold mt-4">Welcome</Text>
                <Text className="text-gray-500 mt-2 font-semibold">Create your account</Text>
            </View>
            <TextInput className="bg-[#FCE7D8] border-2 p-4 rounded-lg mb-4 text-lg" placeholder="Full Name" value={name} onChangeText={setName} autoCapitalize='words' />
            <TextInput className="bg-[#FCE7D8] border-2 p-4 rounded-lg mb-4 text-lg" placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput className="bg-[#FCE7D8] border-2 p-4 rounded-lg mb-6 text-lg" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize='none' />
            <Pressable onPress={handleRegister} className="bg-[#C7A27C] w-full p-4 rounded-lg items-center justify-center" disabled={isLoading}>
                {isLoading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-white text-lg font-bold" numberOfLines={1}>
                        Sign Up
                    </Text>
                )}
            </Pressable>
            <View className="flex-row justify-center mt-6">
                <Text className="text-gray-500">Already have an account? </Text>
                <Link href="/login"><Text className="text-[#C7A27C] font-bold p-2">Login</Text></Link>
            </View>
        </SafeAreaView>
    );
}
