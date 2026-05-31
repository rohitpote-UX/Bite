/**
 * TiffinFlow Firestore Service using Python Backend & SQLite
 * Connects React Native frontend to modular REST APIs with realtime simulation via polling.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBackendUrl } from './auth.service';
import type {
  User, Meal, Payment, WeeklyReport, MonthlyReport,
  AppNotification, OfficeSettings, DashboardStats, MealType, PaymentStatus,
} from '../../types';

// Helper to map camelCase fields to snake_case for DB updates
const mapUserKeys = (data: Partial<User>) => {
  const mapped: any = {};
  const mapping: Record<string, string> = {
    officeId: 'office_id',
    defaultMealPreference: 'default_meal_preference',
    isActive: 'is_active',
    weeklyTotal: 'weekly_total',
    monthlyTotal: 'monthly_total',
    fcmToken: 'fcm_token',
  };
  for (const [key, val] of Object.entries(data)) {
    const mappedKey = mapping[key] || key;
    mapped[mappedKey] = val;
  }
  return mapped;
};

// ── Users ─────────────────────────────────────────────────────────────

export const getUser = async (uid: string): Promise<User | null> => {
  const response = await fetch(`${getBackendUrl()}/auth/profile/${uid}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to retrieve user profile');
  }
  const data = await response.json();
  return {
    ...data,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
  } as User;
};

export const getUsersByOffice = async (officeId: string): Promise<User[]> => {
  const response = await fetch(`${getBackendUrl()}/admin/${officeId}/users`);
  if (!response.ok) {
    throw new Error('Failed to retrieve active users by office');
  }
  const data = await response.json();
  return data.map((u: any) => ({
    ...u,
    createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
    updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
  })) as User[];
};

export const updateUser = async (uid: string, data: Partial<User>) => {
  const mapped = mapUserKeys(data);
  const response = await fetch(`${getBackendUrl()}/auth/profile/${uid}/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mapped),
  });
  if (!response.ok) {
    throw new Error('Failed to update user profile');
  }
};

export const deactivateUser = async (uid: string) => {
  await updateUser(uid, { isActive: false });
};

export const listenToUsers = (officeId: string, callback: (users: User[]) => void) => {
  let isStopped = false;
  const run = async () => {
    try {
      const users = await getUsersByOffice(officeId);
      if (!isStopped) callback(users);
    } catch (err) {
      console.warn('listenToUsers error:', err);
    }
  };
  run();
  const interval = setInterval(run, 5000);
  return () => {
    isStopped = true;
    clearInterval(interval);
  };
};

// ── Meals ─────────────────────────────────────────────────────────────

export const confirmMeal = async (
  userId: string,
  userName: string,
  officeId: string,
  mealType: MealType,
  price: number,
  isAutoDefaulted = false
): Promise<string> => {
  const response = await fetch(`${getBackendUrl()}/meals/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      user_name: userName,
      office_id: officeId,
      meal_type: mealType,
      price: price,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to confirm meal');
  }
  const data = await response.json();
  return data.mealId;
};

export const getTodayMeal = async (userId: string): Promise<Meal | null> => {
  const response = await fetch(`${getBackendUrl()}/meals/today/${userId}`);
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  if (!data) return null;
  return {
    ...data,
    confirmedAt: data.confirmedAt ? new Date(data.confirmedAt) : undefined,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
  } as Meal;
};

export const getUserMeals = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<Meal[]> => {
  const response = await fetch(`${getBackendUrl()}/meals/history/${userId}?startDate=${startDate}&endDate=${endDate}`);
  if (!response.ok) {
    throw new Error('Failed to retrieve user meal history');
  }
  const data = await response.json();
  return data.map((m: any) => ({
    ...m,
    confirmedAt: m.confirmedAt ? new Date(m.confirmedAt) : undefined,
    createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
    updatedAt: m.updatedAt ? new Date(m.updatedAt) : new Date(),
  })) as Meal[];
};

export const listenToTodayOrders = (officeId: string, callback: (meals: Meal[]) => void) => {
  let isStopped = false;
  const run = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/meals/office/${officeId}/today-orders`);
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map((m: any) => ({
          ...m,
          confirmedAt: m.confirmedAt ? new Date(m.confirmedAt) : undefined,
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
          updatedAt: m.updatedAt ? new Date(m.updatedAt) : new Date(),
        }));
        if (!isStopped) callback(mapped);
      }
    } catch (err) {
      console.warn('listenToTodayOrders error:', err);
    }
  };
  run();
  const interval = setInterval(run, 5000);
  return () => {
    isStopped = true;
    clearInterval(interval);
  };
};

export const listenToUserMeal = (userId: string, date: string, callback: (meal: Meal | null) => void) => {
  let isStopped = false;
  const run = async () => {
    try {
      const meal = await getTodayMeal(userId);
      if (meal && meal.date !== date) {
        if (!isStopped) callback(null);
      } else {
        if (!isStopped) callback(meal);
      }
    } catch (err) {
      console.warn('listenToUserMeal error:', err);
    }
  };
  run();
  const interval = setInterval(run, 5000);
  return () => {
    isStopped = true;
    clearInterval(interval);
  };
};

export const getOfficeMealsForDate = async (officeId: string, date: string): Promise<Meal[]> => {
  const response = await fetch(`${getBackendUrl()}/meals/office/${officeId}/today-orders`);
  if (!response.ok) return [];
  const data = await response.json();
  return data
    .filter((m: any) => m.date === date)
    .map((m: any) => ({
      ...m,
      confirmedAt: m.confirmedAt ? new Date(m.confirmedAt) : undefined,
      createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
      updatedAt: m.updatedAt ? new Date(m.updatedAt) : new Date(),
    })) as Meal[];
};

// ── Payments ──────────────────────────────────────────────────────────

export const createPayment = async (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const response = await fetch(`${getBackendUrl()}/payments/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: payment.userId,
      user_name: payment.userName,
      office_id: payment.officeId,
      amount: payment.amount,
      week_start: payment.weekStart || new Date().toISOString().split('T')[0],
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to create payment record');
  }
  const data = await response.json();
  return data.paymentId;
};

export const updatePayment = async (paymentId: string, data: Partial<Payment>) => {
  const response = await fetch(`${getBackendUrl()}/payments/${paymentId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error('Failed to update/verify payment');
  }
};

export const getUserPayments = async (userId: string): Promise<Payment[]> => {
  const response = await fetch(`${getBackendUrl()}/payments/user/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to retrieve user payments');
  }
  const data = await response.json();
  return data.map((p: any) => ({
    ...p,
    createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
    updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
  })) as Payment[];
};

export const getOfficePayments = async (officeId: string, status?: PaymentStatus): Promise<Payment[]> => {
  const response = await fetch(`${getBackendUrl()}/payments/office/${officeId}`);
  if (!response.ok) {
    throw new Error('Failed to retrieve office payments');
  }
  const data = await response.json();
  const payments = data.map((p: any) => ({
    ...p,
    createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
    updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
  })) as Payment[];

  if (status) {
    return payments.filter((p) => p.paymentStatus === status);
  }
  return payments;
};

export const listenToOfficePayments = (officeId: string, callback: (payments: Payment[]) => void) => {
  let isStopped = false;
  const run = async () => {
    try {
      const payments = await getOfficePayments(officeId);
      if (!isStopped) callback(payments);
    } catch (err) {
      console.warn('listenToOfficePayments error:', err);
    }
  };
  run();
  const interval = setInterval(run, 5000);
  return () => {
    isStopped = true;
    clearInterval(interval);
  };
};

// ── Office Settings ───────────────────────────────────────────────────

export const getOfficeSettings = async (officeId: string): Promise<OfficeSettings | null> => {
  const response = await fetch(`${getBackendUrl()}/office/${officeId}/settings`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to retrieve office settings');
  }
  const data = await response.json();
  return {
    ...data,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
  } as OfficeSettings;
};

export const updateOfficeSettings = async (officeId: string, data: Partial<OfficeSettings>) => {
  const response = await fetch(`${getBackendUrl()}/office/${officeId}/settings/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update office settings');
  }
};

export const createOffice = async (settings: Omit<OfficeSettings, 'createdAt' | 'updatedAt'>): Promise<void> => {
  await updateOfficeSettings(settings.id, settings as OfficeSettings);
};

export const listenToOfficeSettings = (officeId: string, callback: (settings: OfficeSettings | null) => void) => {
  let isStopped = false;
  const run = async () => {
    try {
      const settings = await getOfficeSettings(officeId);
      if (!isStopped) callback(settings);
    } catch (err) {
      console.warn('listenToOfficeSettings error:', err);
    }
  };
  run();
  const interval = setInterval(run, 5000);
  return () => {
    isStopped = true;
    clearInterval(interval);
  };
};

// ── Weekly & Monthly Reports (Mock/AsyncStorage backed to prevent breaks) ──────────────────────────────────

export const saveWeeklyReport = async (report: Omit<WeeklyReport, 'id'>): Promise<string> => {
  const id = `${report.officeId}_${report.weekStart}`;
  const reports = await AsyncStorage.getItem('@tf_db_weekly_reports') || '{}';
  const parsed = JSON.parse(reports);
  parsed[id] = { id, ...report, generatedAt: new Date() };
  await AsyncStorage.setItem('@tf_db_weekly_reports', JSON.stringify(parsed));
  return id;
};

export const getWeeklyReport = async (officeId: string, weekStart: string): Promise<WeeklyReport | null> => {
  const id = `${officeId}_${weekStart}`;
  const reports = await AsyncStorage.getItem('@tf_db_weekly_reports');
  if (!reports) return null;
  const parsed = JSON.parse(reports);
  return parsed[id] ?? null;
};

export const getOfficeWeeklyReports = async (officeId: string, limitCount = 8): Promise<WeeklyReport[]> => {
  const reports = await AsyncStorage.getItem('@tf_db_weekly_reports');
  if (!reports) return [];
  const parsed = JSON.parse(reports);
  return (Object.values(parsed) as WeeklyReport[])
    .filter((r) => r.officeId === officeId)
    .slice(0, limitCount);
};

export const saveMonthlyReport = async (report: Omit<MonthlyReport, 'id'>): Promise<string> => {
  const id = `${report.officeId}_${report.year}_${report.month}`;
  const reports = await AsyncStorage.getItem('@tf_db_monthly_reports') || '{}';
  const parsed = JSON.parse(reports);
  parsed[id] = { id, ...report, generatedAt: new Date() };
  await AsyncStorage.setItem('@tf_db_monthly_reports', JSON.stringify(parsed));
  return id;
};

export const getOfficeMonthlyReports = async (officeId: string, limitCount = 6): Promise<MonthlyReport[]> => {
  const reports = await AsyncStorage.getItem('@tf_db_monthly_reports');
  if (!reports) return [];
  const parsed = JSON.parse(reports);
  return (Object.values(parsed) as MonthlyReport[])
    .filter((r) => r.officeId === officeId)
    .slice(0, limitCount);
};

// ── Notifications (Mocked CRUD) ───────────────────────────────────────

export const getUserNotifications = async (userId: string): Promise<AppNotification[]> => {
  return [];
};

export const markNotificationRead = async (notificationId: string) => {
  console.log('markNotificationRead called locally:', notificationId);
};

// ── Dashboard Stats (Realtime) ────────────────────────────────────────

export const listenToDashboardStats = (
  officeId: string,
  totalUsers: number,
  callback: (stats: DashboardStats) => void
) => {
  let isStopped = false;
  const run = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/admin/${officeId}/dashboard-stats?totalUsers=${totalUsers}`);
      if (response.ok) {
        const stats = await response.json();
        if (!isStopped) callback(stats);
      }
    } catch (err) {
      console.warn('listenToDashboardStats error:', err);
    }
  };
  run();
  const interval = setInterval(run, 5000);
  return () => {
    isStopped = true;
    clearInterval(interval);
  };
};
