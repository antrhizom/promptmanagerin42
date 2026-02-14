'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { generiereIndividuellenCode } from '@/lib/utils/generateCode';

interface AuthContextType {
  // Code-based user auth
  isAuthenticated: boolean;
  username: string;
  userCode: string;
  loginWithCode: (code: string, name: string) => Promise<void>;
  registerNewUser: (name: string) => Promise<string>;
  checkAndLoadUser: (code: string) => Promise<string | null>;
  logoutUser: () => void;

  // Firebase admin auth
  isAdmin: boolean;
  adminUser: User | null;
  adminLoading: boolean;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logoutAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [userCode, setUserCode] = useState('');

  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const isAdmin = !!adminUser;

  // Initialize code-based auth from localStorage
  useEffect(() => {
    const savedUsername = localStorage.getItem('username');
    let savedCode = localStorage.getItem('userCode');

    // Migration: old "user_ABC123" to "ABC123"
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

  // Firebase Auth listener for admin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
      setAdminLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const checkAndLoadUser = useCallback(async (code: string): Promise<string | null> => {
    if (!code || code.length < 6) return null;
    try {
      const userDoc = await getDoc(doc(db, 'users', code));
      if (userDoc.exists()) {
        return userDoc.data().username;
      }
      return null;
    } catch (error) {
      console.error('Fehler beim Laden des Users:', error);
      return null;
    }
  }, []);

  const saveUser = useCallback(async (code: string, name: string) => {
    try {
      await setDoc(doc(db, 'users', code), {
        username: name,
        createdAt: serverTimestamp()
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

  const loginAdmin = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const logoutAdmin = useCallback(async () => {
    await signOut(auth);
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
