// frontend/app/reset-password.jsx
import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const RAW_API = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000';
const API_URL = (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`);

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  const initialEmail = typeof params?.email === 'string' ? params.email : '';
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const otpRef = useRef(null);
  const passRef = useRef(null);
  const { t } = useTranslation();

  const submit = async () => {
    if (!email || !otp || !password) { Toast.show({ type: 'bannerError', text1: 'Fill all fields' }); return; }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { email, otp, newPassword: password });
      Toast.show({ type: 'bannerSuccess', text1: t('app.reset_password'), text2: t('app.login') });
      router.replace('/login');
    } catch (e) {
      const msg = e?.response?.data?.msg || e?.response?.data?.message || e?.message || 'Failed to reset password';
      Toast.show({ type: 'bannerError', text1: 'Reset failed', text2: String(msg) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-chai-bg">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 32 }} keyboardShouldPersistTaps="handled">
          <View className="items-center mb-6">
            <ExpoImage source={require('../assets/images/android-icon-background.png')} style={{ width: 220, height: 96 }} contentFit="contain" />
            <Text className="text-3xl font-bold mt-4 text-chai-text-primary">{t('app.enter_otp')}</Text>
            <Text className="text-chai-text-secondary mt-2 font-semibold">{t('app.new_password')}</Text>
          </View>

          <TextInput
            className="border border-chai-divider p-4 rounded-xl mb-4 text-lg text-chai-text-primary"
            placeholderTextColor="#757575"
            placeholder={t('app.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => otpRef.current?.focus()}
            blurOnSubmit={false}
          />

          <TextInput
            ref={otpRef}
            className="border border-chai-divider p-4 rounded-xl mb-4 text-lg text-chai-text-primary tracking-widest"
            placeholderTextColor="#757575"
            placeholder={`${t('app.enter_otp')} (6)`}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            returnKeyType="next"
            onSubmitEditing={() => passRef.current?.focus()}
            blurOnSubmit={false}
          />

          <View className="flex-row items-center border border-chai-divider rounded-xl mb-6">
            <TextInput
              ref={passRef}
              className="flex-1 p-4 text-lg text-chai-text-primary"
              placeholderTextColor="#757575"
              placeholder={t('app.new_password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize='none'
              returnKeyType="done"
              onSubmitEditing={submit}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} className="p-4">
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={24} color="#757575" />
            </Pressable>
          </View>

          <Pressable onPress={submit} className="bg-chai-primary w-full p-4 rounded-xl items-center justify-center" disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text className="text-white text-lg font-bold">{t('app.reset_password_cta')}</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
