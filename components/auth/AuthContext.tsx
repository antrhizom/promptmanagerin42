'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { generiereIndividuellenCode } from '@/lib/utils/generateCode';

// Lazy-load Firebase Auth only when admin login is needed
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
  isAuthenticated: boolean;
  username: string;
  userCode: string;
  loginWithCode: (code: string, name: string) => Promise<void>;
  registerNewUser: (name: string) => Promise<string>;
  checkAndLoadUser: (code: string) => Promise<string | null>;
  logoutUser: () => void;

  isAdmin: boolean;
  adminUser: { email: string } | null;
  adminLoading: boolean;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logoutAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [userCode, setUserCode] = useState('');

  const [adminUser, setAdminUser] = useState<{ email: string } | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const isAdmin = !!adminUser;

  // Initialize code-based auth from localStorage
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

    // Check admin from localStorage
    const savedAdmin = localStorage.getItem('adminEmail');
    if (savedAdmin) {
      setAdminUser({ email: savedAdmin });
    }
    setAdminLoading(false);
  }, []);

  // Check and load user via API
  const checkAndLoadUser = useCallback(async (code: string): Promise<string | null> => {
    if (!code || code.length < 6) return null;
    try {
      const res = await fetch(`/api/users?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data.exists) return data.username;
      return null;
    } catch (error) {
      console.error('Fehler beim Laden des Users:', error);
      return null;
    }
  }, []);

  // Save user via API
  const saveUser = useCallback(async (code: string, name: string) => {
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, username: name })
      });
    } catch (error) {
      console.error('Fehler beim Speichern des Users:', error);
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

  // Admin login via Firebase Auth (lazy loaded)
  const loginAdmin = useCallback(async (email: string, password: string) => {
    const [{ auth }, { signInWithEmailAndPassword }] = await getFirebaseAuth();
    await signInWithEmailAndPassword(auth, email, password);
    localStorage.setItem('adminEmail', email);
    setAdminUser({ email });
  }, []);

  const logoutAdmin = useCallback(async () => {
    try {
      const [{ auth }, { signOut }] = await getFirebaseAuth();
      await signOut(auth);
    } catch {
      // Ignore signout errors
    }
    localStorage.removeItem('adminEmail');
    setAdminUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated, username, userCode,
      loginWithCode, registerNewUser, checkAndLoadUser, logoutUser,
      isAdmin, adminUser, adminLoading,
      loginAdmin, logoutAdmin
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
