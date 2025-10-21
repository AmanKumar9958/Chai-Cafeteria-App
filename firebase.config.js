import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: Paste your config from the Firebase console here
const firebaseConfig = {
  apiKey: "AIzaSyAIHTtPbjgA8MRlpRvErYz1VI8kd7UqQiw",
  authDomain: "chaicafeteriaapp.firebaseapp.com",
  projectId: "chaicafeteriaapp",
  storageBucket: "chaicafeteriaapp.firebasestorage.app",
  messagingSenderId: "795062308567",
  appId: "1:795062308567:web:ba9fb79326074f458f2a92",
  measurementId: "G-1QCBKG1XMD"
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence to save the user's session
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);