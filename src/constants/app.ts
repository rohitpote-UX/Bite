/**
 * TiffinFlow App Constants
 * Environment config, app-wide constants, and app metadata
 */

// ── App Metadata ──────────────────────────────────────────────────────
export const APP_NAME = 'TiffinFlow';
export const APP_TAGLINE = 'Your office tiffin, simplified 🍱';
export const APP_VERSION = '1.0.0';

// ── Firebase Config ───────────────────────────────────────────────────
// Replace with your Firebase project credentials
// See: https://console.firebase.google.com/
export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'YOUR_API_KEY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'YOUR_AUTH_DOMAIN',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'YOUR_PROJECT_ID',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'YOUR_STORAGE_BUCKET',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? 'YOUR_SENDER_ID',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? 'YOUR_APP_ID',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? 'YOUR_MEASUREMENT_ID',
};

// ── Firestore Collection Names ────────────────────────────────────────
export const COLLECTIONS = {
  USERS: 'users',
  MEALS: 'meals',
  PAYMENTS: 'payments',
  WEEKLY_REPORTS: 'weeklyReports',
  MONTHLY_REPORTS: 'monthlyReports',
  NOTIFICATIONS: 'notifications',
  SETTINGS: 'settings',
};

// ── Default Values ────────────────────────────────────────────────────
export const DEFAULTS = {
  VEG_PRICE: 80,                        // ₹80 per veg meal
  NON_VEG_PRICE: 100,                   // ₹100 per non-veg meal
  CUTOFF_TIME: '19:00',                 // 7 PM daily cutoff
  DAILY_REMINDER_TIME: '07:00',         // 7 AM daily reminder
  WEEK_START_DAY: 1,                    // Monday
  MAX_USERS: 50,
};

// ── Timing ────────────────────────────────────────────────────────────
export const TIMING = {
  ANIMATION_FAST: 150,
  ANIMATION_NORMAL: 300,
  ANIMATION_SLOW: 500,
  TOAST_DURATION: 3000,
  SPLASH_DURATION: 2500,
};

// ── Meal Type Labels ──────────────────────────────────────────────────
export const MEAL_LABELS = {
  veg: 'Veg',
  'non-veg': 'Non Veg',
  skip: 'Skip Today',
} as const;

export const MEAL_ICONS = {
  veg: '🥦',
  'non-veg': '🍗',
  skip: '⏭️',
} as const;

// ── Days of Week ──────────────────────────────────────────────────────
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ── API Limits ────────────────────────────────────────────────────────
export const LIMITS = {
  MAX_MEAL_HISTORY_DAYS: 90,
  MAX_NOTIFICATIONS: 50,
  MAX_EXPORT_ROWS: 500,
  REALTIME_BATCH_SIZE: 20,
};

// ── Onboarding Slides ─────────────────────────────────────────────────
export const ONBOARDING_SLIDES = [
  {
    id: '1',
    emoji: '🍱',
    title: 'One-Tap Meal Confirmation',
    subtitle: 'Confirm your veg, non-veg or skip in seconds. No more WhatsApp chaos.',
  },
  {
    id: '2',
    emoji: '📊',
    title: 'Automatic Weekly Billing',
    subtitle: 'Your bills are calculated automatically every week. Zero manual work.',
  },
  {
    id: '3',
    emoji: '🔔',
    title: 'Smart Reminders',
    subtitle: 'Never forget your tiffin. Smart daily reminders keep you in the loop.',
  },
];
