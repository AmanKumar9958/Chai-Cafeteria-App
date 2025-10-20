import React from 'react';
import { View, Image, Pressable, Text, ActivityIndicator } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase.config'; // Ensure path is correct

// IMPORTANT: Paste your Client IDs here
const WEB_CLIENT_ID = 'YOUR_GOOGLE_WEB_CLIENT_ID';
const IOS_CLIENT_ID = 'YOUR_GOOGLE_IOS_CLIENT_ID';
const ANDROID_CLIENT_ID = 'YOUR_GOOGLE_ANDROID_CLIENT_ID';

export default function LoginScreen() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
  });

  React.useEffect(() => {
    const handleResponse = async () => {
      if (response?.type === 'success') {
        const { id_token } = response.params;
        const credential = GoogleAuthProvider.credential(id_token);
        const userCredential = await signInWithCredential(auth, credential);

        if (userCredential.user) {
          const userRef = doc(db, 'users', userCredential.user.uid);
          const userDoc = await getDoc(userRef);

          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: userCredential.user.uid,
              email: userCredential.user.email,
              displayName: userCredential.user.displayName,
              photoURL: userCredential.user.photoURL,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
      setIsLoading(false);
    };

    if (response) {
      handleResponse();
    }
  }, [response]);

  const handleSignIn = () => {
    setIsLoading(true);
    promptAsync();
  };

  return (
    <View className="flex-1 justify-center items-center bg-[#FDEADB] p-6">
      <Image 
        source={require('../assets/images/chai-cafeteria-icon.png')} // Update path to your logo
        className="w-36 h-36 mb-8" 
        resizeMode="contain" 
      />
      <Image 
        source={require('../assets/images/food-image.png')} // Update path to a food image
        className="w-full h-52 mb-16 rounded-lg" 
        resizeMode="cover"
      />
      
      <Pressable
        disabled={!request || isLoading}
        onPress={handleSignIn}
        className="bg-blue-600 w-full p-4 rounded-lg flex-row justify-center items-center"
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-lg font-bold">Sign in with Google</Text>
        )}
      </Pressable>
    </View>
  );
}
