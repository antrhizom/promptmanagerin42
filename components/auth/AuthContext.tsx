'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { istAdminEmail } from '@/lib/constants';
import { generiereIndividuellenCode } from '@/lib/utils/generateCode';

// Firebase Auth wird lazy geladen (nur für Admin-Login benötigt).
let firebaseAuthPromise: Promise<typeof import('firebase/auth')> | null = null;
let firebaseAppPromise: Promise<{ auth: import('firebase/auth').Auth }> | null = null;

function getFirebaseAuth() {
  if (!firebaseAppPromise) {
    firebaseAppPromise = import('@/lib/firebase').then(m => ({ auth: m.auth }));
  }
  if (!firebaseAuthPromise) {
    firebaseAuthPromise = import('firebase/auth');
  }
  return Promise.all([firebaseAppPromise, firebaseAuthPromise]);
}

interface AuthContextType {
  // Namens-Login für Besucher (zum Kommentieren). Keine echte Auth — nur Identität/Name.
  isAuthenticated: boolean;
  username: string;
  userCode: string;
  loginWithCode: (code: string, name: string) => Promise<void>;
  registerNewUser: (name: string) => Promise<string>;
  checkAndLoadUser: (code: string) => Promise<string | null>;
  logoutUser: () => void;

  // Admin (echte Firebase-Auth).
  isAdmin: boolean;
  adminUser: { email: string } | null;
  adminLoading: boolean;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logoutAdmin: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [userCode, setUserCode] = useState('');

  const [adminUser, setAdminUser] = useState<{ email: string } | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const isAdmin = !!adminUser;

  // Namens-Login aus localStorage wiederherstellen.
  useEffect(() => {
    const savedUsername = localStorage.getItem('username');
    let savedCode = localStorage.getItem('userCode');
    if (savedCode && savedCode.startsWith('user_')) {
      savedCode = savedCode.replace('user_', '');
      localStorage.setItem('userCode', savedCode);
    }
    if (savedUsername && savedCode) {
      setUsername(savedUsername);
      setUserCode(savedCode);
      setIsAuthenticated(true);
    }
  }, []);

  // Admin-Status aus dem ECHTEN Firebase-Auth-State ableiten (nicht aus localStorage).
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        const [{ auth }, { onAuthStateChanged }] = await getFirebaseAuth();
        unsub = onAuthStateChanged(auth, (user) => {
          if (user && istAdminEmail(user.email)) {
            setAdminUser({ email: user.email || '' });
          } else {
            setAdminUser(null);
          }
          setAdminLoading(false);
        });
      } catch {
        setAdminLoading(false);
      }
    })();
    return () => unsub();
  }, []);

  // --- Namens-Login (Besucher) ---
  const checkAndLoadUser = useCallback(async (code: string): Promise<string | null> => {
    if (!code || code.length < 6) return null;
    try {
      const res = await fetch(`/api/users?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data.exists) return data.username;
      return null;
    } catch {
      return null;
    }
  }, []);

  const saveUser = useCallback(async (code: string, name: string) => {
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, username: name }),
      });
    } catch {
      // Speichern ist optional — Login funktioniert auch lokal.
    }
  }, []);

  const loginWithCode = useCallback(async (code: string, name: string) => {
    await saveUser(code, name.trim());
    localStorage.setItem('username', name.trim());
    localStorage.setItem('userCode', code);
    setUsername(name.trim());
    setUserCode(code);
    setIsAuthenticated(true);
  }, [saveUser]);

  const registerNewUser = useCallback(async (name: string): Promise<string> => {
    const code = generiereIndividuellenCode();
    await saveUser(code, name.trim());
    localStorage.setItem('username', name.trim());
    localStorage.setItem('userCode', code);
    setUsername(name.trim());
    setUserCode(code);
    setIsAuthenticated(true);
    return code;
  }, [saveUser]);

  const logoutUser = useCallback(() => {
    localStorage.removeItem('username');
    localStorage.removeItem('userCode');
    setUsername('');
    setUserCode('');
    setIsAuthenticated(false);
  }, []);

  // --- Admin-Login (echte Firebase-Auth) ---
  const loginAdmin = useCallback(async (email: string, password: string) => {
    const [{ auth }, { signInWithEmailAndPassword, signOut }] = await getFirebaseAuth();
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (!istAdminEmail(cred.user.email)) {
      await signOut(auth).catch(() => {});
      throw new Error('Kein Admin-Zugriff für dieses Konto.');
    }
    setAdminUser({ email: cred.user.email || '' });
  }, []);

  const logoutAdmin = useCallback(async () => {
    try {
      const [{ auth }, { signOut }] = await getFirebaseAuth();
      await signOut(auth);
    } catch {
      // ignorieren
    }
    setAdminUser(null);
  }, []);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    try {
      const [{ auth }] = await getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return null;
      return await user.getIdToken();
    } catch {
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated, username, userCode,
      loginWithCode, registerNewUser, checkAndLoadUser, logoutUser,
      isAdmin, adminUser, adminLoading,
      loginAdmin, logoutAdmin, getIdToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
