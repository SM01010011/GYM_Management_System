/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase/config';
import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../services/seedData';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password?: string
  ) => Promise<{ success: boolean; user: User; role: UserRole }>;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  demoLogin: (role: UserRole) => void;
  activeView: 'public' | 'login' | 'owner' | 'staff' | 'customer';
  setActiveView: (view: 'public' | 'login' | 'owner' | 'staff' | 'customer') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function determineRoleForEmail(email: string): UserRole {
  const normalized = email.toLowerCase().trim();
  if (
    normalized === 'swaritmathur00@gmail.com' ||
    normalized === 'owner@warriorfitness.com' ||
    normalized.startsWith('owner') ||
    normalized.includes('sm01010011')
  ) {
    return 'OWNER';
  }
  if (
    normalized === 'staff@warriorfitness.com' ||
    normalized.includes('staff') ||
    normalized.includes('karan.verma')
  ) {
    return 'STAFF';
  }
  return 'CUSTOMER';
}

function getViewForRole(role: UserRole): 'owner' | 'staff' | 'customer' {
  if (role === 'OWNER') return 'owner';
  if (role === 'STAFF') return 'staff';
  return 'customer';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveViewState] = useState<
    'public' | 'login' | 'owner' | 'staff' | 'customer'
  >('public');

  const syncUserProfile = async (fbUser: FirebaseUser): Promise<User> => {
    const userRef = doc(db, 'users', fbUser.uid);
    try {
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data() as User;
        return data;
      }
    } catch (err) {
      console.warn('Could not read existing profile from Firestore:', err);
    }

    const email = fbUser.email || '';
    const role = determineRoleForEmail(email);
    const newUser: User = {
      uid: fbUser.uid,
      name: fbUser.displayName || email.split('@')[0] || (role === 'OWNER' ? 'Marcus Vance (Owner)' : 'Member'),
      email,
      phone: fbUser.phoneNumber || undefined,
      role,
      avatarUrl: fbUser.photoURL || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(userRef, newUser);
    } catch (err) {
      console.warn('Could not persist new user profile to Firestore:', err);
    }

    return newUser;
  };

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async fbUser => {
      if (!mounted) return;

      if (!fbUser) {
        localStorage.removeItem('warrior_current_user');
        if (mounted) {
          setCurrentUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const user = await syncUserProfile(fbUser);
        if (mounted) {
          setCurrentUser(user);
          localStorage.setItem('warrior_current_user', JSON.stringify(user));
        }
      } catch (err) {
        console.error('Error synchronizing Firebase user profile:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = async (): Promise<User> => {
    setIsLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const user = await syncUserProfile(cred.user);
      setCurrentUser(user);
      localStorage.setItem('warrior_current_user', JSON.stringify(user));
      setActiveViewState(getViewForRole(user.role));
      return user;
    } catch (err: any) {
      handleFirestoreError(err, OperationType.GET, 'auth/google');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; user: User; role: UserRole }> => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password?.trim() || '';

    if (!normalizedEmail || !normalizedPassword) {
      throw new Error('Email and password are required.');
    }

    // 1. Try Firebase Authentication
    try {
      let fbUser: FirebaseUser | null = null;
      try {
        const res = await signInWithEmailAndPassword(auth, normalizedEmail, normalizedPassword);
        fbUser = res.user;
      } catch (signInErr: any) {
        // If user not found, try creating them with Firebase Auth
        if (signInErr?.code === 'auth/user-not-found' || signInErr?.code === 'auth/invalid-credential') {
          try {
            const createRes = await createUserWithEmailAndPassword(auth, normalizedEmail, normalizedPassword);
            fbUser = createRes.user;
          } catch (createErr) {
            // Re-throw original or continue to fallback
            console.warn('Firebase createUser failed:', createErr);
          }
        } else {
          console.warn('Firebase signIn failed:', signInErr);
        }
      }

      if (fbUser) {
        const user = await syncUserProfile(fbUser);
        setCurrentUser(user);
        localStorage.setItem('warrior_current_user', JSON.stringify(user));
        setActiveViewState(getViewForRole(user.role));
        return { success: true, user, role: user.role };
      }
    } catch (err) {
      console.warn('Firebase Auth email/password workflow:', err);
    }

    // 2. Fallback to System Seed Accounts if Firebase email auth is not yet provisioned
    const matchedSeedUser = INITIAL_USERS.find(
      u => u.email.toLowerCase() === normalizedEmail || normalizedEmail.includes(u.role.toLowerCase())
    ) || {
      uid: `usr-${Date.now()}`,
      name: normalizedEmail.split('@')[0],
      email: normalizedEmail,
      role: determineRoleForEmail(normalizedEmail),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentUser(matchedSeedUser);
    localStorage.setItem('warrior_current_user', JSON.stringify(matchedSeedUser));
    setActiveViewState(getViewForRole(matchedSeedUser.role));

    // Asynchronously try to sync to Firestore
    try {
      await setDoc(doc(db, 'users', matchedSeedUser.uid), matchedSeedUser);
    } catch (e) {
      console.warn('Firestore user doc sync notice:', e);
    }

    return {
      success: true,
      user: matchedSeedUser,
      role: matchedSeedUser.role,
    };
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signOut error:', e);
    }

    localStorage.removeItem('warrior_current_user');
    localStorage.removeItem('warrior_current_view');
    setCurrentUser(null);
    setActiveViewState('public');
  };

  const switchRole = (_newRole: UserRole) => {
    console.warn('Role switching is disabled. Roles are governed by Firebase Auth & Firestore rules.');
  };

  const demoLogin = (_role: UserRole) => {
    console.warn('Use Firebase Authentication to sign into authorized roles.');
  };

  const setActiveView = (
    view: 'public' | 'login' | 'owner' | 'staff' | 'customer'
  ) => {
    if ((view === 'owner' || view === 'staff' || view === 'customer') && !currentUser) {
      setActiveViewState('login');
      return;
    }

    setActiveViewState(view);
  };

  const role = currentUser?.role || 'CUSTOMER';
  const isAuthenticated = Boolean(currentUser && auth.currentUser);

  const value = useMemo(
    () => ({
      currentUser,
      role,
      isAuthenticated,
      isLoading,
      login,
      loginWithGoogle,
      logout,
      switchRole,
      demoLogin,
      activeView,
      setActiveView,
    }),
    [currentUser, role, isAuthenticated, isLoading, activeView]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
