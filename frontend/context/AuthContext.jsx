// frontend/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

// --- IMPORTANT ---
// This should be the IP address of the computer running your backend server.
// For testing on your local network, find your computer's IPv4 address.
// On Windows, open Command Prompt and type `ipconfig`.
// On Mac, open Terminal and type `ifconfig`.
// Do NOT use "localhost" as your phone won't be able to find it.
// Normalize API base: allow EXPO_PUBLIC_API_URL with or without trailing "/api" or "/"
const RAW_API = process.env.EXPO_PUBLIC_API_URL || 'http://10.225.33.106:5000';
const API_URL = (RAW_API.endsWith('/api') ? RAW_API : `${RAW_API.replace(/\/$/, '')}/api`);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          // You might want to verify the token with the backend here
          setUserToken(token);
        }
      } catch (e) {
        console.error('Failed to load token from storage', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token } = response.data;
      setUserToken(token);
      await AsyncStorage.setItem('userToken', token);
      Toast.show({ type: 'success', text1: 'Welcome back!' });
      router.replace('/(tabs)/home'); // Navigate to home on successful login
    } catch (error) {
      const serverMsg = error?.response?.data?.msg || error?.response?.data || error?.message || 'Unknown error';
      console.error('Login failed:', serverMsg);
      Toast.show({ type: 'error', text1: 'Login failed', text2: String(serverMsg) });
    }
  };

  const authenticateWithToken = async (token, welcomeText = 'Welcome!') => {
    try {
      setUserToken(token);
      await AsyncStorage.setItem('userToken', token);
      Toast.show({ type: 'success', text1: welcomeText });
      router.replace('/(tabs)/home');
    } catch (e) {
      console.error('Failed to store token', e);
    }
  };

  const logout = async () => {
    setUserToken(null);
    await AsyncStorage.removeItem('userToken');
    Toast.show({ type: 'success', text1: 'Logged out' });
    router.replace('/'); // Navigate back to login
  };

  const value = {
    userToken,
    isLoading,
    login,
    authenticateWithToken,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);