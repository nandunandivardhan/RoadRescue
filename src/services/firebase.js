/**
 * Firebase Configuration & Initialization
 * Handles both Native (Android/iOS) and Web SDKs
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

import { 
  initializeAuth, 
  getReactNativePersistence 
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

let auth;

const firebaseConfig = {
  apiKey: "AIzaSyAKzpvFCNW47p7yc6UsBCC6jiDT4vxyMuc",
  authDomain: "roadrescue-c58e6.firebaseapp.com",
  projectId: "roadrescue-c58e6",
  storageBucket: "roadrescue-c58e6.firebasestorage.app",
  messagingSenderId: "370523129062",
  appId: "1:370523129062:android:03a39d7abb4010b706a727",
};

// Toggle to easily switch entire app back and forth between Spring Boot and Firebase
export const USE_FIREBASE_AUTH = true;
export const USE_FIREBASE_FIRESTORE = true;

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
if (Platform.OS === 'web') {
  // Web SDK Auth (standard local persistence)
  const { getAuth } = require('firebase/auth');
  auth = getAuth(app);
} else {
  // Native SDK Auth (@react-native-firebase/auth)
  try {
    auth = require('@react-native-firebase/auth').default();
  } catch (e) {
    console.error('Firebase Auth Native Initialization Error:', e);
    auth = {
      onAuthStateChanged: (cb) => { return () => {}; },
      signOut: async () => {},
      signInWithCredential: async () => { throw new Error('Native Auth unavailable'); },
      createUserWithEmailAndPassword: async () => { throw new Error('Native Auth unavailable'); },
      signInWithEmailAndPassword: async () => { throw new Error('Native Auth unavailable'); },
    };
  }
}

// Initialize Firestore
const db = getFirestore(app);

/**
 * Unified Cross-Platform Auth Helpers
 */
export const loginWithEmail = async (email, password) => {
  if (Platform.OS === 'web') {
    const { signInWithEmailAndPassword } = require('firebase/auth');
    return signInWithEmailAndPassword(auth, email, password);
  } else {
    return auth.signInWithEmailAndPassword(email, password);
  }
};

export const registerWithEmail = async (email, password) => {
  if (Platform.OS === 'web') {
    const { createUserWithEmailAndPassword } = require('firebase/auth');
    return createUserWithEmailAndPassword(auth, email, password);
  } else {
    return auth.createUserWithEmailAndPassword(email, password);
  }
};

export const loginWithGoogle = async (idToken = null) => {
  if (Platform.OS === 'web') {
    const { GoogleAuthProvider, signInWithPopup } = require('firebase/auth');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return signInWithPopup(auth, provider);
  } else {
    if (!idToken) throw new Error('Native Google Login requires idToken');
    const authModule = require('@react-native-firebase/auth').default;
    const credential = authModule.GoogleAuthProvider.credential(idToken);
    return auth.signInWithCredential(credential);
  }
};

export const logout = async () => {
  if (Platform.OS === 'web') {
    const { signOut } = require('firebase/auth');
    return signOut(auth);
  } else {
    return auth.signOut();
  }
};

export const subscribeToAuth = (callback) => {
  if (Platform.OS === 'web') {
    const { onAuthStateChanged } = require('firebase/auth');
    return onAuthStateChanged(auth, callback);
  } else {
    return auth.onAuthStateChanged(callback);
  }
};

export { auth, db };
export default app;

