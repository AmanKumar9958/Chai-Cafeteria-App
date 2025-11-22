// frontend/app/register.jsx
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Image, Platform, KeyboardAvoidingView, ScrollView, Animated, Easing } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

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
    const [showPassword, setShowPassword] = useState(false);
    const { t } = useTranslation();

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

    // Slide-in animation (left -> center) plus fade for registration form
    const slideAnim = useRef(new Animated.Value(48)).current; // X offset
    const fadeAnim = useRef(new Animated.Value(0)).current; // opacity
    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 460,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
    }, [slideAnim, fadeAnim]);

    return (
        <SafeAreaView className="flex-1 bg-chai-bg">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
                <Animated.ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 32 }}
                    keyboardShouldPersistTaps="handled"
                    style={{ transform: [{ translateX: slideAnim }], opacity: fadeAnim }}
                >
                    <View className="items-center mb-6">
                        <Image source={require('../assets/images/android-icon-background.png')} className="w-[220px] h-24" />
                        <Text className="text-3xl font-bold mt-4 text-chai-text-primary">{t('app.welcome')}</Text>
                        <Text className="text-chai-text-secondary mt-2 font-semibold">{t('app.create_account')}</Text>
                    </View>

                    <TextInput
                        ref={nameRef}
                        className="border border-chai-divider p-4 rounded-xl mb-4 text-lg text-chai-text-primary"
                        placeholderTextColor="#757575"
                        placeholder={t('app.full_name')}
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
                        placeholder={t('app.email')}
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
                        placeholder={t('app.phone')}
                        value={phone}
                        onChangeText={(t) => { setPhone(t); if (t?.length === 10) { passwordRef.current?.focus(); } }}
                        keyboardType="phone-pad"
                        maxLength={10}
                        returnKeyType="next"
                        onSubmitEditing={() => passwordRef.current?.focus()}
                        blurOnSubmit={false}
                    />
                    <View className="flex-row items-center border border-chai-divider rounded-xl mb-6">
                        <TextInput
                            ref={passwordRef}
                            className="flex-1 p-4 text-lg text-chai-text-primary"
                            placeholderTextColor="#757575"
                            placeholder={t('app.password')}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize='none'
                            returnKeyType="next"
                            onSubmitEditing={() => address1Ref.current?.focus()}
                            blurOnSubmit={false}
                        />
                        <Pressable onPress={() => setShowPassword(!showPassword)} className="p-4">
                            <Feather name={showPassword ? 'eye-off' : 'eye'} size={24} color="#757575" />
                        </Pressable>
                    </View>
                    <TextInput
                        ref={address1Ref}
                        className="border border-chai-divider p-4 rounded-xl mb-4 text-lg text-chai-text-primary"
                        placeholderTextColor="#757575"
                        placeholder={t('app.address1')}
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
                        placeholder={t('app.address2')}
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
                                {t('app.signup')}
                            </Text>
                        )}
                    </Pressable>

                    <View className="flex-row justify-center items-center mt-6">
                        <Text className="text-chai-text-secondary text-lg">{t('app.already_have_account')} </Text>
                        <Link href="/login"><Text className="text-chai-primary font-bold p-2">{t('app.login')}</Text></Link>
                    </View>
                </Animated.ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
