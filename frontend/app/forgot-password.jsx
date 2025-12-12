// frontend/app/forgot-password.jsx
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Animated, Easing } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import AnimatedPressable from '../components/AnimatedPressable';
import { router } from 'expo-router';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const RAW_API = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000';
const API_URL = (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`);

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const emailRef = useRef(null);
  const { t } = useTranslation();

  const submit = async () => {
    if (!email) { Toast.show({ type: 'bannerError', text1: 'Enter your email' }); return; }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      Toast.show({ type: 'bannerSuccess', text1: t('app.otp_sent'), text2: t('app.otp_sent_to', { email }) });
      router.push({ pathname: '/reset-password', params: { email } });
    } catch (e) {
      const msg = e?.response?.data?.msg || e?.response?.data?.message || e?.message || 'Failed to send OTP';
      Toast.show({ type: 'bannerError', text1: 'Request failed', text2: String(msg) });
    } finally {
      setLoading(false);
    }
  };

  // Entrance animation
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 430, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ]).start();
  }, [slideAnim, fadeAnim]);

  return (
    <SafeAreaView className="flex-1 bg-chai-bg">
      <LanguageSwitcher style={{ position: 'absolute', top: 8, right: 16, zIndex: 50 }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Animated.ScrollView style={{ flex: 1, opacity: fadeAnim, transform: [{ translateX: slideAnim }] }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 32 }} keyboardShouldPersistTaps="handled">
          <View className="items-center mb-6">
            <ExpoImage source={require('../assets/images/android-icon-background.png')} style={{ width: 220, height: 96 }} contentFit="contain" />
            <Text numberOfLines={1} ellipsizeMode="tail" className="text-3xl font-bold mt-4 text-chai-text-primary">{t('app.reset_password')}</Text>
            <Text numberOfLines={1} ellipsizeMode="tail" className="text-chai-text-secondary mt-2 font-semibold">{t('app.enter_email_otp')}</Text>
          </View>

          <TextInput
            ref={emailRef}
            className="border border-chai-divider p-4 rounded-xl mb-6 text-lg text-chai-text-primary"
            placeholderTextColor="#757575"
            placeholder={t('app.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="done"
            onSubmitEditing={submit}
          />

          <AnimatedPressable onPress={submit} className="bg-chai-primary w-full p-4 rounded-xl items-center justify-center" disabled={loading} scaleTo={0.96} haptic="impactMedium">
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                className="text-white text-lg font-bold"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t('app.send_otp')}
              </Text>
            )}
          </AnimatedPressable>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
