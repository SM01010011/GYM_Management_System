/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password?: string
  ) => Promise<{ success: boolean; user: User; role: UserRole }>;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  demoLogin: (role: UserRole) => void;
  activeView: 'public' | 'login' | 'owner' | 'staff' | 'customer';
  setActiveView: (view: 'public' | 'login' | 'owner' | 'staff' | 'customer') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapDatabaseRoleToUiRole(databaseRole: string): UserRole {
  switch (databaseRole) {
    case 'admin':
      return 'OWNER';
    case 'staff':
      return 'STAFF';
    case 'trainer':
      return 'TRAINER';
    case 'customer':
    default:
      return 'CUSTOMER';
  }
}

function getViewForRole(role: UserRole): 'owner' | 'staff' | 'customer' {
  if (role === 'OWNER') return 'owner';
  if (role === 'STAFF') return 'staff';

  // Trainer UI will be added in the next phase.
  // Until then, trainers receive the least-privileged existing portal.
  return 'customer';
}

function profileToUser(profile: {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}, email: string): User {
  return {
    uid: profile.id,
    name: profile.full_name || email.split('@')[0],
    email,
    phone: profile.phone || undefined,
    role: mapDatabaseRoleToUiRole(profile.role),
    avatarUrl: profile.avatar_url || undefined,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveViewState] = useState<
    'public' | 'login' | 'owner' | 'staff' | 'customer'
  >('public');

  const loadProfile = async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      setSession(null);
      setCurrentUser(null);
      setActiveViewState('public');
      return;
    }

    setSession(currentSession);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, avatar_url, role, created_at, updated_at')
      .eq('id', currentSession.user.id)
      .single();

    if (error || !profile) {
      console.error('Unable to load application profile:', error);
      await supabase.auth.signOut();
      setSession(null);
      setCurrentUser(null);
      setActiveViewState('login');
      throw new Error(
        'Your authentication account exists, but your Warrior Fitness profile is not available yet.'
      );
    }

    const user = profileToUser(profile, currentSession.user.email || '');
    setCurrentUser(user);
    setActiveViewState(getViewForRole(user.role));
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error('Failed to restore Supabase session:', error);
        setIsLoading(false);
        return;
      }

      try {
        await loadProfile(data.session);
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;

      try {
        await loadProfile(nextSession);
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (
    email: string,
    password?: string
  ): Promise<{ success: boolean; user: User; role: UserRole }> => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password?.trim() || '';

    if (!normalizedEmail || !normalizedPassword) {
      throw new Error('Email and password are required.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.session || !data.user) {
      throw new Error('Authentication succeeded but no session was returned.');
    }

    await loadProfile(data.session);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, phone, avatar_url, role, created_at, updated_at')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Authenticated user profile could not be loaded.');
    }

    const user = profileToUser(profile, data.user.email || normalizedEmail);

    return {
      success: true,
      user,
      role: user.role,
    };
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }

    setSession(null);
    setCurrentUser(null);
    setActiveViewState('public');
  };

  // Deliberately disabled: role switching must never be a frontend privilege.
  const switchRole = (_newRole: UserRole) => {
    console.warn('Role switching is disabled. Roles are controlled by Supabase/PostgreSQL.');
  };

  const demoLogin = (_role: UserRole) => {
    console.warn('Demo login is disabled. Use a real Supabase Auth account.');
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
  const isAuthenticated = session !== null && currentUser !== null;

  const value = useMemo(
    () => ({
      currentUser,
      role,
      isAuthenticated,
      isLoading,
      login,
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
