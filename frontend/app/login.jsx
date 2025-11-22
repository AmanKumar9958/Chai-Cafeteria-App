// frontend/app/login.jsx
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Image, Animated, Easing } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const { t } = useTranslation();

  const handleLogin = async () => {
    setIsLoading(true);
    await login(email, password);
    setIsLoading(false);
  };

  // Slide-in animation (left -> center) plus fade
  const slideAnim = useRef(new Animated.Value(40)).current; // X offset
  const fadeAnim = useRef(new Animated.Value(0)).current; // opacity

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, fadeAnim]);

  return (
    <SafeAreaView className="flex-1 bg-chai-bg">
      <StatusBar style="dark" />
      <Animated.View
        className="flex-1 justify-center p-8"
        style={{ transform: [{ translateX: slideAnim }], opacity: fadeAnim }}
      >
        <View className="items-center mb-10">
          <Image source={require('../assets/images/android-icon-background.png')} className="w-[220px] h-24" />
          <Text className="text-3xl font-bold mt-4 text-chai-text-primary">{t('app.welcome_back')}</Text>
          <Text className="text-chai-text-secondary mt-2 font-semibold">{t('app.login_to_account')}</Text>
        </View>

        <TextInput
          ref={emailRef}
          className="border border-chai-divider p-4 rounded-xl mb-4 text-lg text-chai-text-primary"
          placeholder={t('app.email')}
          placeholderTextColor="#757575"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          blurOnSubmit={false}
        />
        <View className="flex-row items-center border border-chai-divider rounded-xl mb-6">
          <TextInput
            ref={passwordRef}
            className="flex-1 p-4 text-lg text-chai-text-primary"
            placeholder={t('app.password')}
            placeholderTextColor="#757575"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize='none'
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)} className="p-4">
            <Feather name={showPassword ? 'eye-off' : 'eye'} size={24} color="#757575" />
          </Pressable>
        </View>

        <Pressable
          onPress={handleLogin}
          className="bg-chai-primary p-4 rounded-xl items-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg font-bold">{t('app.login')}</Text>
          )}
        </Pressable>

        <View className="flex-row justify-end mt-3">
          <Link href="/forgot-password"><Text className="text-chai-primary font-semibold">{t('app.forgot_password')}</Text></Link>
        </View>

        <View className="flex-row justify-center items-center mt-6">
          <Text className="text-chai-text-secondary text-lg">{t('app.dont_have_account')}</Text>
          <Link href="/register">
            <Text className="text-chai-primary font-bold">{t('app.signup')}</Text>
          </Link>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}