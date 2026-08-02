/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Firebase Admin SDK for Server-Side (API Routes)
 * Uses firebase/firestore directly since Firestore rules allow writes
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, serverTimestamp, Firestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase for server-side usage
let serverApp: FirebaseApp;
let serverDb: Firestore;
let serverStorage: FirebaseStorage;

const existingApps = getApps();
if (existingApps.length === 0) {
  serverApp = initializeApp(firebaseConfig);
} else {
  serverApp = existingApps[0];
}

serverDb = getFirestore(serverApp);
serverStorage = getStorage(serverApp);

export { serverDb, serverStorage };
export {
  collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, serverTimestamp,
  ref, uploadBytes, getDownloadURL,
};
