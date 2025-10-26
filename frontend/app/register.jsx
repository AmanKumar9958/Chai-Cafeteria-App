// frontend/app/register.jsx
import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Image, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
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
    const [phone, setPhone] = useState('');
    const [address1, setAddress1] = useState('');
    const [address2, setAddress2] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Refs for auto-advance between fields
    const nameRef = useRef(null);
    const emailRef = useRef(null);
    const phoneRef = useRef(null);
    const passwordRef = useRef(null);
    const address1Ref = useRef(null);
    const address2Ref = useRef(null);

    const handleRegister = async () => {
        setIsLoading(true);
        try {
            await axios.post(`${API_URL}/auth/register`, { name, email, password, phone, address1, address2 });
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
        <SafeAreaView className="flex-1 bg-chai-bg">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 32 }} keyboardShouldPersistTaps="handled">
                    <View className="items-center mb-6">
                        <Image source={require('../assets/images/android-icon-background.png')} className="w-[220px] h-24" />
                        <Text className="text-3xl font-bold mt-4 text-chai-text-primary">Welcome</Text>
                        <Text className="text-chai-text-secondary mt-2 font-semibold">Create your account</Text>
                    </View>

                    <TextInput
                        ref={nameRef}
                        className="border border-chai-divider p-4 rounded-xl mb-4 text-lg text-chai-text-primary"
                        placeholderTextColor="#757575"
                        placeholder="Full Name"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize='words'
                        returnKeyType="next"
                        onSubmitEditing={() => emailRef.current?.focus()}
                        blurOnSubmit={false}
                    />
                    <TextInput
                        ref={emailRef}
                        className="border border-chai-divider p-4 rounded-xl mb-4 text-lg text-chai-text-primary"
                        placeholderTextColor="#757575"
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        returnKeyType="next"
                        onSubmitEditing={() => phoneRef.current?.focus()}
                        blurOnSubmit={false}
                    />
                    <TextInput
                        ref={phoneRef}
                        className="border border-chai-divider p-4 rounded-xl mb-4 text-lg text-chai-text-primary"
                        placeholderTextColor="#757575"
                        placeholder="Phone number"
                        value={phone}
                        onChangeText={(t) => { setPhone(t); if (t?.length === 10) { passwordRef.current?.focus(); } }}
                        keyboardType="phone-pad"
                        maxLength={10}
                        returnKeyType="next"
                        onSubmitEditing={() => passwordRef.current?.focus()}
                        blurOnSubmit={false}
                    />
                    <TextInput
                        ref={passwordRef}
                        className="border border-chai-divider p-4 rounded-xl mb-6 text-lg text-chai-text-primary"
                        placeholderTextColor="#757575"
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize='none'
                        returnKeyType="next"
                        onSubmitEditing={() => address1Ref.current?.focus()}
                        blurOnSubmit={false}
                    />
                    <TextInput
                        ref={address1Ref}
                        className="border border-chai-divider p-4 rounded-xl mb-4 text-lg text-chai-text-primary"
                        placeholderTextColor="#757575"
                        placeholder="Address 1 (Home)"
                        value={address1}
                        onChangeText={setAddress1}
                        returnKeyType="next"
                        onSubmitEditing={() => address2Ref.current?.focus()}
                        blurOnSubmit={false}
                    />
                    <TextInput
                        ref={address2Ref}
                        className="border border-chai-divider p-4 rounded-xl mb-6 text-lg text-chai-text-primary"
                        placeholderTextColor="#757575"
                        placeholder="Address 2 (Work)"
                        value={address2}
                        onChangeText={setAddress2}
                        returnKeyType="done"
                        onSubmitEditing={handleRegister}
                    />

                    <Pressable onPress={handleRegister} className="bg-chai-primary w-full p-4 rounded-xl items-center justify-center" disabled={isLoading}>
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white text-lg font-bold" numberOfLines={1}>
                                Sign Up
                            </Text>
                        )}
                    </Pressable>

                    <View className="flex-row justify-center mt-6">
                        <Text className="text-chai-text-secondary">Already have an account? </Text>
                        <Link href="/login"><Text className="text-chai-primary font-bold p-2">Login</Text></Link>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
