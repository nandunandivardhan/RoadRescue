import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAKzpvFCNW47p7yc6UsBCC6jiDT4vxyMuc",
  authDomain: "roadrescue-c58e6.firebaseapp.com",
  projectId: "roadrescue-c58e6",
  storageBucket: "roadrescue-c58e6.firebasestorage.app",
  messagingSenderId: "370523129062",
  appId: "1:370523129062:android:03a39d7abb4010b706a727",
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
