// frontend/app/(tabs)/profile.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, Alert, ActivityIndicator, TextInput, Animated, Easing } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../../i18n';
import AnimatedPressable from '../../components/AnimatedPressable';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { scheduleOneOffNotification } from '../../utils/notifications';
import { useTabBarScroll } from '../../context/TabBarContext';

const RAW_API = process.env.EXPO_PUBLIC_API_URL || 'http://10.225.33.106:5000';
const API_URL = (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`);

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const onScroll = useTabBarScroll();
  const bottomPadding = Platform.OS === 'ios' ? Math.max(88, insets.bottom + 88) : 24;
  const { logout, userToken, refreshProfile } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address1: '', address2: '' });
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userToken) {
        setLoading(false);
        // If not authenticated, send to login screen rather than showing a fake profile
        try { router.replace('/login'); } catch {}
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${userToken}` } });
        setUser(res.data.user);
        setForm({ name: res.data.user?.name || '', phone: res.data.user?.phone || '', address1: res.data.user?.address1 || '', address2: res.data.user?.address2 || '' });
      } catch (err) {
        console.error('Failed to load profile', err?.response?.data || err.message);
        // If token invalid now, route to login
        try { router.replace('/login'); } catch {}
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userToken]);

  const confirmLogout = () => {
    Alert.alert(t('app.confirm_logout'), t('app.are_you_sure_logout'), [
      { text: t('app.cancel'), style: 'cancel' },
      { text: t('app.logout'), style: 'destructive', onPress: () => logout() },
    ]);
  };

  // Entrance animation hooks MUST run before any conditional returns to keep hook order stable.
  const slideAnim = React.useRef(new Animated.Value(38)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 430, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ]).start();
  }, [slideAnim, fadeAnim]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-chai-bg">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const display = user || { name: '', email: '-', phone: '-', address1: '-', address2: '-' };

  return (
    <SafeAreaView className="flex-1 bg-chai-bg" style={{ paddingBottom: 0 }}>
      <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }], opacity: fadeAnim }}>
      
      <Animated.ScrollView 
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ padding: 24, paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
      >
      <View className="items-center mt-2 mb-6">
        <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center">
          <Text className="text-4xl font-bold text-chai-text-primary">{(display.name || 'U').charAt(0)}</Text>
        </View>
      </View>

      <View className="bg-white rounded-xl p-4 shadow-md border border-chai-divider">
        {!isEditing ? (
          <>
            <View className="flex-row items-center mb-4">
              <View className="flex-1">
                <Text className="text-sm text-chai-text-secondary">{t('app.full_name')}</Text>
                <Text className="text-lg font-bold text-chai-text-primary">{display.name}</Text>
              </View>
            </View>

            <View className="flex-row items-center mb-4">
              <View className="flex-1">
                <Text className="text-sm text-chai-text-secondary">{t('app.email')}</Text>
                <Text className="text-base text-chai-text-primary">{display.email}</Text>
              </View>
            </View>

            <View className="flex-row items-center mb-4">
              <View className="flex-1">
                <Text className="text-sm text-chai-text-secondary">{t('app.phone')}</Text>
                <Text className="text-base text-chai-text-primary">{display.phone || '-'}</Text>
              </View>
            </View>

            <View className="flex-row items-center mb-4">
              <View className="flex-1">
                <Text className="text-sm text-chai-text-secondary">{t('app.address1')}</Text>
                <Text className="text-base text-chai-text-primary">{display.address1 || '-'}</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <View className="mb-4">
              <Text className="text-sm text-chai-text-secondary">{t('app.full_name')}</Text>
              <TextInput value={form.name} onChangeText={v => setForm(prev => ({ ...prev, name: v }))} className="border border-chai-divider rounded-xl p-3 mt-1 bg-white text-chai-text-primary" />
            </View>

            <View className="mb-4">
              <Text className="text-sm text-chai-text-secondary">{t('app.phone')}</Text>
              <TextInput value={form.phone} onChangeText={v => setForm(prev => ({ ...prev, phone: v }))} className="border border-chai-divider rounded-xl p-3 mt-1 bg-white text-chai-text-primary" keyboardType="phone-pad" />
            </View>

            <View className="mb-4">
              <Text className="text-sm text-chai-text-secondary">{t('app.address1')}</Text>
              <TextInput value={form.address1} onChangeText={v => setForm(prev => ({ ...prev, address1: v }))} className="border border-chai-divider rounded-xl p-3 mt-1 bg-white text-chai-text-primary" />
            </View>

            <View className="mb-4">
              <Text className="text-sm text-chai-text-secondary">{t('app.address2')}</Text>
              <TextInput value={form.address2} onChangeText={v => setForm(prev => ({ ...prev, address2: v }))} className="border border-chai-divider rounded-xl p-3 mt-1 bg-white text-chai-text-primary" />
            </View>
          </>
        )}
      </View>

      {!isEditing ? (
        <AnimatedPressable onPress={() => setIsEditing(true)} className="mt-6 border-2 border-chai-primary rounded-xl p-4 items-center" scaleTo={0.95} haptic="selection">
          <Text className="text-chai-primary font-bold">{t('app.edit_profile')}</Text>
        </AnimatedPressable>
      ) : (
        <View className="mt-6">
          <AnimatedPressable onPress={async () => {
            // Save profile
            try {
              const res = await axios.put(`${API_URL}/auth/me`, form, { headers: { Authorization: `Bearer ${userToken}` } });
              // refresh local profile from context
              await refreshProfile();
              setUser(res.data.user);
              setIsEditing(false);
              Toast.show({ type: 'bannerSuccess', text1: 'Profile updated' });
            } catch (err) {
              console.error('Failed to update profile', err?.response?.data || err.message);
              const msg = err?.response?.data?.msg || err?.response?.data || 'Failed to update profile';
              Toast.show({ type: 'bannerError', text1: 'Update failed', text2: String(msg) });
            }
          }} className="border-2 border-chai-primary rounded-xl p-4 items-center" scaleTo={0.95} haptic="selection">
            <Text className="text-chai-primary font-bold">{t('app.save_changes')}</Text>
          </AnimatedPressable>

          <AnimatedPressable onPress={() => { setIsEditing(false); setForm({ name: user?.name || '', phone: user?.phone || '', address1: user?.address1 || '', address2: user?.address2 || '' }); }} className="mt-4 border-2 border-chai-divider rounded-xl p-4 items-center" scaleTo={0.95} haptic={false}>
            <Text className="text-chai-text-secondary">{t('app.cancel')}</Text>
          </AnimatedPressable>
        </View>
      )}

      {!!user && (
        <AnimatedPressable onPress={confirmLogout} className="mt-4 bg-chai-primary rounded-xl p-4 items-center" scaleTo={0.95} haptic="selection">
          <Text className="text-white font-bold">{t('app.logout')}</Text>
        </AnimatedPressable>
      )}

      {/* Test Notification Button */}
      {/* Test Notification Button */}
      {/* <AnimatedPressable 
        onPress={async () => {
          const ok = await scheduleOneOffNotification(5);
          if (ok) Toast.show({ type: 'success', text1: 'Scheduled', text2: 'Wait 5 seconds...' });
          else Toast.show({ type: 'error', text1: 'Error', text2: 'Check permissions' });
        }} 
        className="mt-4 bg-gray-500 rounded-xl p-4 items-center" 
        scaleTo={0.95}
      >
        <Text className="text-white font-bold">Test Notification (5s)</Text>
      </AnimatedPressable> */}

      </Animated.ScrollView>

      {/* Language switcher */}
      <View className="mt-1" style={{ position: 'absolute', top: 24, left: 24, zIndex: 50 }}>
        <LanguageSwitcher />
      </View>
      </Animated.View>
    </SafeAreaView>
  );
}