/**
 * TiffinFlow Auth Service using Python Backend & SQLite
 * Handles user authentication sessions, profile management, and session state observers.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { User, UserRole, DefaultMealPreference } from '../../types';

// ── Custom FirebaseUser Interface ─────────────────────────────────────
export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber?: string | null;
  photoURL?: string | null;
}

// Helper to determine the dynamic backend URL (handles Android emulator local bridge)
export const getBackendUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000/api';
  if (Platform.OS === 'android' && envUrl.includes('localhost')) {
    return envUrl.replace('localhost', '10.0.2.2');
  }
  return envUrl;
};

// ── Session Management ────────────────────────────────────────────────
let authCallbacks: ((user: FirebaseUser | null) => void)[] = [];
let currentUser: FirebaseUser | null = null;
let isInitialized = false;

const initializeAuth = async () => {
  if (isInitialized) return;
  try {
    const stored = await AsyncStorage.getItem('@tiffinflow_session');
    if (stored) {
      currentUser = JSON.parse(stored);
    }
  } catch (err) {
    console.error('Failed to load session:', err);
  } finally {
    isInitialized = true;
  }
};

const setSession = async (user: FirebaseUser | null) => {
  currentUser = user;
  isInitialized = true;
  try {
    if (user) {
      await AsyncStorage.setItem('@tiffinflow_session', JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem('@tiffinflow_session');
    }
  } catch (err) {
    console.error('Failed to update session:', err);
  }
  // Notify all listeners
  authCallbacks.forEach((cb) => cb(user));
};

// ── Email/Password Authentication ─────────────────────────────────────

/**
 * Sign Up with Email and Password
 */
export const signUpWithEmailAndPassword = async (
  email: string,
  password: string,
  name: string,
  phone: string,
  role: UserRole,
  officeCodeOrName: string,
  defaultMealPreference: DefaultMealPreference = 'flexible'
) => {
  const response = await fetch(`${getBackendUrl()}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      name,
      phone,
      role,
      office_code_or_name: officeCodeOrName,
      default_meal_preference: defaultMealPreference,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Sign up failed');
  }

  const data = await response.json();
  const firebaseUser: FirebaseUser = {
    uid: data.user.uid,
    email: data.user.email,
    displayName: data.user.displayName,
    phoneNumber: data.user.phoneNumber,
  };

  await setSession(firebaseUser);
  return { user: firebaseUser };
};

/**
 * Sign In with Email and Password
 */
export const signInWithEmailAndPassword = async (email: string, password: string) => {
  const response = await fetch(`${getBackendUrl()}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Invalid email or password.');
  }

  const data = await response.json();
  const firebaseUser: FirebaseUser = {
    uid: data.user.uid,
    email: data.user.email,
    displayName: data.user.displayName,
    phoneNumber: data.user.phoneNumber,
  };

  await setSession(firebaseUser);
  return { user: firebaseUser };
};

// ── Sign Out ──────────────────────────────────────────────────────────

export const signOut = async () => {
  await setSession(null);
};

// ── User Profile CRUD ─────────────────────────────────────────────────

/**
 * Get user profile from Backend
 */
export const getUserProfile = async (uid: string): Promise<User | null> => {
  const response = await fetch(`${getBackendUrl()}/auth/profile/${uid}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to retrieve user profile');
  }
  const data = await response.json();
  
  // Transform date fields to JS Date objects if needed
  return {
    ...data,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
  } as User;
};

/**
 * Create or update user profile in Backend
 */
export const createUserProfile = async (
  firebaseUser: FirebaseUser,
  data: Partial<User>
): Promise<User> => {
  const response = await fetch(`${getBackendUrl()}/auth/profile/${firebaseUser.uid}/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update user profile');
  }

  const profile = await getUserProfile(firebaseUser.uid);
  if (!profile) {
    throw new Error('Profile not found after update');
  }
  return profile;
};

/**
 * Update FCM token for push notifications
 */
export const updateFCMToken = async (uid: string, token: string) => {
  const response = await fetch(`${getBackendUrl()}/auth/profile/${uid}/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fcmToken: token }),
  });
  if (!response.ok) {
    throw new Error('Failed to update FCM token');
  }
};

/**
 * Get user's role
 */
export const getUserRole = async (uid: string): Promise<UserRole> => {
  const profile = await getUserProfile(uid);
  return profile?.role ?? 'user';
};

// ── Auth State Observer ───────────────────────────────────────────────

export const onAuthChanged = (callback: (user: FirebaseUser | null) => void) => {
  authCallbacks.push(callback);

  if (isInitialized) {
    callback(currentUser);
  } else {
    initializeAuth().then(() => {
      callback(currentUser);
    });
  }

  // Return unsubscribe function
  return () => {
    authCallbacks = authCallbacks.filter((cb) => cb !== callback);
  };
};

// ── Stubbed Unused Auth Methods (to prevent compilation breaks) ──

export const sendOTP = async (phoneNumber: string, recaptchaVerifier: any) => {
  console.log('sendOTP is stubbed out for local python backend.');
  return { verificationId: 'mock-verification-id' };
};

export const verifyOTP = async (verificationId: string, code: string) => {
  console.log('verifyOTP is stubbed out for local python backend.');
  return { user: currentUser };
};

export const signInAnonymously = async () => {
  console.log('signInAnonymously is stubbed out.');
  return { user: currentUser };
};

export const signInWithGoogle = async (idToken: string) => {
  console.log('signInWithGoogle is stubbed out.');
  return { user: currentUser };
};
