/**
 * TiffinFlow Date & Calculation Utilities
 * Core business logic for weekly/monthly meal calculations
 */

import { Meal, WeeklySummary, MonthlySummary, User, DefaultMealPreference, MealType } from '../types';

// ── Date Helpers ───────────────────────────────────────────────────────

/** Format date as 'YYYY-MM-DD' */
export const toDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/** Get today's date string */
export const today = (): string => toDateString(new Date());

/** Parse 'YYYY-MM-DD' string to Date */
export const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/** Get start of week (Monday) for a given date */
export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Get end of week (Sunday) for a given date */
export const getWeekEnd = (date: Date): Date => {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

/** Get array of Date objects for a full week */
export const getWeekDays = (date: Date): Date[] => {
  const start = getWeekStart(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

/** Get start of month */
export const getMonthStart = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
};

/** Get end of month */
export const getMonthEnd = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

/** Get last N weeks' start dates */
export const getLastNWeeks = (n: number): string[] => {
  const dates: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    dates.push(toDateString(getWeekStart(d)));
  }
  return dates;
};

/** Check if a given date is a weekday (Mon–Fri) */
export const isWeekday = (date: Date): boolean => {
  const day = date.getDay();
  return day >= 1 && day <= 5;
};

/** Check if cutoff time has passed for today */
export const isCutoffPassed = (cutoffTime: string): boolean => {
  const now = new Date();
  const [hours, minutes] = cutoffTime.split(':').map(Number);
  const cutoff = new Date();
  cutoff.setHours(hours, minutes, 0, 0);
  return now > cutoff;
};

/** Format time remaining until cutoff */
export const getTimeUntilCutoff = (cutoffTime: string): string => {
  const now = new Date();
  const [hours, minutes] = cutoffTime.split(':').map(Number);
  const cutoff = new Date();
  cutoff.setHours(hours, minutes, 0, 0);
  const diff = cutoff.getTime() - now.getTime();
  if (diff <= 0) return 'Cutoff passed';
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (h > 0) return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
};

// ── Calculation Engine ─────────────────────────────────────────────────

/** Calculate weekly summary for a user from their meals */
export const calculateWeeklySummary = (
  meals: Meal[],
  vegPrice: number,
  nonVegPrice: number
): WeeklySummary => {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(now);

  const weekMeals = meals.filter((m) => {
    const d = parseDate(m.date);
    return d >= weekStart && d <= weekEnd;
  });

  const vegDays = weekMeals.filter((m) => m.mealType === 'veg').length;
  const nonVegDays = weekMeals.filter((m) => m.mealType === 'non-veg').length;
  const skippedDays = weekMeals.filter((m) => m.mealType === 'skip').length;
  const pendingDays = 7 - weekMeals.length;
  const totalAmount = vegDays * vegPrice + nonVegDays * nonVegPrice;

  return {
    weekStart: toDateString(weekStart),
    weekEnd: toDateString(weekEnd),
    vegDays,
    nonVegDays,
    skippedDays,
    pendingDays: Math.max(0, pendingDays),
    totalAmount,
    meals: weekMeals,
  };
};

/** Calculate monthly summary */
export const calculateMonthlySummary = (
  meals: Meal[],
  vegPrice: number,
  nonVegPrice: number,
  month?: number,
  year?: number
): MonthlySummary => {
  const now = new Date();
  const targetMonth = month ?? now.getMonth() + 1;
  const targetYear = year ?? now.getFullYear();

  const monthMeals = meals.filter((m) => {
    const d = parseDate(m.date);
    return d.getMonth() + 1 === targetMonth && d.getFullYear() === targetYear;
  });

  const vegDays = monthMeals.filter((m) => m.mealType === 'veg').length;
  const nonVegDays = monthMeals.filter((m) => m.mealType === 'non-veg').length;
  const skippedDays = monthMeals.filter((m) => m.mealType === 'skip').length;
  const totalAmount = vegDays * vegPrice + nonVegDays * nonVegPrice;

  return {
    month: targetMonth,
    year: targetYear,
    vegDays,
    nonVegDays,
    skippedDays,
    totalAmount,
    paidAmount: 0,    // Calculated from payments collection separately
    pendingAmount: totalAmount,
    meals: monthMeals,
  };
};

/** Apply smart default meal based on user preference */
export const applySmartDefault = (preference: DefaultMealPreference): MealType => {
  switch (preference) {
    case 'always-veg': return 'veg';
    case 'always-non-veg': return 'non-veg';
    case 'flexible': return 'skip'; // flexible users skip if they don't respond
    default: return 'skip';
  }
};

/** Calculate weekly amounts for last N weeks (for chart) */
export const getWeeklyAmountsForChart = (
  meals: Meal[],
  vegPrice: number,
  nonVegPrice: number,
  n = 4
): Array<{ week: string; amount: number; vegDays: number; nonVegDays: number }> => {
  return getLastNWeeks(n).map((weekStartStr) => {
    const weekStart = parseDate(weekStartStr);
    const weekEnd = getWeekEnd(weekStart);
    const weekMeals = meals.filter((m) => {
      const d = parseDate(m.date);
      return d >= weekStart && d <= weekEnd;
    });
    const vegDays = weekMeals.filter((m) => m.mealType === 'veg').length;
    const nonVegDays = weekMeals.filter((m) => m.mealType === 'non-veg').length;
    return {
      week: weekStartStr,
      amount: vegDays * vegPrice + nonVegDays * nonVegPrice,
      vegDays,
      nonVegDays,
    };
  });
};

// ── Formatters ─────────────────────────────────────────────────────────

/** Format amount in Indian Rupees */
export const formatAmount = (amount: number): string => `₹${amount.toLocaleString('en-IN')}`;

/** Format date for display: 'Mon, 27 May' */
export const formatDisplayDate = (dateStr: string): string => {
  const date = parseDate(dateStr);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
};

/** Format week range: '19 May – 25 May' */
export const formatWeekRange = (weekStart: string, weekEnd: string): string => {
  const start = parseDate(weekStart);
  const end = parseDate(weekEnd);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${start.getDate()} ${months[start.getMonth()]} – ${end.getDate()} ${months[end.getMonth()]}`;
};

/** Format month name: 'May 2026' */
export const formatMonth = (month: number, year: number): string => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[month - 1]} ${year}`;
};

/** Get greeting based on time of day */
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

/** Get initials from name */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
