import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAIHTtPbjgA8MRlpRvErYz1VI8kd7UqQiw",
  authDomain: "chaicafeteriaapp.firebaseapp.com",
  projectId: "chaicafeteriaapp",
  storageBucket: "chaicafeteriaapp.firebasestorage.app",
  messagingSenderId: "795062308567",
  appId: "1:795062308567:web:ba9fb79326074f458f2a92",
  measurementId: "G-1QCBKG1XMD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);