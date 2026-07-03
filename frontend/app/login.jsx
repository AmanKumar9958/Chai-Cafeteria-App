// frontend/app/login.jsx
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TextInput, ActivityIndicator, Animated, Easing } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import AnimatedPressable from '../components/AnimatedPressable';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { Feather, AntDesign } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '694500735761-f3l3nn95gk9j7g6ba25os8s6rbj5dn5c.apps.googleusercontent.com',
});

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, googleLogin } = useAuth();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const { t } = useTranslation();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken || userInfo.idToken;
      if (idToken) {
        await googleLogin(idToken);
      } else {
        console.error('No idToken found in Google response');
      }
    } catch (error) {
      console.error('Google Signin Error:', error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

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
      <LanguageSwitcher style={{ position: 'absolute', top: 8, right: 16, zIndex: 50 }} />
      <StatusBar style="dark" />
      <Animated.View
        className="flex-1 justify-center p-8"
        style={{ transform: [{ translateX: slideAnim }], opacity: fadeAnim }}
      >
        <View className="items-center mb-10">
          <ExpoImage source={require('../assets/images/android-icon-background.png')} style={{ width: 220, height: 96 }} contentFit="contain" />
          <Text className="text-3xl font-bold mt-4 text-chai-text-primary py-1">{t('app.welcome_back')}</Text>
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
          <AnimatedPressable onPress={() => setShowPassword(!showPassword)} className="p-4" scaleTo={0.85} haptic={false}>
            <Feather name={showPassword ? 'eye-off' : 'eye'} size={24} color="#757575" />
          </AnimatedPressable>
        </View>

        <AnimatedPressable
          onPress={handleLogin}
          className="bg-chai-primary p-4 rounded-xl items-center"
          disabled={isLoading}
          haptic="selection"
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg font-bold">{t('app.login')}</Text>
          )}
        </AnimatedPressable>

        <View className="flex-row justify-end mt-3">
          <Link href="/forgot-password"><Text className="text-chai-primary font-semibold">{t('app.forgot_password')}</Text></Link>
        </View>

        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-chai-divider" />
          <Text className="mx-4 text-chai-text-secondary font-semibold">OR</Text>
          <View className="flex-1 h-px bg-chai-divider" />
        </View>

        <AnimatedPressable
          onPress={handleGoogleLogin}
          className="border border-chai-divider p-4 rounded-xl items-center flex-row justify-center bg-white"
          disabled={isGoogleLoading || isLoading}
          haptic="selection"
        >
          {isGoogleLoading ? (
            <ActivityIndicator color="#E8751A" />
          ) : (
            <>
              <AntDesign name="google" size={24} color="#DB4437" style={{ marginRight: 10 }} />
              <Text className="text-chai-text-primary text-lg font-bold">Continue with Google</Text>
            </>
          )}
        </AnimatedPressable>

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