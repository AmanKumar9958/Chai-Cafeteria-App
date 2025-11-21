// frontend/app/forgot-password.jsx
import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { router } from 'expo-router';

const RAW_API = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000';
const API_URL = (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`);

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const emailRef = useRef(null);
  const { t } = useTranslation();

  const submit = async () => {
    if (!email) { Toast.show({ type: 'error', text1: 'Enter your email' }); return; }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      Toast.show({ type: 'success', text1: t('app.otp_sent'), text2: t('app.otp_sent_to', { email }) });
      router.push({ pathname: '/reset-password', params: { email } });
    } catch (e) {
      const msg = e?.response?.data?.msg || e?.message || 'Failed to send OTP';
      Toast.show({ type: 'error', text1: 'Request failed', text2: String(msg) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-chai-bg">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 32 }} keyboardShouldPersistTaps="handled">
          <View className="items-center mb-6">
            <Image source={require('../assets/images/android-icon-background.png')} className="w-[220px] h-24" />
            <Text className="text-3xl font-bold mt-4 text-chai-text-primary">{t('app.reset_password')}</Text>
            <Text className="text-chai-text-secondary mt-2 font-semibold">{t('app.enter_email_otp')}</Text>
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

          <Pressable onPress={submit} className="bg-chai-primary w-full p-4 rounded-xl items-center justify-center" disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text className="text-white text-lg font-bold">{t('app.send_otp')}</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
