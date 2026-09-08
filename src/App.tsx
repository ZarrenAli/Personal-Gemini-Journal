import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, logoutUser } from './lib/firebase';
import { sanitizePayload } from './lib/sanitizer';
import { AuthUserProfile } from './types';
import { AuthLanding } from './components/AuthLanding';
import { Dashboard } from './components/Dashboard';
import { Sparkles, Loader2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUserProfile | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const userProfile: AuthUserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };
        setCurrentUser(userProfile);

        // Sync or update user record in isolated Firestore document
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          await setDoc(
            userDocRef,
            sanitizePayload({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              lastLoginAt: new Date().toISOString(),
            }),
            { merge: true }
          );
        } catch (dbErr) {
          console.warn('Initial user profile sync non-critical notice:', dbErr);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  // Auth Loading State
  if (authChecking) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center text-stone-700">
        <div className="w-12 h-12 rounded-2xl bg-stone-900 text-stone-100 flex items-center justify-center shadow-sm mb-4">
          <Sparkles className="w-6 h-6 text-amber-300" />
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-stone-600">
          <Loader2 className="w-4 h-4 animate-spin text-stone-800" />
          <span>Verifying authentication state...</span>
        </div>
      </div>
    );
  }

  // Not Authenticated -> Show Landing Page with Google Sign-In
  if (!currentUser) {
    return <AuthLanding />;
  }

  // Authenticated -> Show Private Dashboard
  return (
    <Dashboard
      user={currentUser}
      onLogout={handleLogout}
    />
  );
}
