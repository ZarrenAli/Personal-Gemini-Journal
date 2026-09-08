// Safe client-side Firebase configuration reading from import.meta.env
// with seamless fallbacks to avoid build/runtime crashes across Vercel, Cloud Run, and local environments
export const firebaseClientConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB0tpL-nPSrT5OPWcpZ8_D__7fLdf7ViBs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0297759518.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0297759518",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0297759518.firebasestorage.app",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:785285620160:web:d07623e7fcdc021fc1a825",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-geminijournalref-96e069c6-85d4-41c8-be78-20236434d37f",
};
