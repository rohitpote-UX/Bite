/**
 * TiffinFlow Local AsyncStorage Database & Authentication Engine
 * A 100% offline, reactive replacement for Firebase Auth and Firestore.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, UserRole, DefaultMealPreference, Meal, Payment, OfficeSettings, DashboardStats, MealType, PaymentStatus, AppNotification } from '../../types';

// ── In-Memory Database Cache ──────────────────────────────────────────
let cache: {
  users: Record<string, User>;
  settings: Record<string, OfficeSettings>;
  meals: Record<string, Meal>;
  payments: Record<string, Payment>;
  notifications: Record<string, AppNotification>;
} = {
  users: {},
  settings: {},
  meals: {},
  payments: {},
  notifications: {},
};

// ── Observers (Pub/Sub) ────────────────────────────────────────────────
type Callback = (...args: any[]) => void;
const subscribers: Record<string, Set<Callback>> = {};

const subscribe = (key: string, callback: Callback) => {
  if (!subscribers[key]) subscribers[key] = new Set();
  subscribers[key].add(callback);
  return () => {
    subscribers[key].delete(callback);
  };
};

const notify = (key: string, ...args: any[]) => {
  if (subscribers[key]) {
    subscribers[key].forEach((cb) => {
      try {
        cb(...args);
      } catch (err) {
        console.error(`Subscriber notification error for ${key}:`, err);
      }
    });
  }
};

// ── Storage Keys ──────────────────────────────────────────────────────
const STORAGE_KEYS = {
  USERS: '@tf_db_users',
  SETTINGS: '@tf_db_settings',
  MEALS: '@tf_db_meals',
  PAYMENTS: '@tf_db_payments',
  NOTIFICATIONS: '@tf_db_notifications',
  SESSION: '@tf_db_session',
};

// ── Seed / Initialization ─────────────────────────────────────────────
let isInitialized = false;

const seedDatabase = async () => {
  // Pre-seed a default office settings so that User Registration works with invite code "1234"
  const defaultOfficeCode = '1234';
  const defaultOfficeId = '1234';

  if (!cache.settings[defaultOfficeId]) {
    cache.settings[defaultOfficeId] = {
      id: defaultOfficeId,
      officeName: 'Google Bangalore Office',
      adminId: 'mock-admin-uid',
      vegPrice: 80,
      nonVegPrice: 100,
      cutoffTime: '19:00',
      weekStartDay: 1,
      dailyReminderTime: '07:00',
      autoDefaultEnabled: true,
      maxUsers: 50,
      officeCode: defaultOfficeCode,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cache.settings));
  }

  // Pre-seed a default Admin user
  if (!cache.users['mock-admin-uid']) {
    cache.users['mock-admin-uid'] = {
      id: 'mock-admin-uid',
      name: 'Admin Rohit',
      phone: '+919999999999',
      email: 'admin@tiffinflow.com',
      role: 'admin',
      officeId: defaultOfficeId,
      defaultMealPreference: 'flexible',
      isActive: true,
      weeklyTotal: 0,
      monthlyTotal: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cache.users));
  }

  // Pre-seed some sample meals for statistics/analytics visualization
  const userId = 'mock-admin-uid';
  const dates = [];
  const now = new Date();
  for (let i = 0; i < 15; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dates.push(dateStr);
  }

  let mealsAdded = false;
  dates.forEach((date, i) => {
    const mealId = `${userId}_${date}`;
    if (!cache.meals[mealId]) {
      const type: MealType = i % 3 === 0 ? 'veg' : i % 3 === 1 ? 'non-veg' : 'skip';
      cache.meals[mealId] = {
        id: mealId,
        userId,
        userName: 'Admin Rohit',
        officeId: defaultOfficeId,
        date,
        mealType: type,
        status: type === 'skip' ? 'skipped' : 'confirmed',
        price: type === 'veg' ? 80 : type === 'non-veg' ? 100 : 0,
        confirmedAt: new Date(),
        isAutoDefaulted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mealsAdded = true;
    }
  });

  if (mealsAdded) {
    await AsyncStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(cache.meals));
  }
};

export const initDb = async () => {
  if (isInitialized) return;
  try {
    const [usersData, settingsData, mealsData, paymentsData, notificationsData] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.USERS),
      AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
      AsyncStorage.getItem(STORAGE_KEYS.MEALS),
      AsyncStorage.getItem(STORAGE_KEYS.PAYMENTS),
      AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS),
    ]);

    if (usersData) cache.users = JSON.parse(usersData);
    if (settingsData) cache.settings = JSON.parse(settingsData);
    if (mealsData) cache.meals = JSON.parse(mealsData);
    if (paymentsData) cache.payments = JSON.parse(paymentsData);
    if (notificationsData) cache.notifications = JSON.parse(notificationsData);

    await seedDatabase();
    isInitialized = true;
    console.log('📦 Local Offline Database Engine Loaded Successfully');

    // Trigger initial session check
    const savedSession = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
    if (savedSession) {
      const user = JSON.parse(savedSession);
      currentUser = user;
      notify('authChanged', currentUser);
    }
  } catch (err) {
    console.error('Failed to initialize local mock DB:', err);
  }
};

// ── Mock Firebase Auth Client ─────────────────────────────────────────
let currentUser: any = null;

export const mockAuth = {
  currentUser: null as any,
  
  signUp: async (
    email: string,
    name: string,
    phone: string,
    role: UserRole,
    officeCodeOrName: string,
    defaultMealPreference: DefaultMealPreference = 'flexible'
  ) => {
    await initDb();
    const uid = 'local_uid_' + Math.random().toString(36).substring(2, 9);
    let officeId = officeCodeOrName.trim().toLowerCase();

    // User office code validation
    if (role === 'user') {
      const office = Object.values(cache.settings).find(
        (s) => s.officeCode.toUpperCase() === officeCodeOrName.trim().toUpperCase()
      );
      if (!office) {
        throw new Error('Invalid office code. Please check with your admin.');
      }
      officeId = office.id;
    } else {
      // Admin: register new Office Settings
      const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      officeId = generatedCode.toLowerCase();

      cache.settings[officeId] = {
        id: officeId,
        officeName: officeCodeOrName.trim(),
        adminId: uid,
        vegPrice: 80,
        nonVegPrice: 100,
        cutoffTime: '19:00',
        weekStartDay: 1,
        dailyReminderTime: '07:00',
        autoDefaultEnabled: true,
        maxUsers: 100,
        officeCode: generatedCode,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cache.settings));
      notify(`officeSettings_${officeId}`, cache.settings[officeId]);
    }

    // Add user to database
    const newUser: User = {
      id: uid,
      name,
      phone,
      email,
      role,
      officeId,
      defaultMealPreference,
      isActive: true,
      weeklyTotal: 0,
      monthlyTotal: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    cache.users[uid] = newUser;
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cache.users));

    currentUser = { uid, email, displayName: name, phoneNumber: phone };
    mockAuth.currentUser = currentUser;

    await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(currentUser));
    notify('authChanged', currentUser);

    return { user: currentUser };
  },

  signIn: async (email: string) => {
    await initDb();
    const matchedUser = Object.values(cache.users).find(
      (u) => u.email?.trim().toLowerCase() === email.trim().toLowerCase()
    );

    if (!matchedUser) {
      throw new Error('User not found. Please sign up first.');
    }

    currentUser = {
      uid: matchedUser.id,
      email: matchedUser.email,
      displayName: matchedUser.name,
      phoneNumber: matchedUser.phone,
    };
    mockAuth.currentUser = currentUser;

    await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(currentUser));
    notify('authChanged', currentUser);

    return { user: currentUser };
  },

  signOut: async () => {
    currentUser = null;
    mockAuth.currentUser = null;
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
    notify('authChanged', null);
  },

  onAuthStateChanged: (callback: (user: any) => void) => {
    // Initial call
    initDb().then(() => {
      callback(currentUser);
    });
    return subscribe('authChanged', callback);
  },
};

// ── Mock Firestore DB Client ──────────────────────────────────────────
export const mockFirestore = {
  getUser: async (uid: string): Promise<User | null> => {
    await initDb();
    return cache.users[uid] ?? null;
  },

  getUsersByOffice: async (officeId: string): Promise<User[]> => {
    await initDb();
    return Object.values(cache.users).filter((u) => u.officeId === officeId && u.isActive);
  },

  updateUser: async (uid: string, data: Partial<User>) => {
    await initDb();
    if (cache.users[uid]) {
      cache.users[uid] = { ...cache.users[uid], ...data, updatedAt: new Date() };
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cache.users));
      // Notify active users listeners
      const officeId = cache.users[uid].officeId;
      notify(`users_${officeId}`, Object.values(cache.users).filter((u) => u.officeId === officeId && u.isActive));
    }
  },

  listenToUsers: (officeId: string, callback: (users: User[]) => void) => {
    initDb().then(() => {
      const u = Object.values(cache.users).filter((usr) => usr.officeId === officeId && usr.isActive);
      callback(u);
    });
    return subscribe(`users_${officeId}`, callback);
  },

  confirmMeal: async (
    userId: string,
    userName: string,
    officeId: string,
    mealType: MealType,
    price: number,
    isAutoDefaulted = false
  ) => {
    await initDb();
    const date = new Date().toISOString().split('T')[0];
    const mealId = `${userId}_${date}`;

    const newMeal: Meal = {
      id: mealId,
      userId,
      userName,
      officeId,
      date,
      mealType,
      status: mealType === 'skip' ? 'skipped' : 'confirmed',
      price: mealType === 'skip' ? 0 : price,
      confirmedAt: new Date(),
      isAutoDefaulted,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    cache.meals[mealId] = newMeal;
    await AsyncStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(cache.meals));

    // Notify listeners
    notify(`userMeal_${userId}_${date}`, newMeal);
    notify(`todayOrders_${officeId}`, Object.values(cache.meals).filter((m) => m.officeId === officeId && m.date === date));
    notify(`dashboardStats_${officeId}`);

    return mealId;
  },

  getTodayMeal: async (userId: string): Promise<Meal | null> => {
    await initDb();
    const date = new Date().toISOString().split('T')[0];
    return cache.meals[`${userId}_${date}`] ?? null;
  },

  getUserMeals: async (userId: string, startDate: string, endDate: string): Promise<Meal[]> => {
    await initDb();
    return Object.values(cache.meals)
      .filter((m) => m.userId === userId && m.date >= startDate && m.date <= endDate)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  listenToTodayOrders: (officeId: string, callback: (meals: Meal[]) => void) => {
    const dateStr = new Date().toISOString().split('T')[0];
    initDb().then(() => {
      const activeMeals = Object.values(cache.meals).filter(
        (m) => m.officeId === officeId && m.date === dateStr
      );
      callback(activeMeals);
    });
    return subscribe(`todayOrders_${officeId}`, callback);
  },

  listenToUserMeal: (userId: string, date: string, callback: (meal: Meal | null) => void) => {
    initDb().then(() => {
      callback(cache.meals[`${userId}_${date}`] ?? null);
    });
    return subscribe(`userMeal_${userId}_${date}`, callback);
  },

  createPayment: async (paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => {
    await initDb();
    const id = 'pay_id_' + Math.random().toString(36).substring(2, 9);
    const newPayment: Payment = {
      ...paymentData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    cache.payments[id] = newPayment;
    await AsyncStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(cache.payments));
    notify(`payments_${paymentData.officeId}`, Object.values(cache.payments).filter((p) => p.officeId === paymentData.officeId));
    return id;
  },

  updatePayment: async (paymentId: string, data: Partial<Payment>) => {
    await initDb();
    if (cache.payments[paymentId]) {
      cache.payments[paymentId] = { ...cache.payments[paymentId], ...data, updatedAt: new Date() };
      await AsyncStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(cache.payments));
      const officeId = cache.payments[paymentId].officeId;
      notify(`payments_${officeId}`, Object.values(cache.payments).filter((p) => p.officeId === officeId));
    }
  },

  getUserPayments: async (userId: string): Promise<Payment[]> => {
    await initDb();
    return Object.values(cache.payments).filter((p) => p.userId === userId);
  },

  listenToOfficePayments: (officeId: string, callback: (payments: Payment[]) => void) => {
    initDb().then(() => {
      callback(Object.values(cache.payments).filter((p) => p.officeId === officeId));
    });
    return subscribe(`payments_${officeId}`, callback);
  },

  getOfficeSettings: async (officeId: string): Promise<OfficeSettings | null> => {
    await initDb();
    return cache.settings[officeId] ?? null;
  },

  updateOfficeSettings: async (officeId: string, data: Partial<OfficeSettings>) => {
    await initDb();
    if (cache.settings[officeId]) {
      cache.settings[officeId] = { ...cache.settings[officeId], ...data, updatedAt: new Date() };
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cache.settings));
      notify(`officeSettings_${officeId}`, cache.settings[officeId]);
    }
  },

  createOffice: async (settings: OfficeSettings) => {
    await initDb();
    cache.settings[settings.id] = settings;
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cache.settings));
    notify(`officeSettings_${settings.id}`, settings);
  },

  listenToOfficeSettings: (officeId: string, callback: (settings: OfficeSettings | null) => void) => {
    initDb().then(() => {
      callback(cache.settings[officeId] ?? null);
    });
    return subscribe(`officeSettings_${officeId}`, callback);
  },

  getUserNotifications: async (userId: string): Promise<AppNotification[]> => {
    await initDb();
    return Object.values(cache.notifications).filter((n) => n.userId === userId || !n.userId);
  },

  markNotificationRead: async (notificationId: string) => {
    await initDb();
    if (cache.notifications[notificationId]) {
      cache.notifications[notificationId].isRead = true;
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(cache.notifications));
    }
  },

  listenToDashboardStats: (officeId: string, totalUsers: number, callback: (stats: DashboardStats) => void) => {
    const updateStats = () => {
      const dateStr = new Date().toISOString().split('T')[0];
      const meals = Object.values(cache.meals).filter((m) => m.officeId === officeId && m.date === dateStr);
      
      const vegCount = meals.filter((m) => m.mealType === 'veg').length;
      const nonVegCount = meals.filter((m) => m.mealType === 'non-veg').length;
      const skippedCount = meals.filter((m) => m.mealType === 'skip').length;
      const totalOrders = vegCount + nonVegCount;
      const respondedCount = meals.length;
      const pendingCount = Math.max(0, totalUsers - respondedCount);
      const todayRevenue = meals.reduce((sum, m) => sum + (m.price ?? 0), 0);
      const responseRate = totalUsers > 0 ? Math.round((respondedCount / totalUsers) * 100) : 0;

      callback({
        totalOrders,
        vegCount,
        nonVegCount,
        skippedCount,
        pendingCount,
        todayRevenue,
        responseRate,
      });
    };

    // Initial Trigger
    initDb().then(updateStats);

    return subscribe(`dashboardStats_${officeId}`, updateStats);
  },
};

// Auto-run DB init on import
initDb();
