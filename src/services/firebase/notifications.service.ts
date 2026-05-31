/**
 * TiffinFlow Notifications Service
 * FCM token registration + local scheduled notifications
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { updateFCMToken } from './auth.service';

// ── Configure notification behavior ───────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── Request Permissions ───────────────────────────────────────────────

export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
};

// ── FCM Token Registration ────────────────────────────────────────────

export const registerForPushNotifications = async (userId: string): Promise<string | null> => {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  // Get Expo push token (works in Expo Go + dev builds)
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  });
  const token = tokenData.data;

  // Save token to Firestore
  await updateFCMToken(userId, token);

  // Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('tiffinflow', {
      name: 'TiffinFlow',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B35',
      sound: 'default',
    });
  }

  return token;
};

// ── Schedule Daily Reminder ───────────────────────────────────────────

export const scheduleDailyMealReminder = async (hour = 7, minute = 0): Promise<void> => {
  // Cancel existing reminders first
  await cancelMealReminders();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🍱 Tiffin time!',
      body: 'Will you take tiffin today? Tap to confirm before 7 PM.',
      data: { type: 'meal-reminder' },
      color: '#FF6B35',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });
};

export const cancelMealReminders = async (): Promise<void> => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const mealReminders = scheduled.filter(
    (n) => n.content.data?.type === 'meal-reminder'
  );
  for (const reminder of mealReminders) {
    await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
  }
};

// ── Local Notification Helpers ────────────────────────────────────────

export const sendLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      color: '#FF6B35',
    },
    trigger: null, // immediate
  });
};

// ── Notification Listeners ────────────────────────────────────────────

export const addNotificationReceivedListener = (
  handler: (notification: Notifications.Notification) => void
) => {
  return Notifications.addNotificationReceivedListener(handler);
};

export const addNotificationResponseListener = (
  handler: (response: Notifications.NotificationResponse) => void
) => {
  return Notifications.addNotificationResponseReceivedListener(handler);
};
