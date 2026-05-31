/**
 * TiffinFlow Auth Context
 * Provides Firebase auth state + user profile + role across the app
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthChanged, FirebaseUser } from '../services/firebase/auth.service';
import { getUserProfile } from '../services/firebase/auth.service';
import type { User, UserRole } from '../types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: User | null;
  role: UserRole;
  isLoading: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  userProfile: null,
  role: 'user',
  isLoading: true,
  isAuthenticated: false,
  isProfileComplete: false,
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (user: FirebaseUser) => {
    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (err) {
      console.warn('Failed to load user profile:', err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthChanged(async (user) => {
      setFirebaseUser(user);
      if (user) {
        await loadProfile(user);
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (firebaseUser) {
      await loadProfile(firebaseUser);
    }
  }, [firebaseUser, loadProfile]);

  const role: UserRole = userProfile?.role ?? 'user';
  const isAuthenticated = !!firebaseUser;
  const isProfileComplete = !!(userProfile?.name && userProfile?.officeId);

  return (
    <AuthContext.Provider value={{
      firebaseUser,
      userProfile,
      role,
      isLoading,
      isAuthenticated,
      isProfileComplete,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
