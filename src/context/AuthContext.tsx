/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Authentication is backed by Supabase Auth. The frontend never stores
 * passwords or decides a user's role.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; user: User; role: UserRole }>;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  demoLogin: (role: UserRole) => void;
  resetPassword: (email: string) => Promise<void>;
  activeView: 'public' | 'login' | 'owner' | 'staff' | 'customer';
  setActiveView: (view: 'public' | 'login' | 'owner' | 'staff' | 'customer') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const VIEW_STORAGE_KEY = 'warrior_current_view';

const mapRole = (role: string | null | undefined): UserRole => {
  switch (role) {
    case 'admin': return 'OWNER';
    case 'staff': return 'STAFF';
    case 'trainer': return 'TRAINER';
    default: return 'CUSTOMER';
  }
};

const mapProfileToUser = (profile: any, email: string): User => ({
  uid: profile.id,
  name: profile.full_name?.trim() || email.split('@')[0],
  email,
  phone: profile.phone || undefined,
  role: mapRole(profile.role),
  avatarUrl: profile.avatar_url || undefined,
  createdAt: profile.created_at,
  updatedAt: profile.updated_at,
});

const viewForRole = (role: UserRole): 'owner' | 'staff' | 'customer' => {
  if (role === 'OWNER') return 'owner';
  if (role === 'STAFF' || role === 'TRAINER') return 'staff';
  return 'customer';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveViewState] = useState<'public' | 'login' | 'owner' | 'staff' | 'customer'>(() => {
    try {
      const saved = localStorage.getItem(VIEW_STORAGE_KEY);
      return saved === 'login' ? 'login' : 'public';
    } catch {
      return 'public';
    }
  });

  const loadSessionUser = async (sessionUser: { id: string; email?: string | null }) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, avatar_url, role, status, created_at, updated_at')
      .eq('id', sessionUser.id)
      .single();

    if (error || !profile) {
      await supabase.auth.signOut();
      throw new Error('Your account profile is missing. Please contact the gym administrator.');
    }

    if (profile.status !== 'active') {
      await supabase.auth.signOut();
      throw new Error('This account is inactive. Please contact the gym administrator.');
    }

    const user = mapProfileToUser(profile, sessionUser.email || '');
    setCurrentUser(user);
    setActiveViewState(viewForRole(user.role));
    return { success: true, user, role: user.role };
  };

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(async ({ data, error }) => {
      if (!mounted || error || !data.session) return;
      try {
        await loadSessionUser(data.session.user);
      } catch (error) {
        console.error('Unable to restore Supabase session:', error);
        if (mounted) {
          setCurrentUser(null);
          setActiveViewState('login');
        }
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (!session) {
        setCurrentUser(null);
        if (event === 'SIGNED_OUT') setActiveViewState('public');
        return;
      }

      // Defer the profile query so auth callbacks never deadlock on Supabase locks.
      setTimeout(() => {
        if (mounted) {
          void loadSessionUser(session.user).catch((error) => {
            console.error('Unable to load authenticated profile:', error);
            if (mounted) {
              setCurrentUser(null);
              setActiveViewState('login');
            }
          });
        }
      }, 0);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, activeView);
  }, [activeView]);

  const setActiveView = (view: 'public' | 'login' | 'owner' | 'staff' | 'customer') => {
    if ((view === 'owner' || view === 'staff' || view === 'customer') && !currentUser) {
      setActiveViewState('login');
      return;
    }
    setActiveViewState(view);
  };

  const login = async (email: string, password?: string) => {
    const q = email.trim().toLowerCase();
    const p = password?.trim() || '';
    if (!q || !p) throw new Error('Email and password are required.');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: q,
      password: p,
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Invalid email or password.');
    }

    return loadSessionUser(data.user);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    localStorage.removeItem(VIEW_STORAGE_KEY);
    setActiveViewState('public');
  };

  const resetPassword = async (email: string) => {
    const q = email.trim().toLowerCase();
    if (!q) throw new Error('Enter your account email first.');

    const { error } = await supabase.auth.resetPasswordForEmail(q, {
      redirectTo: window.location.origin,
    });

    if (error) throw new Error(error.message);
  };

  // Kept for backwards compatibility with older UI controls. It never changes
  // the authenticated role and therefore cannot be used to escalate privileges.
  const switchRole = (newRole: UserRole) => {
    if (!currentUser) {
      setActiveViewState('login');
      return;
    }
    if (newRole !== currentUser.role) {
      console.warn('Role switching is disabled for security. Current role:', currentUser.role);
      return;
    }
    setActiveViewState(viewForRole(currentUser.role));
  };

  const demoLogin = (role: UserRole) => switchRole(role);

  const role = currentUser?.role || 'CUSTOMER';
  const isAuthenticated = currentUser !== null;

  return (
    <AuthContext.Provider value={{
      currentUser,
      role,
      isAuthenticated,
      login,
      logout,
      switchRole,
      demoLogin,
      resetPassword,
      activeView,
      setActiveView,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
