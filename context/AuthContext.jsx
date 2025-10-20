import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase.config'; // Ensure this path is correct
import * as SplashScreen from 'expo-splash-screen';
import { router } from 'expo-router';

// Keep the splash screen visible while we check auth status
SplashScreen.preventAutoHideAsync();

const AuthContext = createContext({ user: null });

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This listener from Firebase checks if the user is logged in
    const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      setUser(authenticatedUser);
      if (loading) {
        setLoading(false);
      }
    });

    return () => unsubscribe(); // Cleanup the listener
  }, []);

  useEffect(() => {
    // Hide the splash screen once we're done checking the auth state
    if (!loading) {
      SplashScreen.hideAsync();
      // Navigate the user to the correct screen
      if (user) {
        // If user is logged in, go to the home screen
        router.replace('/(tabs)/home');
      } else {
        // If user is not logged in, stay on the login screen
        router.replace('/');
      }
    }
  }, [loading, user]);

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
