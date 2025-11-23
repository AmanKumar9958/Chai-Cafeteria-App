// frontend/app/verify-otp.jsx
import React, { useState } from 'react';
import { Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';

const RAW_API = process.env.EXPO_PUBLIC_API_URL || 'http://10.225.33.106:5000';
const API_URL = (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`);

export default function VerifyOtpScreen() {
    const { email } = useLocalSearchParams(); // Get email passed from register screen
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { authenticateWithToken } = useAuth();

    const handleVerify = async () => {
        setIsLoading(true);
        try {
            const res = await axios.post(`${API_URL}/auth/verify-otp`, { email, otp });
            const token = res?.data?.token;
            if (token) {
                // Auto-authenticate and navigate to home
                await authenticateWithToken(token, 'Email verified');
                return;
            }
            Toast.show({ type: 'bannerSuccess', text1: 'Email verified', text2: 'You can now log in.' });
            // Fallback navigation
            router.replace('/login');
        } catch (error) {
            const serverMsg = error?.response?.data?.msg || error?.response?.data || error?.message || 'Unknown error';
            console.error('OTP verification failed:', serverMsg);
            Toast.show({ type: 'bannerError', text1: 'OTP verification failed', text2: String(serverMsg) });
        }
        setIsLoading(false);
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F9FAFB] justify-center p-8">
            <Text className="text-3xl font-bold mb-2 text-center">Verify Your Email</Text>
            <Text className="text-gray-500 mb-8 text-center">An OTP has been sent to {email}</Text>
            <TextInput
                className="bg-gray-100 p-4 rounded-lg mb-6 text-lg text-center"
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#9CA3AF"
                value={otp}
                onChangeText={(t) => { setOtp(t); if (t?.length === 6 && !isLoading) { handleVerify(); } }}
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={handleVerify}
            />
            <Pressable onPress={handleVerify} className="bg-[#C7A27C] p-4 rounded-lg items-center" disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white text-lg font-bold">Verify</Text>}
            </Pressable>
        </SafeAreaView>
    );
}