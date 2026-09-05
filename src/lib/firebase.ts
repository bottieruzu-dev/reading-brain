// File: src/lib/firebase.ts
import { Platform } from 'react-native';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 取得したFirebaseの設定値を直接セット
const firebaseConfig = {
  apiKey: "AIzaSyA07lyf9Xh7OAVB37krgBJZxutrarfmLVg",
  authDomain: "reading-brain.firebaseapp.com",
  projectId: "reading-brain",
  storageBucket: "reading-brain.firebasestorage.app",
  messagingSenderId: "609566500507",
  appId: "1:609566500507:web:859108d893518ee362083e",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig as any);

let _auth: Auth;
if (Platform.OS === 'web') {
  _auth = getAuth(app);
} else {
  try {
    const authMod: any = require('firebase/auth');
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    _auth = authMod.initializeAuth(app, {
      persistence: authMod.getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    _auth = getAuth(app);
  }
}

export const auth = _auth;
export const db = getFirestore(app);