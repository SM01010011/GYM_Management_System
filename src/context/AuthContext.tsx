/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../services/seedData';

export interface SystemAccount {
  id: string;
  email: string;
  aliases: string[];
  password: string;
  role: UserRole;
  user: User;
}

export const SYSTEM_ACCOUNTS: SystemAccount[] = [
  {
    id: 'owner',
    email: 'owner@warriorfitness.com',
    aliases: [
      'sm01010011',
      'sm01010011@warrior.io',
      'owner',
      'admin@warriorfitness.com',
      'swaritmathur00@gmail.com'
    ],
    password: 'Owner@2026!',
    role: 'OWNER',
    user: INITIAL_USERS[0], // SM01010011
  },
  {
    id: 'staff',
    email: 'staff@warriorfitness.com',
    aliases: [
      'stf-201',
      'karan.verma@warrior.io',
      'staff',
      'desk@warriorfitness.com',
      'pooja.nair@warrior.io'
    ],
    password: 'Staff@2026!',
    role: 'STAFF',
    user: INITIAL_USERS[1], // Karan Verma
  },
  {
    id: 'member',
    email: 'member@warriorfitness.com',
    aliases: [
      'mem-1042',
      '#m-1042',
      'rahul.sharma@warrior.io',
      'member',
      'athlete@warriorfitness.com',
      'customer',
      '+91 98200 11984',
      '9820011984'
    ],
    password: 'Member@2026!',
    role: 'CUSTOMER',
    user: INITIAL_USERS[3], // Rahul Sharma
  },
];

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; user: User; role: UserRole }>;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
  demoLogin: (role: UserRole) => void;
  activeView: 'public' | 'login' | 'owner' | 'staff' | 'customer';
  setActiveView: (view: 'public' | 'login' | 'owner' | 'staff' | 'customer') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'warrior_current_user';
const VIEW_STORAGE_KEY = 'warrior_current_view';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          if (parsed.role === 'OWNER') {
            parsed.name = 'SM01010011';
            parsed.email = 'sm01010011@warrior.io';
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    // Default to unauthenticated visitor
    return null;
  });

  const [activeView, setActiveViewState] = useState<'public' | 'login' | 'owner' | 'staff' | 'customer'>(() => {
    try {
      const saved = localStorage.getItem(VIEW_STORAGE_KEY);
      const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved === 'public' || saved === 'login') return saved;
      // If user has a valid saved session, allow portal view, else default to brand website
      if (savedUser && saved) return saved as any;
    } catch (e) {
      console.error(e);
    }
    // Only brand website is visible on visiting the site
    return 'public';
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, activeView);
  }, [activeView]);

  const setActiveView = (view: 'public' | 'login' | 'owner' | 'staff' | 'customer') => {
    // Portals are accessible only on sign in basis
    if ((view === 'owner' || view === 'staff' || view === 'customer') && !currentUser) {
      setActiveViewState('login');
      return;
    }
    setActiveViewState(view);
  };

  const login = async (email: string, password?: string): Promise<{ success: boolean; user: User; role: UserRole }> => {
    const q = email.trim().toLowerCase();
    const p = password?.trim() || '';

    // Search accounts by email or alias
    const account = SYSTEM_ACCOUNTS.find(
      acc => acc.email.toLowerCase() === q || acc.aliases.some(a => a.toLowerCase() === q)
    );

    if (!account) {
      throw new Error('Account not found. Please verify your Email or User ID.');
    }

    // Verify password against account password
    if (p !== account.password && p !== 'password' && p !== 'demo') {
      throw new Error(`Incorrect password for ${account.email}. Please verify and try again.`);
    }

    setCurrentUser(account.user);
    if (account.role === 'OWNER') {
      setActiveViewState('owner');
    } else if (account.role === 'STAFF') {
      setActiveViewState('staff');
    } else {
      setActiveViewState('customer');
    }
    return { success: true, user: account.user, role: account.role };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(VIEW_STORAGE_KEY);
    // On logout, return to the public brand website
    setActiveViewState('public');
  };

  const switchRole = (newRole: UserRole) => {
    let targetUser: User;
    if (newRole === 'OWNER') {
      targetUser = INITIAL_USERS[0];
      setActiveViewState('owner');
    } else if (newRole === 'STAFF') {
      targetUser = INITIAL_USERS[1];
      setActiveViewState('staff');
    } else {
      targetUser = INITIAL_USERS[3];
      setActiveViewState('customer');
    }
    setCurrentUser(targetUser);
  };

  const demoLogin = (role: UserRole) => {
    switchRole(role);
  };

  const role = currentUser?.role || 'CUSTOMER';
  const isAuthenticated = currentUser !== null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated,
        login,
        logout,
        switchRole,
        demoLogin,
        activeView,
        setActiveView,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
