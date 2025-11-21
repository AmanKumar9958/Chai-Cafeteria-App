// frontend/app/(tabs)/profile.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../../i18n';

const RAW_API = process.env.EXPO_PUBLIC_API_URL || 'http://10.225.33.106:5000';
const API_URL = (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`);

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-chai-bg">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const display = user || { name: '', email: '-', phone: '-', address1: '-', address2: '-' };

  return (
    <SafeAreaView className="flex-1 bg-chai-bg p-6" style={{ paddingBottom: bottomPadding }}>
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
        <Pressable onPress={() => setIsEditing(true)} className="mt-6 border-2 border-chai-primary rounded-xl p-4 items-center">
          <Text className="text-chai-primary font-bold">{t('app.edit_profile')}</Text>
        </Pressable>
      ) : (
        <View className="mt-6">
          <Pressable onPress={async () => {
            // Save profile
            try {
              const res = await axios.put(`${API_URL}/auth/me`, form, { headers: { Authorization: `Bearer ${userToken}` } });
              // refresh local profile from context
              await refreshProfile();
              setUser(res.data.user);
              setIsEditing(false);
              Toast.show({ type: 'success', text1: 'Profile updated' });
            } catch (err) {
              console.error('Failed to update profile', err?.response?.data || err.message);
              const msg = err?.response?.data?.msg || err?.response?.data || 'Failed to update profile';
              Toast.show({ type: 'error', text1: 'Update failed', text2: String(msg) });
            }
          }} className="border-2 border-chai-primary rounded-xl p-4 items-center">
            <Text className="text-chai-primary font-bold">{t('app.save_changes')}</Text>
          </Pressable>

          <Pressable onPress={() => { setIsEditing(false); setForm({ name: user?.name || '', phone: user?.phone || '', address1: user?.address1 || '', address2: user?.address2 || '' }); }} className="mt-4 border-2 border-chai-divider rounded-xl p-4 items-center">
            <Text className="text-chai-text-secondary">{t('app.cancel')}</Text>
          </Pressable>
        </View>
      )}

      {!!user && (
        <Pressable onPress={confirmLogout} className="mt-4 bg-chai-primary rounded-xl p-4 items-center">
          <Text className="text-white font-bold">{t('app.logout')}</Text>
        </Pressable>
      )}

      {/* Language switcher */}
      <View className="mt-6">
        <Text className="text-chai-text-secondary mb-2">{t('app.language')}</Text>
        <View className="flex-row gap-3">
          <Pressable onPress={() => setLanguage('en')} className={`px-4 py-2 rounded-xl border ${i18n.language.startsWith('en') ? 'border-chai-primary' : 'border-chai-divider'}`}>
            <Text className={`${i18n.language.startsWith('en') ? 'text-chai-primary' : 'text-chai-text-primary'}`}>{t('app.english')}</Text>
          </Pressable>
          <Pressable onPress={() => setLanguage('hi')} className={`px-4 py-2 rounded-xl border ${i18n.language.startsWith('hi') ? 'border-chai-primary' : 'border-chai-divider'}`}>
            <Text className={`${i18n.language.startsWith('hi') ? 'text-chai-primary' : 'text-chai-text-primary'}`}>{t('app.hindi')}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}