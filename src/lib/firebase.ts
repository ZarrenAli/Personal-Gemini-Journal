import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Read Firebase configuration directly from environment variables (import.meta.env)
// with safe fallback defaults for multi-cloud deployments (Vercel, Cloud Run, Netlify)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyB0tpL-nPSrT5OPWcpZ8_D__7fLdf7ViBs',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'gen-lang-client-0297759518.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0297759518',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'gen-lang-client-0297759518.firebasestorage.app',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:785285620160:web:d07623e7fcdc021fc1a825',
};

const firestoreDatabaseId =
  import.meta.env.VITE_FIREBASE_DATABASE_ID ||
  'ai-studio-geminijournalref-96e069c6-85d4-41c8-be78-20236434d37f';

// Initialize Firebase App instance safely (singleton pattern)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Authentication Instance
export const auth = getAuth(app);

// Dedicated Google Authentication Provider with prompt configuration
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Firestore Database Instance targeting provisioned database ID
export const db = getFirestore(app, firestoreDatabaseId || '(default)');

// Sign-in Helper with clear error diagnostics
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Firebase Auth Error:', error);
    throw error;
  }
}

// Sign-out Helper
export async function logoutUser() {
  await signOut(auth);
}
