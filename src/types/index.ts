/**
 * TiffinFlow — TypeScript Types & Interfaces
 * Complete data model for all Firestore collections
 */

// ── Enums ──────────────────────────────────────────────────────────────
export type UserRole = 'user' | 'admin';
export type MealType = 'veg' | 'non-veg' | 'skip';
export type MealStatus = 'confirmed' | 'pending' | 'auto-defaulted' | 'skipped';
export type PaymentStatus = 'paid' | 'pending' | 'overdue';
export type DefaultMealPreference = 'always-veg' | 'always-non-veg' | 'flexible';
export type NotificationType = 'meal-reminder' | 'payment-reminder' | 'announcement' | 'bill-generated';

// ── Firestore: users collection ────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  photoURL?: string;
  role: UserRole;
  officeId: string;                     // Links to office/admin group
  defaultMealPreference: DefaultMealPreference;
  isActive: boolean;
  weeklyTotal: number;                  // Cached running total for current week
  monthlyTotal: number;                 // Cached running total for current month
  fcmToken?: string;                    // Firebase Cloud Messaging token
  createdAt: Date;
  updatedAt: Date;
}

// ── Firestore: meals collection ────────────────────────────────────────
export interface Meal {
  id: string;
  userId: string;
  userName: string;                     // Denormalized for fast queries
  officeId: string;
  date: string;                         // ISO date string: 'YYYY-MM-DD'
  mealType: MealType;
  status: MealStatus;
  price: number;                        // Price at time of confirmation
  confirmedAt?: Date;                   // When user confirmed
  isAutoDefaulted: boolean;             // True if system applied default
  createdAt: Date;
  updatedAt: Date;
}

// ── Firestore: payments collection ─────────────────────────────────────
export interface Payment {
  id: string;
  userId: string;
  userName: string;
  officeId: string;
  amount: number;
  weekStart?: string;                   // 'YYYY-MM-DD' for weekly payments
  weekEnd?: string;
  month?: number;                       // 1-12 for monthly payments
  year?: number;
  paymentDate?: Date;
  paymentStatus: PaymentStatus;
  screenshotURL?: string;               // Firebase Storage URL
  markedPaidByAdmin: boolean;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Firestore: weeklyReports collection ────────────────────────────────
export interface WeeklyReport {
  id: string;
  officeId: string;
  weekStart: string;                    // 'YYYY-MM-DD'
  weekEnd: string;
  generatedAt: Date;
  totalUsers: number;
  totalVeg: number;
  totalNonVeg: number;
  totalSkipped: number;
  totalPending: number;
  totalRevenue: number;
  userReports: UserWeeklyReport[];
}

export interface UserWeeklyReport {
  userId: string;
  userName: string;
  vegDays: number;
  nonVegDays: number;
  skippedDays: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
}

// ── Firestore: monthlyReports collection ───────────────────────────────
export interface MonthlyReport {
  id: string;
  officeId: string;
  month: number;                        // 1-12
  year: number;
  generatedAt: Date;
  totalUsers: number;
  totalVeg: number;
  totalNonVeg: number;
  totalSkipped: number;
  totalRevenue: number;
  userReports: UserMonthlyReport[];
}

export interface UserMonthlyReport {
  userId: string;
  userName: string;
  vegDays: number;
  nonVegDays: number;
  skippedDays: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  amountPaid: number;
}

// ── Firestore: notifications collection ───────────────────────────────
export interface AppNotification {
  id: string;
  officeId: string;
  userId?: string;                      // If null, sent to all users
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  sentAt: Date;
  data?: Record<string, string>;
}

// ── Firestore: settings collection (per office) ────────────────────────
export interface OfficeSettings {
  id: string;                           // = officeId
  officeName: string;
  adminId: string;
  vegPrice: number;                     // e.g., 80
  nonVegPrice: number;                  // e.g., 100
  cutoffTime: string;                   // '19:00' (24h format)
  weekStartDay: 0 | 1;                  // 0=Sunday, 1=Monday
  dailyReminderTime: string;            // '07:00'
  autoDefaultEnabled: boolean;
  maxUsers: number;
  officeCode: string;                   // Invite code for users to join
  createdAt: Date;
  updatedAt: Date;
}

// ── UI/Local Types ─────────────────────────────────────────────────────
export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  vegDays: number;
  nonVegDays: number;
  skippedDays: number;
  pendingDays: number;
  totalAmount: number;
  meals: Meal[];
}

export interface MonthlySummary {
  month: number;
  year: number;
  vegDays: number;
  nonVegDays: number;
  skippedDays: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  meals: Meal[];
}

export interface DashboardStats {
  totalOrders: number;
  vegCount: number;
  nonVegCount: number;
  skippedCount: number;
  pendingCount: number;
  todayRevenue: number;
  responseRate: number;                 // 0-100 percentage
}

// ── Navigation Types ───────────────────────────────────────────────────
export type AuthStackParamList = {
  splash: undefined;
  onboarding: undefined;
  login: undefined;
  signup: undefined;
  'profile-setup': undefined;
};

// ── Theme ──────────────────────────────────────────────────────────────
export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: {
    background: string;
    surface: string;
    surfaceWarm: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    divider: string;
  };
}
